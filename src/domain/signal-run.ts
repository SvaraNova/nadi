import { createHash } from "node:crypto";
import { aggregateCohortSignal, calculateCompanySignal, METHOD_VERSION, type CompanyPeriod, type CompanySignal, type CohortSignal } from "./signals";

export type SignalInput = Readonly<{
  companyId: string;
  priorObservationIds: readonly string[];
  currentObservationIds: readonly string[];
  prior: CompanyPeriod;
  current: CompanyPeriod;
}>;

export type SignalRun = Readonly<{
  datasetId: string;
  methodVersion: string;
  configHash: string;
  inputs: readonly SignalInput[];
  companySignals: Readonly<Record<string, CompanySignal>>;
  cohortSignal: CohortSignal;
}>;

export function signalConfigHash(): string {
  return createHash("sha256").update(JSON.stringify({ methodVersion: METHOD_VERSION, thresholds: "method-v0.1" })).digest("hex");
}

export function calculateSignalRun(datasetId: string, inputs: readonly SignalInput[], totalMembers = inputs.length, membershipComplete = true): SignalRun {
  if (!datasetId) throw new Error("missing_dataset_id");
  const companySignals: Record<string, CompanySignal> = {};
  for (const input of inputs) {
    if (!input.companyId || input.priorObservationIds.length === 0 || input.currentObservationIds.length === 0) throw new Error("missing_signal_lineage");
    if (companySignals[input.companyId]) throw new Error("duplicate_company");
    companySignals[input.companyId] = calculateCompanySignal(input.current, input.prior);
  }
  return { datasetId, methodVersion: METHOD_VERSION, configHash: signalConfigHash(), inputs, companySignals, cohortSignal: aggregateCohortSignal(Object.values(companySignals), totalMembers, membershipComplete) };
}
