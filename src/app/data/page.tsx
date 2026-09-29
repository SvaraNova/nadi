"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { DataModeBadge } from "../../components/ui/DataModeBadge";
import { IconCopy, IconCheck } from "../../components/ui/Icons";
import { SECTOR_DEFINITIONS } from "../../domain/sectors-dataset";
import { useLanguage } from "../../lib/i18n";

type TabKey = "sources" | "datasets" | "coverage" | "public_indicators" | "methodology" | "glossary";

interface LiveDatasetRow { id: string; manifest_hash: string; data_cutoff: string | null; created_at: string; observation_count: number }
interface LiveSectorRow { id: string; name: string; industry: string; cohortSignal: { eligibleCount: number; totalMembers: number; label: string } }
interface LiveIndicatorRow { name: string; definition: string; source_url: string; publisher: string; value: string | null; unit: string; geography: string; period_start: string; period_end: string; published_at: string; retrieved_at: string; cohort_key: string; relation: string; rationale: string; reviewer: string | null; reviewed_at: string | null }

export default function DataAndMethodPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [activeTab, setActiveTab] = useState<TabKey>("sources");
  const [coverageSearch, setCoverageSearch] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const [datasets, setDatasets] = useState<LiveDatasetRow[]>([]);
  const [liveSectors, setLiveSectors] = useState<LiveSectorRow[]>([]);
  const [indicators, setIndicators] = useState<LiveIndicatorRow[]>([]);
  useEffect(() => {
    void fetch("/api/v1/datasets/live").then((r) => r.ok ? r.json() : null).then((p) => setDatasets(p?.datasets ?? [])).catch(() => setDatasets([]));
    void fetch("/api/signal-runs/live").then((r) => r.ok ? r.json() : null).then((p) => setLiveSectors(p?.sectors ?? [])).catch(() => setLiveSectors([]));
    void fetch("/api/v1/public-indicators/live").then((r) => r.ok ? r.json() : null).then((p) => setIndicators(p?.indicators ?? [])).catch(() => setIndicators([]));
  }, []);

  // Static taxonomy reference: tracked sector/company universe, not a live financial claim.
  const allCompanies = SECTOR_DEFINITIONS.flatMap((s) =>
    s.companies.map((c) => ({
      symbol: c.symbol,
      name: c.name,
      marketCapCategory: c.marketCapCategory,
      cohortName: s.name,
      cohortId: s.id,
      industry: s.industry,
    }))
  );

  const filteredCompanies = allCompanies.filter((c) => {
    if (!coverageSearch.trim()) return true;
    const q = coverageSearch.toLowerCase();
    return (
      c.symbol.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.cohortName.toLowerCase().includes(q)
    );
  });

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedHash(id);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "sources", label: isId ? "Sumber" : "Sources" },
    { key: "datasets", label: isId ? "Dataset" : "Datasets" },
    { key: "coverage", label: isId ? "Cakupan" : "Coverage" },
    { key: "public_indicators", label: isId ? "Indikator Publik" : "Public Indicators" },
    { key: "methodology", label: isId ? "Metodologi" : "Methodology" },
    { key: "glossary", label: isId ? "Glosarium" : "Glossary" },
  ];

  return (
    <AppShell dataMode="live">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span className="badge badge-snapshot">
            {isId ? "Transparansi Sistem" : "System Transparency"}
          </span>
          <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>
            {isId ? "Spesifikasi Metode v0.1" : "Method v0.1 Specification"}
          </span>
        </div>
        <h1>{isId ? "Ruang Kerja Transparansi Data & Metodologi" : "Data & Methodology Transparency Workspace"}</h1>
        <p className="page-subtitle">
          {isId
            ? "Audit asal data (provenance), putaran dataset live, metrik cakupan kohort, pemetaan statistik publik, dan formula deterministik."
            : "Audit ingestion provenance, live dataset runs, cohort coverage metrics, public statistical mappings, and deterministic formulas."}
        </p>
      <div className="flow-guide">
        <strong>{isId ? "Status implementasi saat ini" : "Current implementation status"}</strong>
        <span>{isId ? "Dataset, cakupan kohort, dan indikator publik pada halaman ini dibaca langsung dari PostgreSQL." : "Datasets, cohort coverage, and public indicators on this page are read directly from PostgreSQL."}</span>
        <small>{isId ? "Direktori emiten di bawah adalah taksonomi statis yang menandai sektor yang dipantau, bukan klaim data live." : "The constituent directory below is a static taxonomy marking tracked sectors, not a live data claim."}</small>
      </div>
      </div>

      {/* Segmented Control Navigation */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "24px", background: "var(--white)", padding: "6px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-light)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`btn btn-sm ${activeTab === t.key ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "var(--radius-md)", border: "none", boxShadow: activeTab === t.key ? "var(--shadow-xs)" : "none" }}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Sources */}
      {activeTab === "sources" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <div className="card-eyebrow">
                  {isId ? "Konektor Keterbukaan Keuangan Emiten" : "Corporate Disclosures Connector"}
                </div>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem" }}>Sectors Financial API v2</h2>
                <div style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>
                  {isId
                    ? "Penyedia Utama: Laporan Keuangan Terstandarisasi Perusahaan Tercatat Bursa Efek Indonesia (IDX)"
                    : "Primary Provider: Indonesian Listed Companies (IDX) Standardized Financial Statements"}
                </div>
              </div>
              <span className="badge badge-opportunity">
                {isId ? "Konektor Beroperasi Normal" : "Connector Operational"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", background: "var(--slate-50)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "16px", border: "1px solid var(--border-light)" }}>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>
                  {isId ? "Pola Endpoint" : "Endpoint Pattern"}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--slate-800)", marginTop: "2px" }}>/companies/[symbol]/quarterly</div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>
                  {isId ? "Mode Data" : "Data Mode"}
                </div>
                <div style={{ marginTop: "2px" }}><DataModeBadge mode="live" size="sm" /></div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>
                  {isId ? "Dataset Live Tersimpan" : "Persisted Live Datasets"}
                </div>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>
                  {datasets.length}
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.875rem", color: "var(--slate-700)", lineHeight: 1.6 }}>
              <strong>{isId ? "Ketentuan & Batasan Redistribusi: " : "Terms & Redistribution Boundaries: "}</strong>
              {isId
                ? "Muatan JSON mentah yang diterima dari Sectors API disimpan dalam database snapshot lokal yang tidak dapat diubah dengan hashing integritas SHA-256. Sesuai dengan batasan redistribusi pihak ketiga, antarmuka publik menyajikan metrik ternormalisasi dan garis silsilah perhitungan tanpa mendistribusikan ulang arsip mentah dalam jumlah besar."
                : "Raw JSON payloads returned by Sectors API are persisted in the local immutable snapshot database with SHA-256 integrity hashing. In accordance with redistribution boundaries, public client interfaces expose normalized metrics and calculation lineage rather than redistributing raw third-party bulk files."}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dataset Runs & Hashes */}
      {activeTab === "datasets" && (
        <div className="card">
          <div className="card-eyebrow">
            {isId ? "Buku Besar Ingesti Kriptografis" : "Cryptographic Ingestion Ledger"}
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.15rem" }}>
            {isId ? "Putaran Dataset & Jumlah Observasi" : "Dataset Runs & Observation Counts"}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 16px" }}>
            {isId
              ? "Setiap perhitungan sinyal terikat pada snapshot dataset live yang tidak dapat diubah dengan verifikasi integritas kriptografis."
              : "Every signal calculation is bound to an immutable live dataset snapshot with cryptographic integrity verification."}
          </p>

          {datasets.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--slate-500)" }}>
              {isId ? "Belum ada dataset live tersimpan." : "No live datasets persisted yet."}
            </div>
          ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{isId ? "ID Dataset" : "Dataset ID"}</th>
                    <th scope="col">{isId ? "Hash SHA-256" : "SHA-256 Hash"}</th>
                    <th scope="col">{isId ? "Observasi" : "Observations"}</th>
                    <th scope="col">{isId ? "Batas Data" : "Data Cutoff"}</th>
                    <th scope="col">{isId ? "Dibuat" : "Created"}</th>
                    <th scope="col">{isId ? "Tindakan" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((d) => (
                    <tr key={d.id}>
                      <td><code style={{ fontSize: "0.75rem" }}>{d.id}</code></td>
                      <td><code style={{ fontSize: "0.75rem" }}>{d.manifest_hash.slice(0, 16)}…</code></td>
                      <td className="tabular-nums">{d.observation_count}</td>
                      <td className="tabular-nums">{d.data_cutoff ?? "—"}</td>
                      <td className="tabular-nums">{new Date(d.created_at).toLocaleString(isId ? "id-ID" : "en-US")}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCopy(d.manifest_hash, d.id)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          {copiedHash === d.id ? (<><IconCheck size={12} /> {isId ? "Tersalin" : "Copied"}</>) : (<><IconCopy size={12} /> {isId ? "Salin hash" : "Copy hash"}</>)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Tab 3: Universe & Coverage Explorer */}
      {activeTab === "coverage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Cohort Summary */}
          <div className="card">
            <div className="card-eyebrow">{isId ? "Kelengkapan Sampel" : "Sample Completeness"}</div>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.15rem" }}>
              {isId ? "Cakupan Kohort Live" : "Live Cohort Coverage"}
            </h2>

            {liveSectors.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--slate-500)" }}>
                {isId ? "Belum ada kohort live tersedia." : "No live cohorts available yet."}
              </div>
            ) : (
            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{isId ? "Nama Kohort" : "Cohort Name"}</th>
                    <th scope="col">{isId ? "Total Populasi" : "Total Universe"}</th>
                    <th scope="col">{isId ? "Entitas Memenuhi Syarat" : "Eligible Entities"}</th>
                    <th scope="col">{isId ? "% Cakupan" : "Coverage %"}</th>
                    <th scope="col">{isId ? "Hasil Sinyal" : "Signal Result"}</th>
                  </tr>
                </thead>
                <tbody>
                  {liveSectors.map((s) => {
                    const pct = s.cohortSignal.totalMembers > 0 ? (100 * s.cohortSignal.eligibleCount / s.cohortSignal.totalMembers) : 0;
                    return (
                      <tr key={s.id}>
                        <td><strong>{s.name}</strong></td>
                        <td className="tabular-nums">{s.cohortSignal.totalMembers}</td>
                        <td className="tabular-nums">{s.cohortSignal.eligibleCount}</td>
                        <td className="tabular-nums">
                          <strong style={{ color: pct >= 60 ? "var(--opp-700)" : "var(--risk-700)" }}>
                            {pct.toFixed(1)}% {pct >= 60 ? (isId ? "(Valid)" : "(Valid)") : (isId ? "(Tidak Memadai)" : "(Insufficient)")}
                          </strong>
                        </td>
                        <td>{s.cohortSignal.label.replaceAll("_", " ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Interactive Universe Search */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div className="card-eyebrow">{isId ? "Direktori Emiten (Taksonomi Statis)" : "Constituent Directory (Static Taxonomy)"}</div>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>
                  {isId
                    ? `Perusahaan Tercatat Terindeks (${filteredCompanies.length} Entitas)`
                    : `Indexed Indonesian Listed Companies (${filteredCompanies.length} Entities)`}
                </h3>
              </div>
              <input
                type="search"
                placeholder={isId ? "Cari kode saham atau nama emiten..." : "Search ticker or company name..."}
                className="form-input"
                value={coverageSearch}
                onChange={(e) => setCoverageSearch(e.target.value)}
                style={{ width: "260px" }}
              />
            </div>

            <div className="table-container" style={{ margin: 0, maxHeight: "360px", overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{isId ? "Kode" : "Ticker"}</th>
                    <th scope="col">{isId ? "Nama Entitas" : "Entity Name"}</th>
                    <th scope="col">{isId ? "Kohort Sektor" : "Sector Cohort"}</th>
                    <th scope="col">{isId ? "Industri" : "Industry"}</th>
                    <th scope="col">{isId ? "Tingkat Kapitalisasi" : "Market Cap Tier"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((c) => (
                    <tr key={c.symbol}>
                      <td><strong className="tabular-nums">{c.symbol}</strong></td>
                      <td>{c.name}</td>
                      <td>{c.cohortName}</td>
                      <td style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>{c.industry}</td>
                      <td><span className="badge badge-neutral">{c.marketCapCategory}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Public Macro Context */}
      {activeTab === "public_indicators" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {indicators.length === 0 ? (
            <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--slate-500)" }}>
              {isId ? "Belum ada indikator publik tersimpan." : "No public indicators persisted yet."}
            </div>
          ) : indicators.map((ind) => (
            <div className="card" key={`${ind.source_url}-${ind.period_end}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div className="card-eyebrow">{isId ? "Deret Statistik Resmi" : "Official Statistical Series"}</div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "1.15rem" }}>{ind.name}</h2>
                  <div style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>{isId ? "Penerbit: " : "Publisher: "}{ind.publisher}</div>
                </div>
                <span className={`badge ${ind.relation === "not_comparable" || !ind.reviewer ? "badge-insufficient" : "badge-live"}`}>
                  {isId ? "Telaah: " : "Review: "}{ind.reviewer ? ind.relation.replaceAll("_", " ") : (isId ? "Tidak Dapat Dibandingkan Langsung" : "Not Comparable")}
                </span>
              </div>
              <div style={{ background: "var(--slate-50)", padding: "16px", borderRadius: "var(--radius-md)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "16px", border: "1px solid var(--border-light)" }}>
                <div><strong>{isId ? "Wilayah:" : "Geography:"}</strong> {ind.geography}</div>
                <div><strong>{isId ? "Nilai Dilaporkan:" : "Reported Value:"}</strong> <span className="tabular-nums" style={{ fontWeight: 700 }}>{ind.value ?? "—"} {ind.unit}</span></div>
                <div><strong>{isId ? "Periode:" : "Period:"}</strong> {ind.period_start} – {ind.period_end} ({isId ? "Dipublikasikan " : "Published "}{ind.published_at})</div>
                {ind.reviewer && <div><strong>{isId ? "Penelaah Ahli:" : "Human Reviewer:"}</strong> {ind.reviewer} ({ind.reviewed_at})</div>}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--slate-700)", lineHeight: 1.6 }}>
                <strong>{isId ? "Kohort: " : "Cohort: "}</strong>{ind.cohort_key} · {ind.rationale}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Methodology Specification */}
      {activeTab === "methodology" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card">
            <div className="card-eyebrow">{isId ? "Spesifikasi Matematika" : "Mathematical Specification"}</div>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>
              {isId ? "Metodologi Sinyal NADI v0.1 (Heuristik Deterministik)" : "NADI Signal Methodology v0.1 (Deterministic Heuristic)"}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--slate-600)", margin: "0 0 18px" }}>
              {isId
                ? "NADI menghitung sinyal tingkat sektor melalui aritmatika desimal transparan. LLM tidak menghasilkan skor atau mengubah ambang batas."
                : "NADI calculates sector-level signals through transparent decimal arithmetic. The LLM does not generate scores or modify thresholds."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "0.875rem", lineHeight: 1.6 }}>
              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>
                  {isId ? "A. Empat Pendorong Keuangan Utama" : "A. The Four Core Financial Drivers"}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "12px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    <strong>{isId ? "1. Pertumbuhan Pendapatan YoY:" : "1. Revenue Growth YoY:"}</strong>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary-800)", marginTop: "4px" }}>
                      100 * (current_rev - prior_rev) / |prior_rev|
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    <strong>{isId ? "2. Perubahan Margin Operasi:" : "2. Operating Margin Δ:"}</strong>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary-800)", marginTop: "4px" }}>
                      100 * (current_pnl / current_rev - prior_pnl / prior_rev)
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    <strong>{isId ? "3. Perubahan Margin Arus Kas Operasi (OCF):" : "3. OCF Margin Δ:"}</strong>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary-800)", marginTop: "4px" }}>
                      100 * (current_ocf / current_rev - prior_ocf / prior_rev)
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    <strong>{isId ? "4. Perubahan Utang terhadap Aset:" : "4. Debt-to-Assets Δ:"}</strong>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary-800)", marginTop: "4px" }}>
                      100 * (current_debt / current_assets - prior_debt / prior_assets)
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>
                  {isId ? "B. Matriks Ambang Batas Numerik" : "B. Numerical Threshold Matrix"}
                </h3>
                <div className="table-container" style={{ margin: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>{isId ? "Faktor Pendorong" : "Driver"}</th>
                        <th>{isId ? "Ambang Risiko" : "Risk Threshold"}</th>
                        <th>{isId ? "Ambang Peluang" : "Opportunity Threshold"}</th>
                        <th>{isId ? "Kontribusi Skor" : "Score Contribution"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>{isId ? "Pertumbuhan Pendapatan" : "Revenue Growth"}</strong></td>
                        <td>&le; {isId ? "-10,0%" : "-10.0%"}</td>
                        <td>&ge; {isId ? "+10,0%" : "+10.0%"}</td>
                        <td>{isId ? "25 poin" : "25 points"}</td>
                      </tr>
                      <tr>
                        <td><strong>{isId ? "Perubahan Margin Operasi" : "Operating Margin Change"}</strong></td>
                        <td>&le; {isId ? "-2,0 pp" : "-2.0 pp"}</td>
                        <td>&ge; {isId ? "+2,0 pp" : "+2.0 pp"}</td>
                        <td>{isId ? "25 poin" : "25 points"}</td>
                      </tr>
                      <tr>
                        <td><strong>{isId ? "Perubahan Margin OCF" : "OCF Margin Change"}</strong></td>
                        <td>&le; {isId ? "-3,0 pp" : "-3.0 pp"}</td>
                        <td>&ge; {isId ? "+3,0 pp" : "+3.0 pp"}</td>
                        <td>{isId ? "25 poin" : "25 points"}</td>
                      </tr>
                      <tr>
                        <td><strong>{isId ? "Perubahan Utang terhadap Aset" : "Debt-to-Assets Change"}</strong></td>
                        <td>&ge; {isId ? "+5,0 pp" : "+5.0 pp"}</td>
                        <td>&le; {isId ? "-5,0 pp" : "-5.0 pp"}</td>
                        <td>{isId ? "25 poin" : "25 points"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === "glossary" && (
        <div className="card">
          <div className="card-eyebrow">{isId ? "Bahasa Produk" : "Product language"}</div>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.2rem" }}>{isId ? "Glosarium NADI" : "NADI glossary"}</h2>
          <p style={{ color: "var(--slate-600)", marginTop: 0 }}>{isId ? "Definisi singkat untuk membaca alur radar sampai brief." : "Short definitions for reading the radar-to-brief workflow."}</p>
          <dl className="glossary-grid">
            {(isId ? [
              ["Signal", "Pola perubahan fundamental yang dihitung secara deterministik."],
              ["Kelompok perusahaan", "Perusahaan yang dibandingkan dalam satu sektor atau industri."],
              ["Cakupan data", "Proporsi perusahaan dengan input yang cukup untuk dihitung."],
              ["Sebaran pola", "Proporsi perusahaan yang menunjukkan arah signal yang sama."],
              ["Evidence", "Observasi atau perhitungan yang mendukung suatu klaim."],
              ["Counterevidence", "Evidence yang menantang atau membatasi interpretasi utama."],
              ["Mode data", "Penanda apakah data berasal dari live atau snapshot tersimpan."],
              ["Brief", "Ringkasan yang menggabungkan observasi, interpretasi, bukti, dan keterbatasan."],
            ] : [
              ["Signal", "A deterministically calculated pattern in company fundamentals."],
              ["Company group", "Companies compared within one sector or industry."],
              ["Coverage", "The share of companies with enough inputs to calculate."],
              ["Breadth", "The share of companies showing the same signal direction."],
              ["Evidence", "An observation or calculation supporting a claim."],
              ["Counterevidence", "Evidence that challenges or limits the main interpretation."],
              ["Data mode", "Whether data is live or a persisted stored snapshot."],
              ["Brief", "A reviewable summary of observations, interpretations, evidence, and limits."],
            ]).map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}
          </dl>
        </div>
      )}
    </AppShell>
  );
}
