import { describe, expect, it } from "vitest";
import { calculateSignalRun } from "../../src/domain/signal-run";

const period = (revenue: string) => ({ revenue, operatingPnl: "10", operatingCashFlow: "10", totalDebt: "20", totalAssets: "100", basis: "standalone_quarter" as const });

describe("persistable signal runs", () => {
  it("reconstructs a deterministic result with dataset and observation lineage", () => {
    const run = calculateSignalRun("dataset-1", [{ companyId: "company-1", priorObservationIds: ["o1", "o2"], currentObservationIds: ["o3", "o4"], prior: period("100"), current: period("120") }]);
    expect(run.datasetId).toBe("dataset-1");
    expect(run.methodVersion).toBe("0.1");
    expect(run.configHash).toMatch(/^[a-f0-9]{64}$/);
    expect(run.companySignals["company-1"].eligible).toBe(true);
  });

  it("rejects results without immutable input references", () => {
    expect(() => calculateSignalRun("dataset-1", [{ companyId: "company-1", priorObservationIds: [], currentObservationIds: ["o2"], prior: period("100"), current: period("120") }])).toThrow(/lineage/);
  });
});
