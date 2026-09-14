export const dataModes = ["live", "snapshot", "synthetic"] as const;
export type DataMode = (typeof dataModes)[number];

export const observationBases = [
  "standalone_quarter",
  "year_to_date",
  "annual",
  "point_in_time",
  "unknown",
] as const;
export type ObservationBasis = (typeof observationBases)[number];

export type SourceSnapshotRef = Readonly<{
  id: string;
  mode: DataMode;
  provider: string;
  payloadHash: string;
}>;

export type ObservationRef = Readonly<{
  id: string;
  sourceSnapshotId: string;
  metric: string;
  periodEnd: string;
  basis: ObservationBasis;
  qualityStatus: "valid" | "missing" | "ambiguous_basis" | "invalid_unit" | "invalid_period" | "quarantined";
}>;

export type DatasetManifest = Readonly<{
  id: string;
  mode: DataMode;
  manifestHash: string;
  observationIds: readonly string[];
}>;

export function assertDatasetMode(mode: DataMode, snapshots: readonly SourceSnapshotRef[]): void {
  if (snapshots.some((snapshot) => snapshot.mode !== mode)) {
    throw new Error("Dataset mode cannot mix live, snapshot, and synthetic source snapshots");
  }
}

export function assertObservationLineage(
  observation: ObservationRef,
  snapshots: readonly SourceSnapshotRef[],
): void {
  if (!snapshots.some((snapshot) => snapshot.id === observation.sourceSnapshotId)) {
    throw new Error("Observation must reference an immutable source snapshot");
  }
}
