"use client";

import { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { DataModeBadge } from "../../components/ui/DataModeBadge";
import { IconCopy, IconCheck } from "../../components/ui/Icons";
import { SECTOR_DEFINITIONS } from "../../domain/sectors-dataset";
import { useLanguage } from "../../lib/i18n";

type TabKey = "sources" | "datasets" | "coverage" | "public_indicators" | "methodology";

export default function DataAndMethodPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [activeTab, setActiveTab] = useState<TabKey>("sources");
  const [coverageSearch, setCoverageSearch] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Flatten all tracked constituents
  const allCompanies = SECTOR_DEFINITIONS.flatMap((s) =>
    s.companies.map((c) => ({
      ...c,
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
    { key: "sources", label: isId ? "1. Sumber & Aliran Data" : "1. Data Sources & Feeds" },
    { key: "datasets", label: isId ? "2. Putaran Dataset & Hash" : "2. Dataset Runs & Hashes" },
    { key: "coverage", label: isId ? "3. Alam Semesta & Cakupan" : "3. Universe & Coverage" },
    { key: "public_indicators", label: isId ? "4. Konteks Makro Publik" : "4. Public Macro Context" },
    { key: "methodology", label: isId ? "5. Spesifikasi Matematika Metode v0.1" : "5. Method v0.1 Math Spec" },
  ];

  return (
    <AppShell dataMode="synthetic">
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
            ? "Audit asal data (provenance), putaran dataset historis, metrik cakupan kohort, pemetaan statistik publik, dan formula deterministik."
            : "Audit ingestion provenance, historical dataset runs, cohort coverage metrics, public statistical mappings, and deterministic formulas."}
        </p>
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
                <div style={{ marginTop: "2px" }}><DataModeBadge mode="synthetic" size="sm" /></div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>
                  {isId ? "Populasi Emiten" : "Constituent Universe"}
                </div>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>
                  {isId ? "31 Entitas Tercatat di Indonesia" : "31 Listed Indonesian Entities"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>
                  {isId ? "Status Kuota API" : "API Quota State"}
                </div>
                <div style={{ fontWeight: 700, color: "var(--opp-700)", marginTop: "2px" }}>
                  {isId ? "Sisa 41 / Batas 50" : "41 Remaining / 50 Cap"}
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
              ? "Setiap perhitungan sinyal terikat pada snapshot dataset yang tidak dapat diubah dengan verifikasi integritas kriptografis."
              : "Every signal calculation is bound to an immutable dataset snapshot with cryptographic integrity verification."}
          </p>

          <div className="table-container" style={{ margin: 0 }}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{isId ? "ID Dataset" : "Dataset ID"}</th>
                    <th scope="col">{isId ? "Status" : "Status"}</th>
                    <th scope="col">{isId ? "Snapshot Sumber / Hash SHA-256" : "Source Snapshot / SHA-256 Hash"}</th>
                    <th scope="col">{isId ? "Observasi Valid" : "Valid Observations"}</th>
                    <th scope="col">{isId ? "Ditolak" : "Rejected"}</th>
                    <th scope="col">{isId ? "Waktu" : "Timestamp"}</th>
                    <th scope="col">{isId ? "Tindakan" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>synthetic-dataset-v0.1</code></td>
                    <td>
                      <span className="badge badge-opportunity btn-sm">
                        {isId ? "SELESAI" : "COMPLETED"}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: "0.75rem" }}>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
                    </td>
                    <td className="tabular-nums">{isId ? "60 baris" : "60 rows"}</td>
                    <td className="tabular-nums">{isId ? "0 ditolak" : "0 rejected"}</td>
                    <td className="tabular-nums">2026-09-15 08:00 WIB</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopy("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "ds1")}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        {copiedHash === "ds1" ? (
                          <>
                            <IconCheck size={12} /> {isId ? "Tersalin" : "Copied"}
                          </>
                        ) : (
                          <>
                            <IconCopy size={12} /> {isId ? "Salin Hash" : "Copy Hash"}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><code>dataset-energy-coal-demo</code></td>
                    <td>
                      <span className="badge badge-opportunity btn-sm">
                        {isId ? "SELESAI" : "COMPLETED"}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: "0.75rem" }}>a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0</code>
                    </td>
                    <td className="tabular-nums">{isId ? "60 baris" : "60 rows"}</td>
                    <td className="tabular-nums">{isId ? "0 ditolak" : "0 rejected"}</td>
                    <td className="tabular-nums">2026-09-14 18:30 WIB</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopy("a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0", "ds2")}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        {copiedHash === "ds2" ? (
                          <>
                            <IconCheck size={12} /> {isId ? "Tersalin" : "Copied"}
                          </>
                        ) : (
                          <>
                            <IconCopy size={12} /> {isId ? "Salin Hash" : "Copy Hash"}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Universe & Coverage Explorer */}
      {activeTab === "coverage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Cohort Summary */}
          <div className="card">
            <div className="card-eyebrow">{isId ? "Kelengkapan Sampel" : "Sample Completeness"}</div>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.15rem" }}>
              {isId ? "Cakupan Kohort & Aturan Dasar Akuntansi" : "Cohort Coverage & Accounting Basis Rules"}
            </h2>

            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{isId ? "Nama Kohort" : "Cohort Name"}</th>
                    <th scope="col">{isId ? "Total Populasi" : "Total Universe"}</th>
                    <th scope="col">{isId ? "Entitas Memenuhi Syarat" : "Eligible Entities"}</th>
                    <th scope="col">{isId ? "% Cakupan" : "Coverage %"}</th>
                    <th scope="col">{isId ? "Dasar Akuntansi" : "Accounting Basis"}</th>
                    <th scope="col">{isId ? "Mata Uang" : "Currency"}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{isId ? "Energi — Pertambangan Batubara" : "Energy — Coal Mining & Quarrying"}</strong></td>
                    <td className="tabular-nums">7</td>
                    <td className="tabular-nums">6</td>
                    <td className="tabular-nums"><strong style={{ color: "var(--opp-700)" }}>{isId ? "85,7% (Valid)" : "85.7% (Valid)"}</strong></td>
                    <td>{isId ? "Kuartal Mandiri" : "Standalone Quarter"}</td>
                    <td>{isId ? "Dinormalisasi ke IDR" : "IDR Normalized"}</td>
                  </tr>
                  <tr>
                    <td><strong>{isId ? "Barang Konsumsi Pokok — Makanan & Minuman" : "Consumer Staples — Food & Beverage"}</strong></td>
                    <td className="tabular-nums">6</td>
                    <td className="tabular-nums">5</td>
                    <td className="tabular-nums"><strong style={{ color: "var(--opp-700)" }}>{isId ? "83,3% (Valid)" : "83.3% (Valid)"}</strong></td>
                    <td>{isId ? "Kuartal Mandiri" : "Standalone Quarter"}</td>
                    <td>{isId ? "Dinormalisasi ke IDR" : "IDR Normalized"}</td>
                  </tr>
                  <tr>
                    <td><strong>{isId ? "Bahan Baku — Nikel & Mineral" : "Basic Materials — Nickel & Minerals"}</strong></td>
                    <td className="tabular-nums">6</td>
                    <td className="tabular-nums">5</td>
                    <td className="tabular-nums"><strong style={{ color: "var(--opp-700)" }}>{isId ? "83,3% (Valid)" : "83.3% (Valid)"}</strong></td>
                    <td>{isId ? "Kuartal Mandiri" : "Standalone Quarter"}</td>
                    <td>{isId ? "Dinormalisasi ke IDR" : "IDR Normalized"}</td>
                  </tr>
                  <tr>
                    <td><strong>{isId ? "Industri — Logistik & Transportasi" : "Industrial — Logistics & Transport"}</strong></td>
                    <td className="tabular-nums">5</td>
                    <td className="tabular-nums">4</td>
                    <td className="tabular-nums"><strong style={{ color: "var(--opp-700)" }}>{isId ? "80,0% (Valid)" : "80.0% (Valid)"}</strong></td>
                    <td>{isId ? "Kuartal Mandiri" : "Standalone Quarter"}</td>
                    <td>{isId ? "Dinormalisasi ke IDR" : "IDR Normalized"}</td>
                  </tr>
                  <tr>
                    <td><strong>{isId ? "Telekomunikasi & Infrastruktur Digital" : "Telecommunications & Digital Infra"}</strong></td>
                    <td className="tabular-nums">7</td>
                    <td className="tabular-nums">3</td>
                    <td className="tabular-nums" style={{ color: "var(--risk-700)" }}>
                      <strong>{isId ? "42,8% (Tidak Memadai)" : "42.8% (Insufficient)"}</strong>
                    </td>
                    <td>{isId ? "Kuartal Mandiri" : "Standalone Quarter"}</td>
                    <td>{isId ? "Dinormalisasi ke IDR" : "IDR Normalized"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Universe Search */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div className="card-eyebrow">{isId ? "Direktori Emiten" : "Constituent Directory"}</div>
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
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div className="card-eyebrow">{isId ? "Deret Statistik Resmi" : "Official Statistical Series"}</div>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.15rem" }}>
                {isId ? "Pertumbuhan PDB Kuartalan — Pertambangan & Penggalian" : "Quarterly GDP growth — Mining and Quarrying"}
              </h2>
              <div style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>
                {isId ? "Penerbit: Badan Pusat Statistik (BPS)" : "Publisher: Badan Pusat Statistik (BPS - Statistics Indonesia)"}
              </div>
            </div>
            <span className="badge badge-insufficient">
              {isId ? "Telaah: Tidak Dapat Dibandingkan Langsung" : "Review: Not Comparable"}
            </span>
          </div>

          <div style={{ background: "var(--slate-50)", padding: "16px", borderRadius: "var(--radius-md)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "16px", border: "1px solid var(--border-light)" }}>
            <div><strong>{isId ? "Wilayah:" : "Geography:"}</strong> {isId ? "Nasional (Republik Indonesia)" : "National (Republic of Indonesia)"}</div>
            <div><strong>{isId ? "Nilai QoQ yang Dilaporkan:" : "Reported QoQ Value:"}</strong> <span className="tabular-nums" style={{ color: "var(--risk-700)", fontWeight: 700 }}>{isId ? "-8,20%" : "-8.20%"}</span></div>
            <div><strong>{isId ? "Siklus Observasi:" : "Observation Cycle:"}</strong> {isId ? "Q1-2026 (Dipublikasikan Mei 2026)" : "Q1-2026 (Published May 2026)"}</div>
            <div><strong>{isId ? "Penelaah Ahli:" : "Human Reviewer:"}</strong> Senior Policy Analyst fchyoga (2026-09-14 08:39 UTC)</div>
          </div>

          <div style={{ fontSize: "0.875rem", color: "var(--slate-700)", lineHeight: 1.6 }}>
            <strong>{isId ? "Alasan Telaah Formal:" : "Formal Review Rationale:"}</strong>{" "}
            {isId
              ? "Perhitungan neraca nasional PDB mencakup pertambangan rakyat, informal, dan tambang skala kecil di seluruh provinsi, sedangkan kohort Energi/Batubara NADI hanya terdiri dari emiten skala besar yang tercatat di BEI (IDX) dan berorientasi ekspor. Pergerakan arah harus dicermati sebagai konteks makro umum saja, dan klaim kausalitas atau validasi langsung tidak diperbolehkan tanpa kajian ekonometrik lebih lanjut."
              : "National accounts include informal, artisanal, and small-scale domestic mining operations across all provinces, whereas the NADI Energy/Coal cohort consists exclusively of large-scale, export-oriented IDX listed entities. Directional movement should be inspected for general macro context, but causal claims or validation are not permitted."}
          </div>
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
    </AppShell>
  );
}
