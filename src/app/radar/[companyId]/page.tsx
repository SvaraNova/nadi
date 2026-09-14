import Link from "next/link";
import { calculateSignalRun } from "../../../domain/signal-run";

const prior = { revenue: "100", operatingPnl: "10", operatingCashFlow: "10", totalDebt: "20", totalAssets: "100", basis: "standalone_quarter" as const };
const current = { revenue: "80", operatingPnl: "4", operatingCashFlow: "2", totalDebt: "30", totalAssets: "100", basis: "standalone_quarter" as const };

export default async function SignalDetail({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const run = calculateSignalRun("synthetic-dataset-gate-2", [{ companyId, priorObservationIds: ["synthetic-prior-revenue"], currentObservationIds: ["synthetic-current-revenue"], prior, current }]);
  const signal = run.companySignals[companyId];
  return <main className="evidence"><Link href="/radar">Back to radar</Link><p className="eyebrow">SIGNAL DETAIL · SYNTHETIC</p><h1>{companyId}</h1><p>Dataset <code>{run.datasetId}</code> · method {run.methodVersion}</p>{signal.eligible ? <><h2>Scores</h2><p>Risk {signal.riskScore}/100 · Opportunity {signal.opportunityScore}/100</p><h2>Features</h2><dl>{Object.entries(signal.features ?? {}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></> : <><h2>Insufficient data</h2><ul>{signal.exclusionReasons.map((reason) => <li key={reason}>{reason.replaceAll("_", " ")}</li>)}</ul></>}<h2>Calculation lineage</h2><p>Prior observations: {run.inputs[0].priorObservationIds.join(", ")}; current observations: {run.inputs[0].currentObservationIds.join(", ")}.</p></main>;
}
