import Link from "next/link";
import { notFound } from "next/navigation";
import { Pool } from "pg";
import { readRun } from "../../server/repositories/evidence";
import { AppShell } from "../../components/layout/AppShell";
import { DataModeBadge } from "../../components/ui/DataModeBadge";
import { IconArrowRight } from "../../components/ui/Icons";
import type { Route } from "next";
import { LiveInvestigationButton } from "../../components/ui/LiveInvestigationButton";

export default async function StoredRadar({ id }: { id: string }) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  if (!process.env.DATABASE_URL) return <AppShell dataMode="live"><div className="card"><h1>Radar unavailable</h1><p>The database connection is not configured.</p></div></AppShell>;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  let context;
  try { context = await readRun(pool, id); } finally { await pool.end(); }
  if (!context) notFound();
  const { run, companies } = context;
  const cohort = run.cohort_result;
  const period = run.config_json?.target ?? "Unknown period";
  return <AppShell dataMode="live" activePeriod={period}>
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}><DataModeBadge mode="live" size="sm" /><span className="badge badge-snapshot">STORED RUN</span></div>
          <h1>Signal radar</h1>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <LiveInvestigationButton signalRunId={id} />
          <Link href={`/radar/${id}/live-cohort` as Route} className="btn btn-secondary">Open detail <IconArrowRight size={15} /></Link>
        </div>
      </div>
      <section className="orientation-panel live-run-explainer" style={{ marginBottom: "20px" }}>
        <div className="orientation-intro">
          <span className="orientation-kicker">LIVE SIGNAL RUN</span>
          <h2>Hasil pemantauan live tersimpan</h2>
          <p>Data keuangan di bawah berasal dari Sectors API, sudah dihitung oleh metode NADI v0.1, dan disimpan sebagai snapshot yang dapat diaudit.</p>
        </div>
        <dl className="run-metadata">
          <div><dt>Periode laporan</dt><dd>{period}</dd></div>
          <div><dt>Status</dt><dd><span className="badge badge-live">Berhasil dihitung</span></dd></div>
          <div><dt>Cakupan</dt><dd>{companies.length} perusahaan terhubung</dd></div>
          <div><dt>Referensi audit</dt><dd><code>{id.slice(0, 8)}…</code></dd></div>
        </dl>
      </section>
      <section className="metric-grid" aria-label="Signal summary">
        <div className="metric-card"><span className="metric-label">Cohort result</span><strong>{cohort.label.replaceAll("_", " ")}</strong><small>{cohort.eligibleCount}/{cohort.totalMembers} eligible · coverage {cohort.coverage}</small></div>
        <div className="metric-card"><span className="metric-label">Risk score</span><strong>{cohort.riskScore ?? "Unavailable"}</strong><small>Breadth {cohort.riskBreadth ?? "—"}</small></div>
        <div className="metric-card"><span className="metric-label">Opportunity score</span><strong>{cohort.opportunityScore ?? "Unavailable"}</strong><small>Breadth {cohort.opportunityBreadth ?? "—"}</small></div>
      </section>
      <section className="card" style={{ marginTop: "20px", padding: "24px" }}>
        <div className="section-heading"><div><span className="eyebrow">COMPANY SIGNALS</span><h2>Evidence-linked results</h2></div><span className="badge badge-neutral">{companies.length} companies</span></div>
        <div className="table-container"><div className="table-scroll"><table><thead><tr><th>Company</th><th>Risk</th><th>Opportunity</th><th>Evidence</th></tr></thead><tbody>{companies.map(company => <tr key={company.id}><td><strong>{company.symbol}</strong></td><td>{company.result.riskScore ?? "—"}</td><td>{company.result.opportunityScore ?? "—"}</td><td><Link href={`/evidence/${id}/${company.id}` as Route} className="text-link">View evidence <IconArrowRight size={13} /></Link></td></tr>)}</tbody></table></div></div>
      </section>
    </div>
  </AppShell>;
}
