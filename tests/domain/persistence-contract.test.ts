import { describe, expect, it } from "vitest";
import { assertDatasetMode, assertObservationLineage } from "../../src/domain/persistence-contract";

const live = { id: "snapshot-live", mode: "live" as const, provider: "sectors", payloadHash: "a".repeat(64) };
const synthetic = { id: "snapshot-synthetic", mode: "synthetic" as const, provider: "fixture", payloadHash: "b".repeat(64) };

describe("persistence provenance boundaries", () => {
  it("rejects mixed dataset modes", () => {
    expect(() => assertDatasetMode("live", [live, synthetic])).toThrow(/cannot mix/);
    expect(() => assertDatasetMode("live", [live])).not.toThrow();
  });

  it("requires observation lineage to resolve to a snapshot", () => {
    expect(() => assertObservationLineage({
      id: "observation-1",
      sourceSnapshotId: "snapshot-live",
      metric: "revenue",
      periodEnd: "2026-03-31",
      basis: "standalone_quarter",
      qualityStatus: "valid",
    }, [live])).not.toThrow();
    expect(() => assertObservationLineage({
      id: "observation-2",
      sourceSnapshotId: "missing",
      metric: "revenue",
      periodEnd: "2026-03-31",
      basis: "unknown",
      qualityStatus: "missing",
    }, [live])).toThrow(/immutable source snapshot/);
  });
});
