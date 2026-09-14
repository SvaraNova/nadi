import Link from "next/link";
import { notFound } from "next/navigation";
import { Pool } from "pg";
import { readRun } from "../../server/repositories/evidence";

export default async function StoredRadar({ id }: { id: string }) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  if (!process.env.DATABASE_URL) return <main><h1>Radar unavailable</h1><p>The database connection is not configured.</p></main>;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  let context;
  try { context = await readRun(pool, id); } finally { await pool.end(); }
  if (!context) notFound();
  const { run, companies } = context, cohort = run.cohort_result;
  return <main className="evidence"><Link href="/">NADI home</Link><p className="eyebrow">{run.mode === "synthetic" ? "SYNTHETIC DEMO" : run.mode.toUpperCase()} · STORED RUN</p><h1>Signal radar</h1><p>Run {id} · dataset {run.dataset_id} · method {run.method_version}</p><p>{run.config_json?.target ?? "Unknown period"} · {cohort.label.replaceAll("_", " ")} · {cohort.eligibleCount}/{cohort.totalMembers} eligible · coverage {cohort.coverage}</p><p>Risk {cohort.riskScore ?? "Unavailable"} · Opportunity {cohort.opportunityScore ?? "Unavailable"} · Risk breadth {cohort.riskBreadth ?? "Unavailable"} · Opportunity breadth {cohort.opportunityBreadth ?? "Unavailable"}</p><ul>{companies.map(company => <li key={company.id}><Link href={`/evidence/${id}/${company.id}` as never}>{company.symbol}: risk {company.result.riskScore ?? "Unavailable"}, opportunity {company.result.opportunityScore ?? "Unavailable"}</Link></li>)}</ul></main>;
}
