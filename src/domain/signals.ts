import Decimal from "decimal.js";

export const METHOD_VERSION = "0.1" as const;
const HUNDRED = new Decimal(100);
const RISK_THRESHOLDS = [new Decimal(-10), new Decimal(-2), new Decimal(-3), new Decimal(5)] as const;
const OPPORTUNITY_THRESHOLDS = [new Decimal(10), new Decimal(2), new Decimal(3), new Decimal(-5)] as const;

type DecimalInput = string;
export type CompanyPeriod = Readonly<{
  revenue: DecimalInput | null;
  operatingPnl: DecimalInput | null;
  operatingCashFlow: DecimalInput | null;
  totalDebt: DecimalInput | null;
  totalAssets: DecimalInput | null;
  basis: "standalone_quarter" | "year_to_date" | "annual" | "point_in_time" | "unknown";
}>;

export type Features = Readonly<{
  revenueGrowth: string;
  operatingMarginChange: string;
  operatingCashFlowMarginChange: string;
  debtAssetsChange: string;
}>;

export type CompanySignal = Readonly<{
  eligible: boolean;
  features: Features | null;
  riskScore: number | null;
  opportunityScore: number | null;
  riskVotes: number;
  opportunityVotes: number;
  exclusionReasons: readonly string[];
}>;

export type CohortSignal = Readonly<{
  eligibleCount: number;
  totalMembers: number;
  coverage: string;
  riskScore: string | null;
  opportunityScore: string | null;
  riskBreadth: string | null;
  opportunityBreadth: string | null;
  label: "risk" | "opportunity" | "mixed" | "no_broad_signal" | "insufficient_data";
  exclusionReasons: readonly string[];
}>;

function decimal(value: string | null, field: string): Decimal {
  if (value === null) throw new Error(`missing_${field}`);
  try {
    const parsed = new Decimal(value);
    if (!parsed.isFinite()) throw new Error(`invalid_${field}`);
    return parsed;
  } catch {
    throw new Error(`invalid_${field}`);
  }
}

function percentageChange(current: Decimal, prior: Decimal): Decimal {
  return HUNDRED.mul(current.sub(prior)).div(prior.abs());
}

function marginChange(currentValue: Decimal, currentRevenue: Decimal, priorValue: Decimal, priorRevenue: Decimal): Decimal {
  return HUNDRED.mul(currentValue.div(currentRevenue).sub(priorValue.div(priorRevenue)));
}

function asFeatureValues(values: [Decimal, Decimal, Decimal, Decimal]): Features {
  return {
    revenueGrowth: values[0].toString(),
    operatingMarginChange: values[1].toString(),
    operatingCashFlowMarginChange: values[2].toString(),
    debtAssetsChange: values[3].toString(),
  };
}

