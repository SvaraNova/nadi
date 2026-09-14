import Link from "next/link";
import StoredRadar from "./stored";
import { calculateSignalRun, type SignalInput } from "../../domain/signal-run";

const base = { operatingPnl: "10", operatingCashFlow: "10", totalDebt: "20", totalAssets: "100", basis: "standalone_quarter" as const };
const inputs: SignalInput[] = Array.from({ length: 5 }, (_, index) => ({
  companyId: `synthetic-company-${index + 1}`,
  priorObservationIds: [`synthetic-prior-${index + 1}-revenue`, `synthetic-prior-${index + 1}-profit`],
  currentObservationIds: [`synthetic-current-${index + 1}-revenue`, `synthetic-current-${index + 1}-profit`],
  prior: { ...base, revenue: "100" },
  current: { ...base, revenue: index < 3 ? "80" : "110" },
}));
const run = calculateSignalRun("synthetic-dataset-gate-2", inputs);

export default async function RadarPage({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const { run: storedId } = await searchParams;
  if (storedId) return <StoredRadar id={storedId} />;
  const cohort = run.cohortSignal;
  return <main className="evidence">
    <Link href="/">NADI home</Link>
    <p className="eyebrow">RADAR · SYNTHETIC DATASET</p>
    <h1>Signal radar</h1>
    <p>This development view reads one immutable dataset/run shape. It is synthetic and does not claim live provider coverage.</p>
    <section aria-labelledby="status-title"><h2 id="status-title">Run status</h2><p>Method {run.methodVersion} · dataset <code>{run.datasetId}</code> · config <code>{run.configHash.slice(0, 12)}…</code></p><p><strong>{cohort.label.replaceAll("_", " ")}</strong> · coverage {cohort.coverage} · {cohort.eligibleCount}/{cohort.totalMembers} eligible</p></section>
    <section aria-labelledby="companies-title"><h2 id="companies-title">Companies</h2><table><thead><tr><th>Company</th><th>Risk</th><th>Opportunity</th><th>State</th></tr></thead><tbody>{inputs.map((input) => { const signal = run.companySignals[input.companyId]; return <tr key={input.companyId}><th scope="row"><Link href={`/radar/${input.companyId}`}>{input.companyId}</Link></th><td>{signal.riskScore ?? "—"}</td><td>{signal.opportunityScore ?? "—"}</td><td>{signal.eligible ? "eligible" : "insufficient data"}</td></tr>; })}</tbody></table></section>
  </main>;
}
