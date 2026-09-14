import { parse } from "lossless-json";
import Decimal from "decimal.js";
import type { ObservationBasis } from "./persistence-contract";

const metrics = ["revenue", "operating_pnl", "operating_cash_flow", "total_debt", "total_assets"] as const;
export type QuarterlyMetric = (typeof metrics)[number];
export type NormalizedObservation = Readonly<{
  companySymbol: string; metric: QuarterlyMetric; value: string | null;
  periodEnd: string; periodStart: string | null; basis: ObservationBasis;
  unit: string | null; currency: string | null;
  qualityStatus: "valid" | "missing" | "ambiguous_basis" | "invalid_unit" | "quarantined";
  sourcePointer: string;
}>;
export type RejectedQuarterlyRow = Readonly<{
  index: number; reason: "INVALID_ROW" | "INVALID_DATE" | "INVALID_VALUE" | "UNSAFE_NUMBER" | "SYMBOL_MISMATCH" | "UNEXPECTED_PERIOD" | "DUPLICATE_PERIOD";
}>;
export type QuarterlyNormalization = Readonly<{
  observations: readonly NormalizedObservation[]; rejectedRows: readonly RejectedQuarterlyRow[];
}>;
export type NormalizationOptions = Readonly<{
  companySymbol: string; basis?: ObservationBasis; unit?: string; currency?: string;
  expectedDates?: readonly string[];
}>;
function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseQuarterlyRaw(raw: string): unknown {
  // Retain numeric lexemes as decimal strings, including values beyond JS safe integers.
  try { return parse(raw, undefined, { parseNumber: (value) => value }); }
  catch { throw new Error("INVALID_QUARTERLY_JSON"); }
}

function decimalString(value: unknown): { value: string; reason?: RejectedQuarterlyRow["reason"] } | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) return { value: "", reason: "UNSAFE_NUMBER" };
    return { value: String(value) };
  }
  if (typeof value !== "string" || value.length > 200 || !/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d{1,3})?$/.test(value)) {
    return { value: "", reason: "INVALID_VALUE" };
  }
  return { value: /[eE]/.test(value) ? new Decimal(value).toFixed() : value };
}

export function normalizeQuarterlyPayload(payload: unknown, options: NormalizationOptions): QuarterlyNormalization {
  if (!Array.isArray(payload) || payload.length === 0) throw new Error("INVALID_QUARTERLY_PAYLOAD");
  const observations: NormalizedObservation[] = [];
  const rejectedRows: RejectedQuarterlyRow[] = [];
  const seen = new Set<string>();
  payload.forEach((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      rejectedRows.push({ index, reason: "INVALID_ROW" }); return;
    }
    const record = row as Record<string, unknown>;
    if (!validDate(record.date)) { rejectedRows.push({ index, reason: "INVALID_DATE" }); return; }
    if (record.symbol !== options.companySymbol) { rejectedRows.push({ index, reason: "SYMBOL_MISMATCH" }); return; }
    if (options.expectedDates && !options.expectedDates.includes(record.date)) { rejectedRows.push({ index, reason: "UNEXPECTED_PERIOD" }); return; }
    if (seen.has(record.date)) { rejectedRows.push({ index, reason: "DUPLICATE_PERIOD" }); return; }
    seen.add(record.date);
    for (const metric of metrics) {
      const stock = metric === "total_debt" || metric === "total_assets";
      const basis = stock ? "point_in_time" : options.basis ?? "unknown";
      const parsed = decimalString(record[metric]);
      let qualityStatus: NormalizedObservation["qualityStatus"] = "valid";
      if (!parsed) qualityStatus = "missing";
      else if (parsed.reason) qualityStatus = "quarantined";
      else if (!options.unit || !options.currency) qualityStatus = "invalid_unit";
      else if (!stock && (basis === "unknown" || basis === "point_in_time")) qualityStatus = "ambiguous_basis";
      const quarterStart = `${record.date.slice(0,4)}-${String(Math.floor((Number(record.date.slice(5,7))-1)/3)*3+1).padStart(2,"0")}-01`;
      const periodStart = stock || basis === "unknown" ? null : basis === "standalone_quarter" ? quarterStart : `${record.date.slice(0,4)}-01-01`;
      observations.push({ companySymbol: options.companySymbol, metric, value: parsed?.reason ? null : parsed?.value ?? null,
        periodEnd: record.date, periodStart, basis, qualityStatus, sourcePointer: `/${index}/${metric}`,
        unit: options.unit ?? null, currency: options.currency ?? null });
      if (parsed?.reason) rejectedRows.push({ index, reason: parsed.reason });
    }
  });
  return { observations, rejectedRows };
}
