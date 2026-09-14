import { describe, expect, it } from "vitest";
import { comparisonStatus } from "../../src/domain/public-comparison";
describe("public comparison review gate", () => {
  it("keeps an unreviewed mapping not comparable", () => expect(comparisonStatus({ cohortKey: "energy-coal", relation: "not_comparable", rationale: "Pending review", reviewer: null, reviewedAt: null, version: "0.1" })).toBe("not_comparable"));
  it("allows an explicitly reviewed relation", () => expect(comparisonStatus({ cohortKey: "energy-coal", relation: "aligned_direction", rationale: "Reviewed", reviewer: "reviewer", reviewedAt: "2026-09-14T00:00:00Z", version: "0.1" })).toBe("aligned_direction"));
});
