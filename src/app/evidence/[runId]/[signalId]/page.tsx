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
  let databaseError = false;
  try {
    evidence = await readEvidence(pool, runId, signalId);
    comparison = evidence ? await readPublicComparison(pool, "energy-coal", evidence.run.config_json?.target ?? "") : null;
  } catch (error) {
    databaseError = true;
    console.error("Evidence database unavailable", error);
  } finally {
    await pool.end();
  }
  if (databaseError) {
    return (
      <main className="evidence">
        <Link href={`/radar?run=${runId}`}>Back to stored radar</Link>
        <p className="eyebrow">STORED EVIDENCE</p>
        <h1>Evidence temporarily unavailable</h1>
        <p>The database connection timed out while loading this evidence record. The stored signal was not changed.</p>
        <p>Retry after the database is available.</p>
      </main>
    );
  }
  if (!evidence) notFound();
  const { run, company, rows } = evidence;
  return <main className="evidence">
    <Link href={`/radar?run=${runId}`}>Back to stored radar</Link>
    <p className="eyebrow">{run.mode.toUpperCase()} · STORED EVIDENCE</p>
    <h1>{company.symbol}</h1>
    <div className="evidence-summary">
      <div><span>Periode analisis</span><strong>{run.config_json?.target ?? "Tidak diketahui"}</strong></div>
      <div><span>Periode pembanding</span><strong>{run.config_json?.prior ?? "Tidak diketahui"}</strong></div>
      <div><span>Data diambil</span><strong>{run.data_cutoff ?? "Tidak diketahui"}</strong></div>
    </div>
    <p>Skor ini menjelaskan perubahan fundamental perusahaan, bukan kondisi ekonomi nasional atau prediksi krisis.</p>
    <h2>Ringkasan hasil</h2>
    <div className="evidence-result">
      <div><span>Risiko</span><strong>{company.result.riskScore ?? "Tidak tersedia"}</strong></div>
      <div><span>Peluang</span><strong>{company.result.opportunityScore ?? "Tidak tersedia"}</strong></div>
    </div>
    {company.result.exclusionReasons.length > 0 && <ul>{company.result.exclusionReasons.map(reason => <li key={reason}>{reason.replaceAll("_", " ")}</li>)}</ul>}
    <dl>{Object.entries(company.result.features ?? {}).map(([key, value]) => <div key={key}><dt>{key.replaceAll(/([A-Z])/g, " $1").replace(/^./, letter => letter.toUpperCase())}</dt><dd>{value} {key === "revenueGrowth" ? "%" : "poin persentase"}</dd></div>)}</dl>
    <h2>Bukti perhitungan</h2>
    <p>Pendapatan, laba operasi, arus kas, utang, dan aset dibandingkan antara periode analisis dan periode pembanding. Nilai asli dan sumbernya tersedia di bawah.</p>
    <div className="table-scroll" role="region" aria-label="Stored observations" tabIndex={0}><table><caption>Nilai laporan yang dipakai untuk menghitung skor</caption><thead><tr><th scope="col">Periode</th><th scope="col">Metrik</th><th scope="col">Nilai</th><th scope="col">Kualitas</th><th scope="col">Detail</th></tr></thead><tbody>{rows.map(row => <tr key={`${row.role}-${row.id}`}><td>{row.role === "current" ? "Analisis" : "Pembanding"} · {row.period}</td><th scope="row">{row.metric.replaceAll("_", " ")}</th><td>{row.value ?? "Tidak diketahui"} {row.currency ?? ""} ({row.unit ?? "satuan tidak diketahui"})</td><td>{row.quality_status}</td><td><a href={`#observation-${row.id}`}>Lihat sumber</a></td></tr>)}</tbody></table></div>
    <h2>Detail sumber data</h2>
    <p>Bagian ini berisi informasi audit untuk memverifikasi asal setiap angka. Buka detail bila diperlukan.</p>
    {rows.map(row => <section id={`observation-${row.id}`} key={`${row.role}-${row.id}`}><h3>{row.metric.replaceAll("_", " ")} · {row.period}</h3><p><strong>Sumber:</strong> {row.provider} · diambil {row.retrieved_at}</p><p><strong>Basis laporan:</strong> {row.basis} · periode mulai {row.start ?? "tidak tersedia"} · status {row.quality_status}</p><details><summary>Lihat detail teknis provenance</summary><p>ID observasi: <code>{row.id}</code> · revisi {row.revision}</p><p>ID snapshot: <code>{row.source_snapshot_id}</code> · lokasi data: <code>{row.source_pointer}</code></p><p>SHA-256: <code>{row.payload_hash}</code></p></details>{row.provider === "sectors" ? <p className="evidence-source-note">Sumber provider memerlukan autentikasi dan tidak dibuka langsung dari browser.</p> : publicSourceUrl(row.source_url) ? <a href={publicSourceUrl(row.source_url)!} rel="noreferrer">Buka sumber asli</a> : <p>Link sumber tidak tersedia</p>}</section>)}
    <section><h2>Perbandingan indikator publik</h2>{comparison ? <><p><strong>{comparison.status.replaceAll("_", " ")}</strong></p><p>{comparison.indicator.name} · {comparison.indicator.geography} · {comparison.indicator.period_start} sampai {comparison.indicator.period_end} · nilai {comparison.indicator.value ?? "tidak diketahui"} {comparison.indicator.unit}</p><p>{comparison.indicator.definition} Penerbit: {comparison.indicator.publisher}. Diterbitkan {comparison.indicator.published_at}; diambil {comparison.indicator.retrieved_at}.</p><p>{comparison.mapping.rationale}</p>{publicSourceUrl(comparison.indicator.source_url) && <a href={comparison.indicator.source_url} rel="noreferrer">Buka sumber resmi</a>}</> : <><p><strong>Tidak dapat dibandingkan</strong></p><p>Tidak ada indikator untuk periode ini. Pendapatan perusahaan tidak dapat disamakan langsung dengan output atau tingkat pekerjaan nasional.</p></>}</section>
  </main>;
}
