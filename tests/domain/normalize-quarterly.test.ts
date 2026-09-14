import { describe, expect, it } from "vitest";
import { normalizeQuarterlyPayload } from "../../src/domain/normalize-quarterly";

describe("quarterly normalization", () => {
  it("preserves decimal strings, pointers, missing values and unknown flow basis", () => {
    const result = normalizeQuarterlyPayload([{ date: "2026-03-31", revenue: "123456789012345678.90", operating_pnl: null, total_assets: 10 }], { companySymbol: "AADI.JK" });
    expect(result.rejectedRows).toEqual([]);
    expect(result.observations.find((item) => item.metric === "revenue")).toMatchObject({ value: "123456789012345678.90", basis: "unknown", qualityStatus: "ambiguous_basis", sourcePointer: "/0/revenue" });
    expect(result.observations.find((item) => item.metric === "operating_pnl")).toMatchObject({ value: null, qualityStatus: "missing" });
    expect(result.observations.find((item) => item.metric === "total_assets")).toMatchObject({ qualityStatus: "valid" });
  });

  it("quarantines invalid rows, dates and unsafe numeric values", () => {
    const result = normalizeQuarterlyPayload([null, { date: "2026-02-30", revenue: "1" }, { date: "2026-06-30", revenue: Number.MAX_SAFE_INTEGER + 2 }], { companySymbol: "SYNTH", basis: "standalone_quarter" });
    expect(result.rejectedRows).toEqual([{ index: 0, reason: "INVALID_ROW" }, { index: 1, reason: "INVALID_DATE" }, { index: 2, reason: "UNSAFE_NUMBER" }]);
    expect(result.observations.find((item) => item.periodEnd === "2026-06-30" && item.metric === "revenue")).toMatchObject({ value: null, qualityStatus: "quarantined" });
  });
});
