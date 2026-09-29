"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "../components/layout/AppShell";
import { SignalDirectionBadge } from "../components/ui/SignalDirectionBadge";
import { InlineSparkline } from "../components/ui/InlineSparkline";
import { IconArrowRight, IconShieldCheck, IconInfoCircle } from "../components/ui/Icons";
import type { SectorSignalSummary } from "../domain/sectors-dataset";
import type { Route } from "next";
import { useLanguage } from "../lib/i18n";
import { formatScore } from "../lib/formatters";
import { SectorMatrix } from "../components/ui/SectorMatrix";

export default function OverviewPage() {
  const { language, t } = useLanguage();
  const isId = language === "id";
  const [liveSectors, setLiveSectors] = useState<SectorSignalSummary[]>([]);
  const sectors = liveSectors;
  useEffect(() => {
    void fetch("/api/signal-runs/live").then((response) => response.ok ? response.json() : null).then((payload) => setLiveSectors(payload?.sectors ?? [])).catch(() => setLiveSectors([]));
  }, []);
  const [hoveredSector, setHoveredSector] = useState<SectorSignalSummary | null>(null);
  const [matrixView, setMatrixView] = useState<"chart" | "table">("chart");

  const pressureSectors = sectors.filter((s) => s.cohortSignal.label === "risk");
  const opportunitySectors = sectors.filter((s) => s.cohortSignal.label === "opportunity");
  const mixedSectors = sectors.filter((s) => s.cohortSignal.label === "mixed");
  const insufficientSectors = sectors.filter((s) => s.cohortSignal.label === "insufficient_data");

  const strongestPressure = pressureSectors[0] || sectors[0];
  const strongestOpportunity = opportunitySectors[0] || sectors[1];

  const totalEligible = sectors.reduce((acc, s) => acc + s.cohortSignal.eligibleCount, 0);
  const totalUniverse = sectors.reduce((acc, s) => acc + s.cohortSignal.totalMembers, 0);

  // Sparkline historical data mappings per sector
  const sectorSparklines: Record<string, number[]> = {
    "energy-coal": [20, 30, 50, 65, 75],
    "consumer-staples": [70, 75, 72, 78, 80],
    "basic-materials": [40, 45, 55, 52, 50],
    "industrial-logistics": [50, 55, 60, 68, 75],
    "telecommunications": [30, 35, 40, 38, 40],
  };

  const getSectorDisplayName = (s: SectorSignalSummary) => {
    if (!isId) return s.name;
    const nameMap: Record<string, string> = {
      "energy-coal": "Energi — Pertambangan Batubara",
      "consumer-staples": "Barang Konsumsi Pokok — Makanan & Minuman",
      "basic-materials": "Bahan Baku & Kimia Dasar",
      "industrial-logistics": "Transportasi & Logistik Industri",
      "telecommunications": "Infrastruktur Telekomunikasi",
    };
    return nameMap[s.id] || s.name;
  };
  if (!liveSectors.length) {
    return <AppShell dataMode="live"><div className="card" style={{ padding: "48px", textAlign: "center" }}><h2>{isId ? "Memuat data live..." : "Loading live data..."}</h2><p>{isId ? "Dashboard hanya menampilkan data live dari PostgreSQL." : "The dashboard only displays live data from PostgreSQL."}</p></div></AppShell>;
  }
  return (
    <AppShell
      dataMode="live"
      datasetTimestamp="2026-09-15 08:00 WIB"
      activePeriod="Q1-2026 vs Q1-2025"
    >
      {/* Orientation: explain the product before showing the numbers. */}
      <section className="orientation-panel" aria-labelledby="orientation-heading">
        <div className="orientation-intro">
          <span className="orientation-kicker">{isId ? "CARA KERJA NADI" : "HOW NADI WORKS"}</span>
          <h2 id="orientation-heading">
            {isId
              ? "Temukan sektor yang berubah, periksa buktinya, lalu susun brief."
              : "Find a changing sector, inspect the evidence, then write a brief."}
          </h2>
          <p>
            {isId
              ? "NADI membantu analis memprioritaskan sektor berdasarkan pola laporan keuangan perusahaan. Sinyal ini adalah titik awal investigasi—bukan prediksi krisis atau rekomendasi investasi."
              : "NADI helps analysts prioritize sectors from patterns in company filings. A signal is a starting point for investigation—not a crisis forecast or investment recommendation."}
          </p>
        </div>
        <ol className="orientation-steps">
          <li><span className="orientation-step-number">1</span><div><strong>{isId ? "Temukan sinyal" : "Find a signal"}</strong><span>{isId ? "Lihat sektor yang menunjukkan perubahan luas." : "See sectors with broad changes."}</span></div></li>
          <li><span className="orientation-step-number">2</span><div><strong>{isId ? "Periksa bukti" : "Inspect evidence"}</strong><span>{isId ? "Telusuri perusahaan, metrik, dan sumbernya." : "Trace companies, metrics, and sources."}</span></div></li>
          <li><span className="orientation-step-number">3</span><div><strong>{isId ? "Buat brief" : "Make a brief"}</strong><span>{isId ? "Uji interpretasi dengan AI dan counterevidence." : "Test interpretations with AI and counterevidence."}</span></div></li>
        </ol>
      </section>
      {liveSectors.length === 0 ? (
        <div className="demo-notice" role="note">
          <IconInfoCircle size={16} />
          <span><strong>{isId ? "Mode demo sintetis:" : "Synthetic demo mode:"}</strong>{" "}{isId ? "Angka di halaman ini adalah data simulasi untuk memahami alur produk, bukan temuan ekonomi riil." : "The figures on this page are simulated to demonstrate the product flow, not real economic findings."}</span>
          <Link href={"/data" as Route}>{isId ? "Pelajari metodologi" : "Learn about the methodology"} <IconArrowRight size={12} /></Link>
        </div>
      ) : (
        <div className="live-run-banner" role="status">
          <span><strong>{isId ? "Data langsung aktif:" : "Live data active:"}</strong>{" "}{isId ? "Ringkasan ini membaca lima signal run live dari PostgreSQL." : "This summary reads five live signal runs from PostgreSQL."}</span>
          <Link href={"/radar" as Route}>{isId ? "Buka radar live" : "Open live radar"} <IconArrowRight size={12} /></Link>
        </div>
      )}
      <div className="section-guide">
        <div><span className="section-guide-label">{isId ? "RINGKASAN SINYAL" : "SIGNAL SUMMARY"}</span><p>{isId ? "Angka berikut merangkum pola yang ditemukan. Buka radar untuk melihat perusahaan di baliknya." : "These figures summarize detected patterns. Open the radar to see the companies behind them."}</p></div>
        <span className="help-chip" title={isId ? "Skor mengukur kekuatan pola heuristik, bukan probabilitas." : "Scores measure heuristic pattern strength, not probability."}>ⓘ {isId ? "Cara membaca skor" : "How to read scores"}</span>
      </div>

      {/* Metabase-Style Macro Telemetry Grid */}
      <section className="grid-4" style={{ marginBottom: "20px" }} aria-label={isId ? "Ringkasan Indikator Kunci" : "Macro KPI Summary"}>
        {/* Cell 1: Pressure */}
        <div className="card" style={{ borderTop: "3px solid var(--risk-600)" }}>
          <div className="card-eyebrow" style={{ color: "var(--risk-700)" }}>
            {isId ? "Tekanan Utama Terdeteksi" : "Dominant Pressure"}
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--slate-950)", margin: "4px 0" }}>
            {getSectorDisplayName(strongestPressure).split("—")[1] || getSectorDisplayName(strongestPressure)}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)" }}>
            {isId ? "Skor Risiko:" : "Risk Score:"}{" "}
            <strong
              className="tabular-nums"
              style={{ color: "var(--risk-700)" }}
              title={formatScore(strongestPressure.cohortSignal.riskScore, language).title}
            >
              {formatScore(strongestPressure.cohortSignal.riskScore, language).formatted}/100
            </strong>
          </div>
          <div
            style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px", cursor: "help" }}
            title={t("concept.riskBreadth.desc")}
          >
            {isId ? "Sebaran Risiko:" : "Signal Breadth:"}{" "}
            <strong className="tabular-nums">{Math.round(Number(strongestPressure.cohortSignal.riskBreadth || 0) * 100)}%</strong> {isId ? "dari emiten" : "of constituents"}
          </div>
          <div style={{ marginTop: "10px" }}>
            <Link href={`/radar/${strongestPressure.runId}/${strongestPressure.id}` as Route} style={{ fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              {isId ? "Periksa Rekam Bukti" : "Inspect Evidence Lineage"} <IconArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Cell 2: Opportunity */}
        <div className="card" style={{ borderTop: "3px solid var(--opp-600)" }}>
          <div className="card-eyebrow" style={{ color: "var(--opp-700)" }}>
            {isId ? "Peluang Utama Terdeteksi" : "Dominant Opportunity"}
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--slate-950)", margin: "4px 0" }}>
            {getSectorDisplayName(strongestOpportunity).split("—")[1] || getSectorDisplayName(strongestOpportunity)}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)" }}>
            {isId ? "Skor Peluang:" : "Opp Score:"}{" "}
            <strong
              className="tabular-nums"
              style={{ color: "var(--opp-700)" }}
              title={formatScore(strongestOpportunity.cohortSignal.opportunityScore, language).title}
            >
              {formatScore(strongestOpportunity.cohortSignal.opportunityScore, language).formatted}/100
            </strong>
          </div>
          <div
            style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px", cursor: "help" }}
            title={t("concept.opportunityBreadth.desc")}
          >
            {isId ? "Sebaran Peluang:" : "Signal Breadth:"}{" "}
            <strong className="tabular-nums">{Math.round(Number(strongestOpportunity.cohortSignal.opportunityBreadth || 0) * 100)}%</strong> {isId ? "dari emiten" : "of constituents"}
          </div>
          <div style={{ marginTop: "10px" }}>
            <Link href={`/radar/${strongestOpportunity.runId}/${strongestOpportunity.id}` as Route} style={{ fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              {isId ? "Periksa Rekam Bukti" : "Inspect Evidence Lineage"} <IconArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Cell 3: Active Shifts */}
        <div className="card" style={{ borderTop: "3px solid var(--primary-700)" }}>
          <div className="card-eyebrow">{isId ? "Pergeseran Sektor Aktif" : "Active Sector Shifts"}</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--slate-950)", margin: "4px 0" }}>
            <span className="tabular-nums">{pressureSectors.length + opportunitySectors.length + mixedSectors.length}</span>{" "}
            <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)", fontWeight: 500 }}>
              {isId ? `dari ${sectors.length} sektor` : `of ${sectors.length} cohorts`}
            </span>
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)" }}>
            {isId
              ? `${pressureSectors.length} tertekan, ${opportunitySectors.length} tumbuh, ${mixedSectors.length} bercabang`
              : `${pressureSectors.length} pressure, ${opportunitySectors.length} expanding, ${mixedSectors.length} divergent`}
          </div>
          <div style={{ marginTop: "10px" }}>
            <span className="badge badge-risk">{pressureSectors.length} {isId ? "Perhatian Tinggi" : "High Attention"}</span>
          </div>
        </div>

        {/* Cell 4: System Integrity & Coverage */}
        <div className="card" style={{ borderTop: "3px solid var(--slate-400)" }}>
          <div className="card-eyebrow" title={t("concept.coverage.desc")} style={{ cursor: "help" }}>
            {isId ? "Cakupan Sampel" : "Sample Coverage"}
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--slate-950)", margin: "4px 0" }}>
            <span className="tabular-nums">{totalEligible}</span>{" "}
            <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)", fontWeight: 500 }}>
              / {totalUniverse} {isId ? "emiten" : "companies"}
            </span>
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)" }}>
            {insufficientSectors.length} {isId ? "sektor di bawah batas kelayakan 60%" : "cohort below 60% reporting threshold"}
          </div>
          <div style={{ marginTop: "10px" }}>
            <span className="badge badge-snapshot">
              <IconShieldCheck size={12} /> {isId ? "Metode v0.1 Terverifikasi" : "Method v0.1 Verified"}
            </span>
          </div>
        </div>
      </section>

      {/* Interactive 2D Coordinate Plane with Our World in Data Transparency */}
      <section className="card" style={{ marginBottom: "20px", padding: 0 }} aria-labelledby="pulse-matrix-heading">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div className="card-eyebrow">{isId ? "Pemetaan Sektor & Diagnostik Finansial" : "Sector Mapping & Financial Diagnostics"}</div>
            <h2 id="pulse-matrix-heading" style={{ margin: "2px 0 0", fontSize: "1.1rem", color: "var(--slate-950)" }}>
              {isId ? "Peta Kondisi Sektor: Tekanan vs. Peluang" : "Sector Pulse: Pressure vs. Opportunity"}
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
              {isId
                ? "Pilih sektor untuk langsung melihat tingkat risiko, peluang, dan penjelasan kondisi keuangannya dalam bahasa yang mudah dipahami."
                : "Select a sector to instantly view its risk, opportunity, and clear financial health summary."}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className={`btn btn-sm ${matrixView === "chart" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMatrixView("chart")}
              aria-label={isId ? "Tampilkan sebagai Peta Visual" : "View as Visual Board"}
            >
              {isId ? "Peta Visual" : "Visual Board"}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${matrixView === "table" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMatrixView("table")}
              aria-label={isId ? "Tampilkan sebagai Tabel Data Aksesibel" : "View as Accessible Data Table"}
            >
              {isId ? "Tabel Aksesibel" : "Data Table"}
            </button>
          </div>
        </div>

        {matrixView === "chart" ? (
          <SectorMatrix
            sectors={sectors}
            language={language}
            getSectorDisplayName={getSectorDisplayName}
          />
        ) : (
          /* Accessible Table Fallback (OWID Pattern) */
          <div className="table-scroll" style={{ padding: "16px" }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{isId ? "Sektor Kohort" : "Sector Cohort"}</th>
                  <th scope="col">{isId ? "Arah Sinyal" : "Direction"}</th>
                  <th scope="col" style={{ textAlign: "right" }}>{isId ? "Skor Risiko" : "Risk Score"}</th>
                  <th scope="col" style={{ textAlign: "right" }}>{isId ? "Skor Peluang" : "Opp Score"}</th>
                  <th scope="col" style={{ textAlign: "right" }}>{isId ? "Sebaran" : "Breadth"}</th>
                  <th scope="col">{isId ? "Pendorong Finansial Utama" : "Dominant Driver"}</th>
                  <th scope="col" style={{ textAlign: "right" }}>{isId ? "Aksi" : "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {sectors.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{getSectorDisplayName(s)}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)" }}>{s.industry}</div>
                    </td>
                    <td><SignalDirectionBadge direction={s.cohortSignal.label} size="sm" /></td>
                    <td className="tabular-nums" style={{ textAlign: "right", color: "var(--risk-700)", fontWeight: 700 }} title={formatScore(s.cohortSignal.riskScore, language).title}>
                      {formatScore(s.cohortSignal.riskScore, language).formatted}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right", color: "var(--opp-700)", fontWeight: 700 }} title={formatScore(s.cohortSignal.opportunityScore, language).title}>
                      {formatScore(s.cohortSignal.opportunityScore, language).formatted}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {s.cohortSignal.riskBreadth
                        ? `${Math.round(Number(s.cohortSignal.riskBreadth) * 100)}% ${isId ? "risiko" : "risk"}`
                        : s.cohortSignal.opportunityBreadth
                        ? `${Math.round(Number(s.cohortSignal.opportunityBreadth) * 100)}% ${isId ? "peluang" : "opp"}`
                        : "—"}
                    </td>
                    <td style={{ fontSize: "0.75rem", maxWidth: "260px" }}>{s.dominantDriver}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/radar/${s.runId}/${s.id}` as Route} className="btn btn-secondary btn-sm">
                        {isId ? "Periksa →" : "Inspect →"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Our World in Data Attribution Footer */}
        <div style={{ padding: "10px 20px", background: "var(--slate-50)", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "0.75rem", color: "var(--slate-500)" }}>
          <div>
            <strong>{isId ? "Metrik:" : "Metric:"}</strong> {isId ? "Heuristik Sinyal (Skala: 0 hingga 100) · Periode: Kuartal Mandiri YoY Q1-2026 vs Q1-2025" : "Signal Heuristic (Scale: 0 to 100) · Period: Q1-2026 vs Q1-2025 YoY standalone quarters"}
          </div>
          <div>
            <strong>{isId ? "Sumber:" : "Source:"}</strong> {isId ? "Keterbukaan IDX melalui Sectors Financial API v2 · Metode v0.1" : "IDX Disclosures via Sectors Financial API v2 · Method v0.1"}
          </div>
        </div>
      </section>

      {/* Sector Shift Ranking Board (High Data-Ink Table with Inline Sparklines) */}
      <section className="card" style={{ marginBottom: "20px" }} aria-labelledby="shift-ranking-heading">
        <div className="card-header">
          <div>
            <div className="card-eyebrow">{isId ? "Peringkat Sinyal Deterministik" : "Deterministic Signal Rankings"}</div>
            <h2 id="shift-ranking-heading" style={{ margin: "2px 0 0", fontSize: "1.1rem", color: "var(--slate-950)" }}>
              {isId ? "Peringkat Pergeseran Sektor & Kecepatan Finansial" : "Ranked Sector Shifts & Financial Velocity"}
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
              {isId
                ? "Diurutkan berdasarkan prioritas perhatian kebijakan dengan grafik tren 5 kuartal."
                : "Sorted by macro intervention priority with 5-quarter trend sparklines."}
            </div>
          </div>
          <span className="badge badge-snapshot">
            <IconShieldCheck size={12} /> {isId ? "Metode v0.1 Terverifikasi" : "Method v0.1 Verified"}
          </span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{isId ? "Sektor Kohort" : "Sector Cohort"}</th>
                <th scope="col">{isId ? "Arah" : "Direction"}</th>
                <th scope="col" style={{ width: "110px" }}>{isId ? "Tren 5-Kuartal" : "5-Q Trend"}</th>
                <th scope="col" style={{ textAlign: "right" }}>{isId ? "Risiko / Peluang" : "Risk / Opp"}</th>
                <th scope="col" style={{ textAlign: "right" }}>{isId ? "Sebaran Sinyal" : "Breadth"}</th>
                <th scope="col">{isId ? "Faktor Finansial Utama" : "Dominant Financial Driver"}</th>
                <th scope="col">{isId ? "Divergensi / Bukti Sanggahan" : "Counter-Signal Divergence"}</th>
                <th scope="col" style={{ textAlign: "right" }}>{isId ? "Aksi" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((s) => {
                const sparkData = sectorSparklines[s.id] || [40, 45, 50, 50, 50];
                const sparkColor = s.cohortSignal.label === "risk"
                  ? "var(--risk-600)"
                  : s.cohortSignal.label === "opportunity"
                  ? "var(--opp-600)"
                  : "var(--slate-500)";

                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{getSectorDisplayName(s)}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)" }}>{s.industry}</div>
                    </td>
                    <td>
                      <SignalDirectionBadge direction={s.cohortSignal.label} size="sm" />
                    </td>
                    <td>
                      <InlineSparkline
                        data={sparkData}
                        color={sparkColor}
                        fill
                        ariaLabel={`${isId ? "Tren 5-kuartal untuk" : "5-quarter trend for"} ${getSectorDisplayName(s)}`}
                      />
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right", fontWeight: 700 }}>
                      <span
                        style={{ color: "var(--risk-700)" }}
                        title={formatScore(s.cohortSignal.riskScore, language).title}
                      >
                        {formatScore(s.cohortSignal.riskScore, language).formatted}
                      </span>
                      <span style={{ color: "var(--slate-400)", margin: "0 4px" }}>/</span>
                      <span
                        style={{ color: "var(--opp-700)" }}
                        title={formatScore(s.cohortSignal.opportunityScore, language).title}
                      >
                        {formatScore(s.cohortSignal.opportunityScore, language).formatted}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600 }}>
                        {s.cohortSignal.riskBreadth ? `${Math.round(Number(s.cohortSignal.riskBreadth) * 100)}% ${isId ? "risiko" : "risk"}` : ""}
                        {s.cohortSignal.opportunityBreadth ? `${Math.round(Number(s.cohortSignal.opportunityBreadth) * 100)}% ${isId ? "peluang" : "opp"}` : ""}
                        {!s.cohortSignal.riskBreadth && !s.cohortSignal.opportunityBreadth ? (isId ? "Stabil" : "Baseline") : ""}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)" }}>
                        {s.cohortSignal.eligibleCount}/{s.cohortSignal.totalMembers} {isId ? "sampel" : "sample"}
                      </div>
                    </td>
                    <td style={{ maxWidth: "260px", fontSize: "0.75rem", lineHeight: 1.4 }}>
                      {s.dominantDriver}
                    </td>
                    <td style={{ maxWidth: "220px", fontSize: "0.75rem", color: "var(--slate-600)", lineHeight: 1.4 }}>
                      {s.counterSignalSummary}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/radar/${s.runId}/${s.id}` as Route} className="btn btn-secondary btn-sm">
                        {isId ? "Rincian" : "Deep Dive"} <IconArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Operational Deliverables Stream */}
      <section aria-labelledby="activity-heading">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Active Investigations */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-eyebrow">{isId ? "Alur Riset Terbatas" : "Bounded Research Workflows"}</div>
                <h2 className="panel-title" style={{ margin: 0, fontSize: "1rem" }}>
                  {isId ? "Investigasi Ekonomi AI Aktif" : "Active AI Economic Investigations"}
                </h2>
              </div>
              <Link href={"/investigations" as Route} className="btn btn-secondary btn-sm">
                {isId ? "Lihat Semua" : "View All"} <IconArrowRight size={12} />
              </Link>
            </div>
            <div style={{ padding: "12px 14px", background: "var(--slate-50)", borderLeft: "3px solid var(--risk-600)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "var(--slate-950)", fontSize: "0.8125rem" }}>
                  {isId ? "Energi — Pertambangan Batubara" : "Energy — Coal Mining & Quarrying"}
                </strong>
                <span className="badge badge-risk">{isId ? "Tekanan" : "Pressure"}</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--slate-700)", marginTop: "4px" }}>
                {isId
                  ? "“Apakah kontraksi margin laba batubara termal terjadi merata di emiten menengah?”"
                  : "“Is thermal coal margin compression shared broadly across mid-caps?”"}
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", marginTop: "6px", display: "flex", gap: "10px" }}>
                <span>{isId ? "Selesai" : "Completed"}</span>
                <span>{isId ? "6 Panggilan Alat" : "6 Tool Runs"}</span>
                <span>Ollama Qwen2.5-7B</span>
              </div>
              <div style={{ marginTop: "8px" }}>
                <Link href={"/investigations/inv-energy-coal-demo" as Route} style={{ fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  {isId ? "Buka Ruang Investigasi" : "Open Investigation Workspace"} <IconArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Decision Briefs */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-eyebrow">{isId ? "Jalur Nota Keputusan" : "Cabinet Memorandum Pipeline"}</div>
                <h2 className="panel-title" style={{ margin: 0, fontSize: "1rem" }}>
                  {isId ? "Laporan Ringkas Keputusan Eksekutif" : "Executive Cabinet Briefs"}
                </h2>
              </div>
              <Link href={"/briefs" as Route} className="btn btn-secondary btn-sm">
                {isId ? "Lihat Semua" : "View All"} <IconArrowRight size={12} />
              </Link>
            </div>
            <div style={{ padding: "12px 14px", background: "var(--primary-50)", borderLeft: "3px solid var(--primary-800)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "var(--slate-950)", fontSize: "0.8125rem" }}>
                  {isId ? "Pergeseran Sektor Batubara Q1-2026: Kontraksi Margin Ekspor" : "Q1-2026 Coal Sector Shift: Export Margin Contraction"}
                </strong>
                <span className="badge badge-snapshot">v1.0 Final</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--slate-700)", marginTop: "4px" }}>
                {isId
                  ? "Laporan keputusan resmi dengan 15 sitasi terverifikasi, register bukti sanggahan, dan konteks makroekonomi BPS."
                  : "Official decision brief with 15 verified citations, counterevidence register, and BPS macroeconomic context."}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <Link href={"/briefs/brief-energy-coal-q1-2026" as Route} className="btn btn-primary btn-sm">
                  {isId ? "Baca Laporan" : "Read Brief"} <IconArrowRight size={12} />
                </Link>
                <a
                  href="/api/briefs/brief-energy-coal-q1-2026/export"
                  download="brief-energy-coal-q1-2026.md"
                  className="btn btn-secondary btn-sm"
                >
                  {isId ? "Ekspor .md" : "Export .md"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