export function calculateCompanySignal(current: CompanyPeriod, prior: CompanyPeriod): CompanySignal {
  const exclusionReasons: string[] = [];
  if (current.basis === "unknown" || prior.basis === "unknown") exclusionReasons.push("unknown_basis");
  if (current.basis !== prior.basis) exclusionReasons.push("basis_mismatch");

  let values: [Decimal, Decimal, Decimal, Decimal, Decimal, Decimal, Decimal, Decimal] | null = null;
  try {
    const rCurrent = decimal(current.revenue, "current_revenue");
    const rPrior = decimal(prior.revenue, "prior_revenue");
    const opCurrent = decimal(current.operatingPnl, "current_operating_pnl");
    const opPrior = decimal(prior.operatingPnl, "prior_operating_pnl");
    const ocfCurrent = decimal(current.operatingCashFlow, "current_operating_cash_flow");
    const ocfPrior = decimal(prior.operatingCashFlow, "prior_operating_cash_flow");
    const debtCurrent = decimal(current.totalDebt, "current_total_debt");
    const debtPrior = decimal(prior.totalDebt, "prior_total_debt");
    const assetsCurrent = decimal(current.totalAssets, "current_total_assets");
    const assetsPrior = decimal(prior.totalAssets, "prior_total_assets");
    if (rPrior.lte(0)) exclusionReasons.push("prior_revenue_nonpositive");
    if (rCurrent.lte(0)) exclusionReasons.push("current_revenue_nonpositive");
    if (assetsPrior.lte(0)) exclusionReasons.push("prior_assets_nonpositive");
    if (assetsCurrent.lte(0)) exclusionReasons.push("current_assets_nonpositive");
    if (debtPrior.lt(0) || debtCurrent.lt(0)) exclusionReasons.push("negative_debt");
    values = [
      percentageChange(rCurrent, rPrior),
      marginChange(opCurrent, rCurrent, opPrior, rPrior),
      marginChange(ocfCurrent, rCurrent, ocfPrior, rPrior),
      HUNDRED.mul(debtCurrent.div(assetsCurrent).sub(debtPrior.div(assetsPrior))),
      rCurrent, rPrior, assetsCurrent, assetsPrior,
    ];
  } catch (error) {
    const reason = error instanceof Error ? error.message : "invalid_value";
    exclusionReasons.push(reason);
  }

  if (exclusionReasons.length > 0 || values === null) {
    return { eligible: false, features: null, riskScore: null, opportunityScore: null, riskVotes: 0, opportunityVotes: 0, exclusionReasons };
  }

  const featureValues = values.slice(0, 4) as [Decimal, Decimal, Decimal, Decimal];
  const riskVotes = [
    featureValues[0].lte(RISK_THRESHOLDS[0]),
    featureValues[1].lte(RISK_THRESHOLDS[1]),
    featureValues[2].lte(RISK_THRESHOLDS[2]),
    featureValues[3].gte(RISK_THRESHOLDS[3]),
  ].filter(Boolean).length;
  const opportunityVotes = [
    featureValues[0].gte(OPPORTUNITY_THRESHOLDS[0]),
    featureValues[1].gte(OPPORTUNITY_THRESHOLDS[1]),
    featureValues[2].gte(OPPORTUNITY_THRESHOLDS[2]),
    featureValues[3].lte(OPPORTUNITY_THRESHOLDS[3]),
  ].filter(Boolean).length;
  return {
    eligible: true,
    features: asFeatureValues(featureValues),
    riskScore: 25 * riskVotes,
    opportunityScore: 25 * opportunityVotes,
    riskVotes,
    opportunityVotes,
    exclusionReasons: [],
  };
}

export function aggregateCohortSignal(signals: readonly CompanySignal[], totalMembers: number, membershipComplete = true): CohortSignal {
  if (!Number.isInteger(totalMembers) || totalMembers < 0 || totalMembers < signals.length) throw new Error("invalid_total_members");
  const eligible = signals.filter((signal) => signal.eligible);
  const coverage = totalMembers === 0 ? new Decimal(0) : new Decimal(eligible.length).div(totalMembers);
  const exclusions = signals.flatMap((signal) => signal.exclusionReasons);
  if (!membershipComplete || eligible.length < 5 || coverage.lt(new Decimal("0.60"))) {
    if (!membershipComplete) exclusions.push("incomplete_membership");
    return { eligibleCount: eligible.length, totalMembers, coverage: coverage.toString(), riskScore: null, opportunityScore: null, riskBreadth: null, opportunityBreadth: null, label: "insufficient_data", exclusionReasons: [...new Set(exclusions)] };
  }
  const riskFlagged = eligible.filter((signal) => (signal.riskScore ?? 0) >= 50).length;
  const opportunityFlagged = eligible.filter((signal) => (signal.opportunityScore ?? 0) >= 50).length;
  const riskBreadth = new Decimal(riskFlagged).div(eligible.length);
  const opportunityBreadth = new Decimal(opportunityFlagged).div(eligible.length);
  const riskScore = new Decimal(eligible.reduce((sum, signal) => sum + (signal.riskScore ?? 0), 0)).div(eligible.length);
  const opportunityScore = new Decimal(eligible.reduce((sum, signal) => sum + (signal.opportunityScore ?? 0), 0)).div(eligible.length);
  const riskPresent = riskBreadth.gte(new Decimal("0.60"));
  const opportunityPresent = opportunityBreadth.gte(new Decimal("0.60"));
  const label = riskPresent && opportunityPresent ? "mixed" : riskPresent ? "risk" : opportunityPresent ? "opportunity" : "no_broad_signal";
  return { eligibleCount: eligible.length, totalMembers, coverage: coverage.toString(), riskScore: riskScore.toString(), opportunityScore: opportunityScore.toString(), riskBreadth: riskBreadth.toString(), opportunityBreadth: opportunityBreadth.toString(), label, exclusionReasons: [...new Set(exclusions)] };
}
