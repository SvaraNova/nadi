import { describe, expect, it } from "vitest";
import { normalizeQuarterlyPayload, parseQuarterlyRaw } from "../../src/domain/normalize-quarterly";

describe("quarterly normalization", () => {
  it("preserves decimal strings, pointers, missing values and unknown flow basis", () => {
    const result = normalizeQuarterlyPayload([{ symbol: "SYNTH", date: "2026-03-31", revenue: "123456789012345678.90", operating_pnl: null, total_assets: 10 }], { companySymbol: "SYNTH", unit: "currency", currency: "IDR" });
    expect(result.rejectedRows).toEqual([]);
    expect(result.observations.find((item) => item.metric === "revenue")).toMatchObject({ value: "123456789012345678.90", basis: "unknown", qualityStatus: "ambiguous_basis", sourcePointer: "/0/revenue" });
    expect(result.observations.find((item) => item.metric === "operating_pnl")).toMatchObject({ value: null, qualityStatus: "missing" });
    expect(result.observations.find((item) => item.metric === "total_assets")).toMatchObject({ qualityStatus: "valid" });
  });

  it("quarantines invalid rows, dates and unsafe numeric values", () => {
    const result = normalizeQuarterlyPayload([null, { symbol: "SYNTH", date: "2026-02-30", revenue: "1" }, { symbol: "SYNTH", date: "2026-06-30", revenue: Number.MAX_SAFE_INTEGER + 2 }], { companySymbol: "SYNTH", unit: "currency", currency: "IDR", basis: "standalone_quarter" });
    expect(result.rejectedRows).toEqual([{ index: 0, reason: "INVALID_ROW" }, { index: 1, reason: "INVALID_DATE" }, { index: 2, reason: "UNSAFE_NUMBER" }]);
    expect(result.observations.find((item) => item.periodEnd === "2026-06-30" && item.metric === "revenue")).toMatchObject({ value: null, qualityStatus: "quarantined" });
  });
});


it("parses raw JSON decimals losslessly and uses point-in-time balance-sheet basis", () => {
  const raw = '[{"symbol":"SYNTH","date":"2026-03-31","revenue":123456789012345678.90,"total_assets":1e20}]';
  const result = normalizeQuarterlyPayload(parseQuarterlyRaw(raw), { companySymbol: "SYNTH", unit: "currency", currency: "IDR", basis: "standalone_quarter" });
  expect(result.observations[0].value).toBe("123456789012345678.90");
  expect(result.observations[4]).toMatchObject({ value: "100000000000000000000", basis: "point_in_time", periodStart: null });
});

it("rejects invalid envelopes and preserves symbol/period rejection reasons", () => {
  expect(() => normalizeQuarterlyPayload({}, { companySymbol: "SYNTH" })).toThrow("INVALID_QUARTERLY_PAYLOAD");
  const rows = [{ symbol: "OTHER", date: "2026-03-31" }, { symbol: "SYNTH", date: "2026-06-30" }];
  expect(normalizeQuarterlyPayload(rows, { companySymbol: "SYNTH", expectedDates: ["2026-03-31"] }).rejectedRows)
    .toEqual([{ index: 0, reason: "SYMBOL_MISMATCH" }, { index: 1, reason: "UNEXPECTED_PERIOD" }]);
});
