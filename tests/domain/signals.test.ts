import { describe, expect, it } from "vitest";
import { aggregateCohortSignal, calculateCompanySignal, type CompanyPeriod } from "../../src/domain/signals";

const period = (values: Partial<CompanyPeriod> = {}): CompanyPeriod => ({
  revenue: "100", operatingPnl: "10", operatingCashFlow: "10", totalDebt: "20", totalAssets: "100", basis: "standalone_quarter", ...values,
});

describe("method v0.1 company signals", () => {
  it("matches the documented synthetic risk case", () => {
    const signal = calculateCompanySignal(period({ revenue: "80", operatingPnl: "4", operatingCashFlow: "2", totalDebt: "30" }), period());
    expect(signal.features).toEqual({ revenueGrowth: "-20", operatingMarginChange: "-5", operatingCashFlowMarginChange: "-7.5", debtAssetsChange: "10" });
    expect(signal.riskScore).toBe(100);
    expect(signal.opportunityScore).toBe(0);
  });

  it("supports positive opportunity and inclusive threshold votes", () => {
    const signal = calculateCompanySignal(period({ revenue: "110", operatingPnl: "13.2", operatingCashFlow: "14.3", totalDebt: "10" }), period());
    expect(signal.eligible).toBe(true);
    expect(signal.opportunityScore).toBe(100);
    const exact = calculateCompanySignal(period({ revenue: "90", operatingPnl: "7.2", operatingCashFlow: "6.3", totalDebt: "25" }), period());
    expect(exact.riskScore).toBe(100);
  });

  it("keeps missing, zero and unknown-basis values ineligible", () => {
    expect(calculateCompanySignal(period({ totalDebt: null }), period()).exclusionReasons).toContain("missing_current_total_debt");
    expect(calculateCompanySignal(period({ revenue: "0" }), period()).exclusionReasons).toContain("current_revenue_nonpositive");
    expect(calculateCompanySignal(period({ basis: "unknown" }), period()).exclusionReasons).toContain("unknown_basis");
    expect(calculateCompanySignal(period({ totalDebt: "-1" }), period()).exclusionReasons).toContain("negative_debt");
  });

  it("preserves decimal precision and accepts negative operating cash flow", () => {
    const signal = calculateCompanySignal(period({
      revenue: "10000000000000000.01",
      operatingPnl: "400000000000000.0004",
      operatingCashFlow: "-200000000000000.0002",
      totalDebt: "3000000000000000.003",
      totalAssets: "10000000000000000.01",
    }), period({
      revenue: "10000000000000000.00",
      operatingPnl: "1000000000000000.00",
      operatingCashFlow: "1000000000000000.00",
      totalDebt: "2000000000000000.00",
      totalAssets: "10000000000000000.00",
    }));
    expect(signal.eligible).toBe(true);
    expect(signal.features?.revenueGrowth).toBe("1e-16");
    expect(signal.features?.operatingCashFlowMarginChange).toBe("-12");
  });

  it("aggregates six eligible companies and blocks insufficient cohorts", () => {
    const signals = [100, 75, 75, 50, 25, 0].map((riskScore) => ({ eligible: true, features: null, riskScore, opportunityScore: 0, riskVotes: riskScore / 25, opportunityVotes: 0, exclusionReasons: [] }));
    const cohort = aggregateCohortSignal(signals, 6);
    expect(cohort.riskScore).toBe("54.166666666666666667");
    expect(cohort.riskBreadth).toBe("0.66666666666666666667");
    expect(cohort.label).toBe("risk");
    expect(aggregateCohortSignal(signals, 11).label).toBe("insufficient_data");
    expect(aggregateCohortSignal(signals.slice(0, 4), 4).label).toBe("insufficient_data");
  });

  it("detects mixed and no-broad-signal outcomes", () => {
    const mixed = Array.from({ length: 5 }, (_, index) => ({ eligible: true, features: null, riskScore: index < 3 ? 50 : 0, opportunityScore: index < 3 ? 50 : 0, riskVotes: 0, opportunityVotes: 0, exclusionReasons: [] }));
    expect(aggregateCohortSignal(mixed, 5).label).toBe("mixed");
    const quiet = mixed.map((signal) => ({ ...signal, riskScore: 25, opportunityScore: 25 }));
    expect(aggregateCohortSignal(quiet, 5).label).toBe("no_broad_signal");
  });
});
