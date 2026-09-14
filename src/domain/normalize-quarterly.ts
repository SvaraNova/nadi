import type { ObservationBasis } from "./persistence-contract";

const metrics = ["revenue", "operating_pnl", "operating_cash_flow", "total_debt", "total_assets"] as const;
export type QuarterlyMetric = (typeof metrics)[number];

export type NormalizedObservation = Readonly<{
  companySymbol: string;
  metric: QuarterlyMetric;
  value: string | null;
  periodEnd: string;
  basis: ObservationBasis;
  qualityStatus: "valid" | "missing" | "ambiguous_basis" | "invalid_period" | "quarantined";
  sourcePointer: string;
}>;

export type RejectedQuarterlyRow = Readonly<{
  index: number;
  reason: "INVALID_ROW" | "INVALID_DATE" | "INVALID_VALUE" | "UNSAFE_NUMBER";
}>;

export type QuarterlyNormalization = Readonly<{
  observations: readonly NormalizedObservation[];
  rejectedRows: readonly RejectedQuarterlyRow[];
}>;

type Options = Readonly<{ companySymbol: string; basis?: ObservationBasis }>;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function decimalString(value: unknown): { value: string; reason?: RejectedQuarterlyRow["reason"] } | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    if (!/^-?(?:\d+|\d+\.\d+)$/.test(value)) return { value: "", reason: "INVALID_VALUE" };
    return { value };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { value: "", reason: "INVALID_VALUE" };
    if (!Number.isSafeInteger(value)) return { value: "", reason: "UNSAFE_NUMBER" };
    return { value: String(value) };
  }
  return { value: "", reason: "INVALID_VALUE" };
}

export function normalizeQuarterlyPayload(payload: unknown, options: Options): QuarterlyNormalization {
  const rows = Array.isArray(payload) ? payload : [];
  const observations: NormalizedObservation[] = [];
  const rejectedRows: RejectedQuarterlyRow[] = [];
  rows.forEach((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      rejectedRows.push({ index, reason: "INVALID_ROW" });
      return;
    }
    const record = row as Record<string, unknown>;
    if (!validDate(record.date)) {
      rejectedRows.push({ index, reason: "INVALID_DATE" });
      return;
    }
    const basis = options.basis ?? "unknown";
    for (const metric of metrics) {
      const parsed = decimalString(record[metric]);
      const qualityStatus = parsed?.reason === "UNSAFE_NUMBER" ? "quarantined" : parsed?.reason ? "quarantined" : parsed ? basis === "unknown" && metric !== "total_debt" && metric !== "total_assets" ? "ambiguous_basis" : "valid" : "missing";
      observations.push({ companySymbol: options.companySymbol, metric, value: parsed?.reason ? null : parsed?.value ?? null, periodEnd: record.date, basis, qualityStatus, sourcePointer: `/${index}/${metric}` });
      if (parsed?.reason) rejectedRows.push({ index, reason: parsed.reason });
    }
  });
  return { observations, rejectedRows };
}
