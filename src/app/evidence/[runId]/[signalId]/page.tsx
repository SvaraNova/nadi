import Link from "next/link";
import { notFound } from "next/navigation";
import { Pool } from "pg";
import { readEvidence, readPublicComparison, publicSourceUrl } from "../../../../server/repositories/evidence";

export const dynamic = "force-dynamic";
export default async function PersistedEvidence({ params }: { params: Promise<{ runId: string; signalId: string }> }) {
  const { runId, signalId } = await params;
  if (![runId, signalId].every(id => /^[0-9a-f-]{36}$/i.test(id))) notFound();
  if (!process.env.DATABASE_URL) return <main><h1>Evidence unavailable</h1><p>The database connection is not configured.</p></main>;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  let evidence, comparison;
  try { evidence = await readEvidence(pool, runId, signalId); comparison = evidence ? await readPublicComparison(pool, "energy-coal", evidence.run.config_json?.target ?? "") : null; }
  finally { await pool.end(); }
  if (!evidence) notFound();
  const { run, company, rows } = evidence;
  return <main className="evidence">
    <Link href={`/radar?run=${runId}`}>Back to stored radar</Link>
    <p className="eyebrow">{run.mode === "synthetic" ? "SYNTHETIC DEMO" : run.mode.toUpperCase()} · STORED EVIDENCE</p>
    <h1>{company.symbol}</h1>
    <p>Run <code>{run.id}</code> · dataset <code>{run.dataset_id}</code> · method {run.method_version}</p>
    <p>Target {run.config_json?.target ?? "Unknown"} · prior {run.config_json?.prior ?? "Unknown"} · retrieval cutoff {run.data_cutoff ?? "Unknown"}</p>
    <p>Persistence across adjacent periods: {run.config_json?.persistence ?? "unavailable"}. Scores describe this company, not national conditions or crisis probability.</p>
    <h2>Stored result</h2><p>Risk: {company.result.riskScore ?? "Unavailable"} · Opportunity: {company.result.opportunityScore ?? "Unavailable"}</p>
    <ul>{company.result.exclusionReasons.map(reason => <li key={reason}>{reason.replaceAll("_", " ")}</li>)}</ul>
    <dl>{Object.entries(company.result.features ?? {}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value} {key === "revenueGrowth" ? "%" : "percentage points"}</dd></div>)}</dl>
    <h2>Calculation inputs and sources</h2><p>Revenue growth = 100 × (current − prior) / |prior|. Margin changes = 100 × (current metric / current revenue − prior metric / prior revenue). Debt/assets change = 100 × (current debt / current assets − prior debt / prior assets).</p>
    <div className="table-scroll" role="region" aria-label="Stored observations" tabIndex={0}><table><caption>Exact decimal inputs; unknown values remain unknown</caption><thead><tr><th scope="col">Period</th><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Quality</th><th scope="col">Source</th></tr></thead><tbody>{rows.map(row => <tr key={`${row.role}-${row.id}`}><td>{row.role} · {row.period}</td><th scope="row">{row.metric}</th><td>{row.value ?? "Unknown"} {row.currency} ({row.unit ?? "unknown unit"})</td><td>{row.quality_status}</td><td><a href={`#observation-${row.id}`}>Inspect source</a></td></tr>)}</tbody></table></div>
    {rows.map(row => <section id={`observation-${row.id}`} key={`${row.role}-${row.id}`}><h3>{row.metric} · {row.period}</h3><p>Observation {row.id} · revision {row.revision}. Period start {row.start ?? "Not applicable/unknown"}; basis {row.basis}.</p><p>Snapshot {row.source_snapshot_id} · pointer <code>{row.source_pointer}</code> · provider {row.provider}</p><p>Retrieved {row.retrieved_at} · published/available {row.available_at ?? "Unknown"}</p><p>SHA-256 <code>{row.payload_hash}</code></p>{publicSourceUrl(row.source_url) ? <a href={publicSourceUrl(row.source_url)!} rel="noreferrer">Source reference</a> : <p>Source link unavailable</p>}</section>)}
    <section><h2>Public comparison</h2>{comparison ? <><p><strong>{comparison.status.replaceAll("_", " ")}</strong></p><p>{comparison.indicator.name} · {comparison.indicator.geography} · {comparison.indicator.period_start} to {comparison.indicator.period_end} · value {comparison.indicator.value ?? "Unknown"} {comparison.indicator.unit}</p><p>{comparison.indicator.definition} Publisher: {comparison.indicator.publisher}. Published {comparison.indicator.published_at}; retrieved {comparison.indicator.retrieved_at}.</p><p>{comparison.mapping.rationale}</p>{publicSourceUrl(comparison.indicator.source_url) && <a href={comparison.indicator.source_url} rel="noreferrer">Official source</a>}</> : <><p><strong>not comparable</strong></p><p>No indicator record is available for this run period. Corporate revenue cannot be equated to real output or employment.</p></>}</section>
  </main>;
}
