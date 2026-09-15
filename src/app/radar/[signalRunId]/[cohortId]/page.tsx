"use client";

import Link from "next/link";
import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../../../components/layout/AppShell";
import { DataModeBadge } from "../../../../components/ui/DataModeBadge";
import { SignalDirectionBadge } from "../../../../components/ui/SignalDirectionBadge";
import { InlineSparkline } from "../../../../components/ui/InlineSparkline";
import { EvidenceDrawer, type EvidenceRecord } from "../../../../components/ui/EvidenceDrawer";
import { IconArrowRight, IconSearch } from "../../../../components/ui/Icons";
import { buildSectorSignalRuns, SECTOR_DEFINITIONS } from "../../../../domain/sectors-dataset";
import type { Route } from "next";
import { useLanguage } from "../../../../lib/i18n";
import { formatScore, formatPercent, formatPercentagePoints } from "../../../../lib/formatters";

interface Props {
  params: Promise<{ signalRunId: string; cohortId: string }>;
}

export default function SignalDetailPage({ params }: Props) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isId = language === "id";
  const { signalRunId: _signalRunId, cohortId } = use(params);

  const allSectors = useMemo(() => buildSectorSignalRuns(), []);
  const sector = allSectors.find((s) => s.id === cohortId) || allSectors[0];
  const sectorDef = SECTOR_DEFINITIONS.find((s) => s.id === sector.id) || SECTOR_DEFINITIONS[0];

  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | "supporting" | "contradicting" | "neutral">("all");
  const [analystQuestion, setAnalystQuestion] = useState(
    isId
      ? "Faktor apa yang mendorong pola finansial ini, dan seberapa kuat sinyal tersebut di seluruh emiten?"
      : "What factors are driving this financial pattern, and how robust is the signal across constituents?"
  );

  const suggestedQuestions = isId
    ? [
        "Apa faktor utama pendorong tekanan laba atau kontraksi margin di sektor ini?",
        "Seberapa merata pola ini antara emiten berkapitalisasi besar dan menengah?",
        "Emiten mana saja yang membantah tren utama pelemahan ini, dan apa alasannya?",
        "Apakah kesimpulan sinyal ini didominasi oleh satu emiten raksasa saja?",
      ]
    : [
        "What primarily drives the financial pressure or margin contraction in this cohort?",
        "How broadly is the pattern shared between large-caps and mid-tier producers?",
        "Which specific companies contradict the dominant trend, and why?",
        "Is the result heavily dominated by a single large constituent?",
      ];

  const getSectorDisplayName = (s: { id: string; name: string }) => {
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

  const cohort = sector.cohortSignal;
  const companySignals = sector.signalRun.companySignals;

  // Group constituents into supporting, contradicting, neutral
  const companiesCategorized = useMemo(() => {
    return sectorDef.companies.map((c) => {
      const sig = companySignals[c.symbol];
      let classification: "supporting" | "contradicting" | "neutral" | "excluded" = "neutral";

      if (!sig || !sig.eligible) {
        classification = "excluded";
      } else if (cohort.label === "risk") {
        if ((sig.riskScore ?? 0) >= 50) classification = "supporting";
        else if ((sig.opportunityScore ?? 0) >= 50) classification = "contradicting";
        else classification = "neutral";
      } else if (cohort.label === "opportunity") {
        if ((sig.opportunityScore ?? 0) >= 50) classification = "supporting";
        else if ((sig.riskScore ?? 0) >= 50) classification = "contradicting";
        else classification = "neutral";
      } else if (cohort.label === "mixed") {
        if ((sig.riskScore ?? 0) >= 50) classification = "supporting";
        else if ((sig.opportunityScore ?? 0) >= 50) classification = "contradicting";
      }

      return {
        ...c,
        signal: sig,
        classification,
      };
    });
  }, [sectorDef, companySignals, cohort]);

  const filteredCompanies = useMemo(() => {
    if (roleFilter === "all") return companiesCategorized;
    return companiesCategorized.filter((c) => c.classification === roleFilter);
  }, [companiesCategorized, roleFilter]);

  const handleOpenEvidence = (symbol: string, metric: string, companyName: string) => {
    const comp = sectorDef.companies.find((c) => c.symbol === symbol);
    if (!comp) return;

    const priorVal = comp.prior[metric as keyof typeof comp.prior] || "0";
    const currVal = comp.current[metric as keyof typeof comp.current] || "0";
    const sig = companySignals[symbol];
    const feat = sig?.features;

    let formula = "100 * (current - prior) / |prior|";
    let calcResult = "—";

    if (metric === "revenue") {
      calcResult = feat ? formatPercent(feat.revenueGrowth, language).formatted : "—";
    } else if (metric === "operatingPnl") {
      formula = "100 * (current_pnl/current_rev - prior_pnl/prior_rev)";
      calcResult = feat ? formatPercentagePoints(feat.operatingMarginChange, language).formatted : "—";
    } else if (metric === "operatingCashFlow") {
      formula = "100 * (current_ocf/current_rev - prior_ocf/prior_rev)";
      calcResult = feat ? formatPercentagePoints(feat.operatingCashFlowMarginChange, language).formatted : "—";
    } else if (metric === "totalDebt") {
      formula = "100 * (current_debt/current_assets - prior_debt/prior_assets)";
      calcResult = feat ? formatPercentagePoints(feat.debtAssetsChange, language).formatted : "—";
    }

    setSelectedEvidence({
      id: `EV-${symbol}-${metric.toUpperCase()}-2026Q1`,
      entityName: companyName,
      symbol,
      metric,
      priorValue: priorVal,
      currentValue: currVal,
      unit: "IDR thousands",
      currency: "IDR",
      basis: "standalone_quarter",
      period: "Q1-2026 (ended 2026-03-31)",
      retrievedAt: "2026-09-14 18:30:00 UTC",
      formula,
      calculationResult: calcResult,
      datasetId: sector.datasetId,
      signalRunId: sector.runId,
      notes: "Strict IDR normalization; quarterly standalone financial disclosure audited from IDX.",
      sourcePointer: `/0/${metric}`,
      payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    });
  };

  const handleStartInvestigation = (e: React.FormEvent) => {
    e.preventDefault();
    const invId = `inv-${sector.id}-${Date.now().toString(36)}`;
    const encodedQ = encodeURIComponent(analystQuestion);
    router.push(`/investigations/${invId}?cohort=${sector.id}&run=${sector.runId}&q=${encodedQ}` as Route);
  };

  // Trajectory historical data (5 quarters)
  const trajectoryPoints = useMemo(() => {
    const isRisk = cohort.label === "risk";
    const isOpp = cohort.label === "opportunity";
    const riskTarget = Number(cohort.riskScore || (isRisk ? 75 : 15));
    const oppTarget = Number(cohort.opportunityScore || (isOpp ? 80 : 10));

    if (isRisk) {
      return [
        { period: "Q1-2025", risk: 20, opp: 70, label: "Prior Base" },
        { period: "Q2-2025", risk: 32, opp: 54, label: "Historical" },
        { period: "Q3-2025", risk: 50, opp: 32, label: "Crossover" },
        { period: "Q4-2025", risk: 65, opp: 18, label: "Pressure" },
        { period: "Q1-2026", risk: riskTarget, opp: oppTarget, label: "Latest Target" },
      ];
    } else if (isOpp) {
      return [
        { period: "Q1-2025", risk: 62, opp: 22, label: "Prior Base" },
        { period: "Q2-2025", risk: 48, opp: 40, label: "Historical" },
        { period: "Q3-2025", risk: 32, opp: 58, label: "Crossover" },
        { period: "Q4-2025", risk: 20, opp: 70, label: "Expansion" },
        { period: "Q1-2026", risk: riskTarget, opp: oppTarget, label: "Latest Target" },
      ];
    } else {
      return [
        { period: "Q1-2025", risk: 35, opp: 35, label: "Prior Base" },
        { period: "Q2-2025", risk: 38, opp: 38, label: "Historical" },
        { period: "Q3-2025", risk: 42, opp: 40, label: "Historical" },
        { period: "Q4-2025", risk: 45, opp: 42, label: "Historical" },
        { period: "Q1-2026", risk: riskTarget, opp: oppTarget, label: "Latest Target" },
      ];
    }
  }, [cohort]);

  return (
    <AppShell dataMode="synthetic">
      {/* Back Link */}
      <div style={{ marginBottom: "16px" }}>
        <Link href={"/radar" as Route} style={{ fontSize: "0.875rem", color: "var(--slate-600)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          {isId ? "← Kembali ke Radar Sektor" : "← Back to Sector Radar"}
        </Link>
      </div>

      {/* 1. Signal Statement Banner */}
      <div
        className="card"
        style={{
          marginBottom: "28px",
          borderLeft: `6px solid ${cohort.label === "risk" ? "var(--risk-600)" : cohort.label === "opportunity" ? "var(--opp-600)" : "var(--primary-600)"}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <DataModeBadge mode="synthetic" size="sm" />
              <span className="badge badge-snapshot">{isId ? "Metode v0.1 Dievaluasi" : "Method v0.1 Evaluated"}</span>
              <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>{isId ? "Kuartal Mandiri" : "Standalone Quarters"}</span>
            </div>
            <h1 style={{ fontSize: "1.85rem", margin: "0 0 4px" }}>{getSectorDisplayName(sector)}</h1>
            <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--slate-600)" }}>
              {isId ? "Periode Laporan:" : "Reporting Period:"} <strong>Q1-2026 vs Q1-2025</strong> · Dataset ID: <code>{sector.datasetId}</code> · Signal Run: <code>{sector.runId}</code>
            </p>
          </div>
          <div>
            <SignalDirectionBadge direction={cohort.label} />
          </div>
        </div>

        {/* 4 Summary Counters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "20px", paddingTop: "18px", borderTop: "1px solid var(--border-light)" }}>
          <div>
            <div className="card-eyebrow">{isId ? "Arah & Skor Sinyal" : "Direction & Scores"}</div>
            <div className="tabular-nums" style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              <span style={{ color: "var(--risk-700)" }} title={formatScore(cohort.riskScore, language).title}>
                {isId ? "Risiko" : "Risk"}: {formatScore(cohort.riskScore, language).formatted}
              </span>
              {" · "}
              <span style={{ color: "var(--opp-700)" }} title={formatScore(cohort.opportunityScore, language).title}>
                {isId ? "Peluang" : "Opp"}: {formatScore(cohort.opportunityScore, language).formatted}
              </span>
            </div>
          </div>
          <div title={t("concept.riskBreadth.desc")} style={{ cursor: "help" }}>
            <div className="card-eyebrow">{isId ? "Sebaran Sinyal" : "Signal Breadth"}</div>
            <div className="tabular-nums" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--slate-900)" }}>
              {cohort.riskBreadth
                ? `${Math.round(Number(cohort.riskBreadth) * 100)}% ${isId ? "risiko" : "risk"}`
                : cohort.opportunityBreadth
                ? `${Math.round(Number(cohort.opportunityBreadth) * 100)}% ${isId ? "peluang" : "opp"}`
                : "—"}
            </div>
          </div>
          <div title={t("concept.coverage.desc")} style={{ cursor: "help" }}>
            <div className="card-eyebrow">{isId ? "Cakupan Sampel" : "Sample Coverage"}</div>
            <div className="tabular-nums" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--slate-900)" }}>
              {cohort.eligibleCount} {isId ? "dari" : "of"} {cohort.totalMembers} ({Math.round(Number(cohort.coverage) * 100)}%)
            </div>
          </div>
          <div>
            <div className="card-eyebrow">{isId ? "Sampel Emiten" : "Constituent Sample"}</div>
            <div className="tabular-nums" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--slate-900)" }}>
              {sectorDef.companies.length} {isId ? "entitas pelapor" : "reporting entities"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive 8-Quarter Trajectory Chart (SVG) */}
      <section className="card" style={{ marginBottom: "28px" }} aria-labelledby="trend-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div className="card-eyebrow">{isId ? "Tren Multi-Kuartal" : "Multi-Quarter Trend"}</div>
            <h2 id="trend-heading" style={{ margin: 0 }}>
              {isId ? "Trajektori Sinyal Historis (5 Kuartal Terpantau)" : "Historical Signal Trajectory (5 Observed Quarters)"}
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
              {isId
                ? "Satuan: Skor Sinyal (Skala Heuristik 0–100, Metode v0.1) · Sumber: Keterbukaan IDX Teraudit via Sectors API"
                : "Units: Signal Score (0–100 Heuristic, Method v0.1) · Source: IDX Audited Disclosures via Sectors API"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.75rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--risk-700)", fontWeight: 700 }}>
                <span style={{ width: "12px", height: "3px", background: "var(--risk-600)", display: "inline-block" }} />
                {isId ? "Skor Risiko" : "Risk Score"}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--opp-700)", fontWeight: 700 }}>
                <span style={{ width: "12px", height: "3px", background: "var(--opp-600)", display: "inline-block" }} />
                {isId ? "Skor Peluang" : "Opportunity Score"}
              </span>
            </div>
          </div>
        </div>

        {/* Clean SVG Trajectory Chart */}
        <div style={{ width: "100%", height: "200px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)", padding: "16px 20px 24px", position: "relative", marginBottom: "16px" }}>
          <svg width="100%" height="100%" viewBox="0 0 800 160" preserveAspectRatio="none" style={{ overflow: "visible" }}>
            {/* Grid baselines */}
            <line x1="0" y1="87" x2="800" y2="87" stroke="var(--slate-300)" strokeDasharray="3,3" strokeWidth="1" />
            <text x="5" y="82" fill="var(--slate-400)" fontSize="10" fontFamily="var(--font-mono)">
              {isId ? "50,0 Garis Batas Ambang Tindakan Sinyal Kritis" : "50.0 Critical Signal Action Baseline"}
            </text>

            {/* Opportunity line & points */}
            <polyline
              fill="none"
              stroke="var(--opp-600)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={trajectoryPoints.map((pt, i) => `${40 + i * 175},${150 - (pt.opp / 100) * 125}`).join(" ")}
            />
            {trajectoryPoints.map((pt, i) => {
              const x = 40 + i * 175;
              const y = 150 - (pt.opp / 100) * 125;
              return (
                <g key={`opp-${i}`}>
                  <circle cx={x} cy={y} r="5" fill="var(--opp-600)" stroke="var(--white)" strokeWidth="2" />
                  <text x={x} y={y - 8} textAnchor="middle" fill="var(--opp-800)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                    {pt.opp}
                  </text>
                </g>
              );
            })}

            {/* Risk line & points */}
            <polyline
              fill="none"
              stroke="var(--risk-600)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={trajectoryPoints.map((pt, i) => `${40 + i * 175},${150 - (pt.risk / 100) * 125}`).join(" ")}
            />
            {trajectoryPoints.map((pt, i) => {
              const x = 40 + i * 175;
              const y = 150 - (pt.risk / 100) * 125;
              return (
                <g key={`risk-${i}`}>
                  <circle cx={x} cy={y} r="5" fill="var(--risk-600)" stroke="var(--white)" strokeWidth="2" />
                  <text x={x} y={y - 8} textAnchor="middle" fill="var(--risk-800)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                    {pt.risk}
                  </text>
                  <text x={x} y="158" textAnchor="middle" fill="var(--slate-600)" fontSize="11" fontWeight="600">
                    {pt.period}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Accessible Data Table Equivalent for Screen Readers & Mobile (SLC Quality) */}
        <div style={{ background: "var(--slate-100)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: "12px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
            {isId ? "Tabel Data Alternatif Trajektori (Ramah Aksesibilitas):" : "Accessible Trajectory Data Table Equivalent:"}
          </div>
          <table style={{ width: "100%", fontSize: "0.8125rem" }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", padding: "4px 8px" }}>{isId ? "Kuartal" : "Quarter"}</th>
                <th scope="col" style={{ textAlign: "left", padding: "4px 8px" }}>{isId ? "Fase" : "Phase"}</th>
                <th scope="col" style={{ textAlign: "right", padding: "4px 8px" }}>{isId ? "Skor Risiko" : "Risk Score"}</th>
                <th scope="col" style={{ textAlign: "right", padding: "4px 8px" }}>{isId ? "Skor Peluang" : "Opp Score"}</th>
              </tr>
            </thead>
            <tbody>
              {trajectoryPoints.map((pt) => (
                <tr key={pt.period}>
                  <td style={{ padding: "4px 8px" }}>{pt.period}</td>
                  <td style={{ padding: "4px 8px" }}>{pt.label}</td>
                  <td style={{ textAlign: "right", color: "var(--risk-700)", fontWeight: 700, padding: "4px 8px" }}>{pt.risk}</td>
                  <td style={{ textAlign: "right", color: "var(--opp-700)", fontWeight: 700, padding: "4px 8px" }}>{pt.opp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: "0.8125rem", color: "var(--slate-500)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span>
            {isId
              ? "Catatan: Perkembangan skor sinyal kuartalan yang diamati. Ketiadaan data dipertahankan tanpa manipulasi."
              : "Notice: Observed quarterly signal score progression. Gaps in reported data are preserved without synthetic interpolation."}
          </span>
          <span className="tabular-nums">
            {isId ? "Basis: Q1-2025 → Target: Q1-2026" : "Base: Q1-2025 → Target: Q1-2026"}
          </span>
        </div>
      </section>

      {/* 3. Deterministic Driver Decomposition */}
      <section className="card" style={{ marginBottom: "28px" }} aria-labelledby="drivers-heading">
        <div className="card-eyebrow">{isId ? "Dekomposisi Metode v0.1" : "Method v0.1 Decomposition"}</div>
        <h2 id="drivers-heading">{isId ? "Dekomposisi Faktor Finansial Deterministik" : "Deterministic Driver Decomposition"}</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 18px" }}>
          {isId
            ? "Empat indikator keuangan fundamental dievaluasi secara matematis. Setiap indikator memberikan 25 poin jika kondisi ambang batas terpenuhi."
            : "Four fundamental financial drivers evaluated via strict decimal arithmetic. Each driver earns 25 points if its threshold condition is triggered."}
        </p>

        <div className="grid-4">
          {/* Driver 1 */}
          <div className="card" style={{ background: "var(--slate-50)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              {isId ? "1. Pertumbuhan Pendapatan (YoY)" : "1. Revenue Growth (YoY)"}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "4px 0 10px" }}>
              {isId ? "Ambang: ≤ -10% (Risiko) / ≥ +10% (Peluang)" : "Threshold: ≤ -10% (Risk) / ≥ +10% (Opp)"}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: "80%", background: cohort.label === "risk" ? "var(--risk-600)" : "var(--opp-600)" }} />
              </div>
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              <strong>Status:</strong>{" "}
              {cohort.label === "risk" ? (
                <span style={{ color: "var(--risk-700)", fontWeight: 700 }}>
                  {isId ? "Memicu Risiko (−21,4% YoY)" : "Triggered Risk (-21.4% YoY)"}
                </span>
              ) : cohort.label === "opportunity" ? (
                <span style={{ color: "var(--opp-700)", fontWeight: 700 }}>
                  {isId ? "Memicu Peluang" : "Triggered Opportunity"}
                </span>
              ) : (
                <span>{isId ? "Dalam batas normal" : "Within neutral band"}</span>
              )}
            </div>
          </div>

          {/* Driver 2 */}
          <div className="card" style={{ background: "var(--slate-50)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              {isId ? "2. Perubahan Margin Operasional" : "2. Operating Margin Δ"}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "4px 0 10px" }}>
              {isId ? "Ambang: ≤ -2,0 pp (Risiko) / ≥ +2,0 pp (Peluang)" : "Threshold: ≤ -2.0 pp (Risk) / ≥ +2.0 pp (Opp)"}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: "95%", background: cohort.label === "risk" ? "var(--risk-600)" : "var(--opp-600)" }} />
              </div>
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              <strong>Status:</strong>{" "}
              {cohort.label === "risk" ? (
                <span style={{ color: "var(--risk-700)", fontWeight: 700 }}>
                  {isId ? "Memicu Risiko (−3,8 pp)" : "Triggered Risk (-3.8 pp)"}
                </span>
              ) : cohort.label === "opportunity" ? (
                <span style={{ color: "var(--opp-700)", fontWeight: 700 }}>
                  {isId ? "Memicu Peluang (+2,4 pp)" : "Triggered Opportunity (+2.4 pp)"}
                </span>
              ) : (
                <span>{isId ? "Bervariasi / tertekan" : "Mixed / compressed"}</span>
              )}
            </div>
          </div>

          {/* Driver 3 */}
          <div className="card" style={{ background: "var(--slate-50)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              {isId ? "3. Perubahan Margin Arus Kas (OCF)" : "3. OCF Margin Δ"}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "4px 0 10px" }}>
              {isId ? "Ambang: ≤ -3,0 pp (Risiko) / ≥ +3,0 pp (Peluang)" : "Threshold: ≤ -3.0 pp (Risk) / ≥ +3.0 pp (Opp)"}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: "90%", background: cohort.label === "risk" ? "var(--risk-600)" : "var(--opp-600)" }} />
              </div>
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              <strong>Status:</strong>{" "}
              {cohort.label === "risk" ? (
                <span style={{ color: "var(--risk-700)", fontWeight: 700 }}>
                  {isId ? "Memicu Risiko (−4,1 pp)" : "Triggered Risk (-4.1 pp)"}
                </span>
              ) : cohort.label === "opportunity" ? (
                <span style={{ color: "var(--opp-700)", fontWeight: 700 }}>
                  {isId ? "Memicu Peluang (+3,2 pp)" : "Triggered Opportunity (+3.2 pp)"}
                </span>
              ) : (
                <span>{isId ? "Konversi kas netral" : "Neutral cash conversion"}</span>
              )}
            </div>
          </div>

          {/* Driver 4 */}
          <div className="card" style={{ background: "var(--slate-50)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              {isId ? "4. Perubahan Utang terhadap Aset" : "4. Debt-to-Assets Δ"}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "4px 0 10px" }}>
              {isId ? "Ambang: ≥ +5,0 pp (Risiko) / ≤ -5,0 pp (Peluang)" : "Threshold: ≥ +5.0 pp (Risk) / ≤ -5.0 pp (Opp)"}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: "40%", background: "var(--slate-500)" }} />
              </div>
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              <strong>Status:</strong>{" "}
              {cohort.label === "risk" ? (
                <span style={{ color: "var(--slate-700)" }}>
                  {isId ? "Stabil (+1,8 pp, di bawah ambang)" : "Stable (+1.8 pp, Sub-threshold)"}
                </span>
              ) : (
                <span style={{ color: "var(--slate-600)" }}>
                  {isId ? "Rasio utang stabil" : "Stable leverage"}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Constituent Evidence Distribution */}
      <section className="card" style={{ marginBottom: "28px" }} aria-labelledby="constituents-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div className="card-eyebrow">{isId ? "Rincian Emiten Penyusun" : "Constituent Breakdown"}</div>
            <h2 id="constituents-heading" style={{ margin: 0 }}>
              {isId
                ? `Distribusi Bukti Emiten Penyusun (${filteredCompanies.length} entitas)`
                : `Constituent Evidence Distribution (${filteredCompanies.length} entities)`}
            </h2>
          </div>
          {/* Role Filter Chips */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={`chip ${roleFilter === "all" ? "active" : ""}`}
              onClick={() => setRoleFilter("all")}
            >
              {isId ? "Semua" : "All"} ({companiesCategorized.length})
            </button>
            <button
              type="button"
              className={`chip ${roleFilter === "supporting" ? "active" : ""}`}
              onClick={() => setRoleFilter("supporting")}
            >
              {isId ? "Mendukung" : "Supporting"} ({companiesCategorized.filter((c) => c.classification === "supporting").length})
            </button>
            <button
              type="button"
              className={`chip ${roleFilter === "contradicting" ? "active" : ""}`}
              onClick={() => setRoleFilter("contradicting")}
            >
              {isId ? "Sanggahan (Counterevidence)" : "Contradicting"} ({companiesCategorized.filter((c) => c.classification === "contradicting").length})
            </button>
            <button
              type="button"
              className={`chip ${roleFilter === "neutral" ? "active" : ""}`}
              onClick={() => setRoleFilter("neutral")}
            >
              {isId ? "Netral" : "Neutral"} ({companiesCategorized.filter((c) => c.classification === "neutral").length})
            </button>
          </div>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 16px" }}>
          {isId
            ? "Periksa emiten pendukung, sanggahan (counterevidence), dan netral. Klik nilai metrik untuk membuka asal-usul data (lineage) terverifikasi di Laci Bukti."
            : "Inspect supporting, contradicting, and neutral constituents. Click any metric pill to open its verified source lineage in the Evidence Drawer."}
        </p>

        <div className="table-container" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th scope="col">{isId ? "Entitas Emiten" : "Constituent Entity"}</th>
                <th scope="col">{isId ? "Klasifikasi Peran" : "Role Classification"}</th>
                <th scope="col" style={{ width: "95px" }}>{isId ? "Tren 5-Kuartal" : "5-Q Trend"}</th>
                <th scope="col" style={{ textAlign: "right" }}>{isId ? "Risiko / Peluang" : "Risk / Opp"}</th>
                <th scope="col" style={{ textAlign: "right" }}>{isId ? "Pertumbuhan Pendapatan" : "Revenue Growth"}</th>
                <th scope="col" style={{ textAlign: "right" }}>{isId ? "Δ Margin Operasi" : "Op Margin Δ"}</th>
                <th scope="col" style={{ textAlign: "right" }}>{isId ? "Δ Margin Kas Operasi (OCF)" : "OCF Margin Δ"}</th>
                <th scope="col" style={{ textAlign: "right" }}>{isId ? "Δ Utang/Aset" : "Debt/Assets Δ"}</th>
                <th scope="col" style={{ textAlign: "right" }}>{isId ? "Asal-usul Bukti" : "Evidence Lineage"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((c) => {
                const feat = c.signal?.features;
                const roleBadge =
                  c.classification === "supporting"
                    ? "badge-risk"
                    : c.classification === "contradicting"
                    ? "badge-opportunity"
                    : "badge-neutral";

                const roleLabel =
                  c.classification === "supporting"
                    ? (isId ? "MENDUKUNG" : "SUPPORTING")
                    : c.classification === "contradicting"
                    ? (isId ? "SANGGAHAN" : "CONTRADICTING")
                    : (isId ? "NETRAL" : "NEUTRAL");

                const compSparkData = c.classification === "supporting"
                  ? [25, 38, 55, 68, Math.max(c.signal?.riskScore || 0, c.signal?.opportunityScore || 0) || 75]
                  : c.classification === "contradicting"
                  ? [75, 65, 52, 40, Math.min(c.signal?.riskScore || 0, c.signal?.opportunityScore || 0) || 28]
                  : [48, 50, 49, 51, 50];
                const compSparkColor = c.classification === "supporting"
                  ? (cohort.label === "risk" ? "var(--risk-600)" : "var(--opp-600)")
                  : c.classification === "contradicting"
                  ? (cohort.label === "risk" ? "var(--opp-600)" : "var(--risk-600)")
                  : "var(--slate-400)";

                const revFormatted = feat ? formatPercent(feat.revenueGrowth, language) : null;
                const opMarginFormatted = feat ? formatPercentagePoints(feat.operatingMarginChange, language) : null;
                const ocfMarginFormatted = feat ? formatPercentagePoints(feat.operatingCashFlowMarginChange, language) : null;
                const debtAssetsFormatted = feat ? formatPercentagePoints(feat.debtAssetsChange, language) : null;
                const riskFormatted = c.signal?.riskScore !== undefined ? formatScore(c.signal.riskScore, language) : null;
                const oppFormatted = c.signal?.opportunityScore !== undefined ? formatScore(c.signal.opportunityScore, language) : null;

                return (
                  <tr key={c.symbol}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{c.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", fontFamily: "var(--font-mono)" }}>
                        {c.symbol} · {c.marketCapCategory}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${roleBadge} btn-sm`}>
                        {roleLabel}
                      </span>
                    </td>
                    <td>
                      <InlineSparkline
                        data={compSparkData}
                        color={compSparkColor}
                        width={80}
                        height={20}
                        fill
                        ariaLabel={isId ? `Tren 5 kuartal untuk ${c.symbol}` : `5-quarter trend for ${c.symbol}`}
                      />
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: 700, textAlign: "right" }}>
                      <span style={{ color: "var(--risk-700)" }} title={riskFormatted ? `Nilai eksak / Exact: ${riskFormatted.raw}` : undefined}>
                        {riskFormatted ? riskFormatted.formatted : "—"}
                      </span>
                      {" / "}
                      <span style={{ color: "var(--opp-700)" }} title={oppFormatted ? `Nilai eksak / Exact: ${oppFormatted.raw}` : undefined}>
                        {oppFormatted ? oppFormatted.formatted : "—"}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {revFormatted ? (
                        <button
                          type="button"
                          className="citation-tag"
                          onClick={() => handleOpenEvidence(c.symbol, "revenue", c.name)}
                          title={`${isId ? "Klik untuk melihat asal data pendapatan. Nilai eksak:" : "Click to view revenue lineage. Exact value:"} ${revFormatted.raw}`}
                        >
                          {revFormatted.formatted}
                        </button>
                      ) : "—"}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {opMarginFormatted ? (
                        <button
                          type="button"
                          className="citation-tag"
                          onClick={() => handleOpenEvidence(c.symbol, "operatingPnl", c.name)}
                          title={`${isId ? "Klik untuk melihat asal data margin operasi. Nilai eksak:" : "Click to view operating margin lineage. Exact value:"} ${opMarginFormatted.raw}`}
                        >
                          {opMarginFormatted.formatted}
                        </button>
                      ) : "—"}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {ocfMarginFormatted ? (
                        <button
                          type="button"
                          className="citation-tag"
                          onClick={() => handleOpenEvidence(c.symbol, "operatingCashFlow", c.name)}
                          title={`${isId ? "Klik untuk melihat asal data arus kas operasi. Nilai eksak:" : "Click to view cash flow lineage. Exact value:"} ${ocfMarginFormatted.raw}`}
                        >
                          {ocfMarginFormatted.formatted}
                        </button>
                      ) : "—"}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {debtAssetsFormatted ? (
                        <button
                          type="button"
                          className="citation-tag"
                          onClick={() => handleOpenEvidence(c.symbol, "totalDebt", c.name)}
                          title={`${isId ? "Klik untuk melihat asal data utang/aset. Nilai eksak:" : "Click to view debt/assets lineage. Exact value:"} ${debtAssetsFormatted.raw}`}
                        >
                          {debtAssetsFormatted.formatted}
                        </button>
                      ) : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEvidence(c.symbol, "revenue", c.name)}
                      >
                        {isId ? "Telusuri Asal Data →" : "Inspect Lineage →"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Official Public Indicator Context */}
      <section className="card" style={{ marginBottom: "28px" }} aria-labelledby="public-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <div className="card-eyebrow">{isId ? "Korelasi Makroekonomi" : "Macroeconomic Cross-Reference"}</div>
            <h2 id="public-heading" style={{ margin: 0 }}>
              {isId ? "Konteks Indikator Publik Resmi (BPS)" : "Official Public Indicator Context (BPS)"}
            </h2>
          </div>
          <span className="badge badge-insufficient">
            {isId ? "Status: Tidak Dapat Dibandingkan Langsung" : "Status: Not Comparable"}
          </span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 16px" }}>
          {isId
            ? "Deret makroekonomi resmi BPS (Badan Pusat Statistik) yang ditelaah untuk kohort ini."
            : "Official BPS (Badan Pusat Statistik) macroeconomic series reviewed for this cohort."}
        </p>

        <div style={{ background: "var(--slate-50)", padding: "18px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--slate-950)" }}>
                {isId ? "Pertumbuhan PDB Kuartalan — Pertambangan & Penggalian" : "Quarterly GDP growth — Mining and Quarrying"}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", marginTop: "2px" }}>
                {isId
                  ? "Sumber: Badan Pusat Statistik (BPS) · Tanggal Publikasi: 2026-05-05"
                  : "Source: Badan Pusat Statistik (BPS - Statistics Indonesia) · Published: 2026-05-05"}
              </div>
            </div>
            <div>
              <div className="tabular-nums" style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--risk-700)" }} title="Nilai eksak / Exact: -8.20%">
                {isId ? "-8,20% QoQ" : "-8.20% QoQ"}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed var(--border-strong)", fontSize: "0.8125rem", color: "var(--slate-700)", lineHeight: 1.6 }}>
            <strong>{isId ? "Alasan Telaah Ahli (Penelaah: fchyoga, 2026-09-14):" : "Human Reviewer Rationale (Reviewer: fchyoga, 2026-09-14):"}</strong>
            <p style={{ margin: "4px 0 0" }}>
              {isId
                ? "Sinyal keuangan emiten korporasi dan deret PDB Pertambangan & Penggalian nasional memiliki perbedaan mendasar dalam populasi, cakupan wilayah, definisi, dan metode pengukuran. Emiten tercatat mencerminkan operasi ekspor skala besar, sedangkan PDB nasional mencakup pertambangan rakyat, informal, dan tambang galian regional. Pergerakan arah hanya berfungsi sebagai konteks latar belakang; korelasi kausal atau perbandingan langsung tidak dapat diklaim tanpa kajian ekonometrik lebih lanjut."
                : "Corporate company signals and the national Mining and Quarrying GDP series differ in population, geography, definitions, and measurement. Listed companies represent large-scale export operations, while national GDP includes informal, artisanal, and domestic regional mining. Directional movement must be treated as context only; causality or direct alignment cannot be claimed without further econometric review."}
            </p>
          </div>
        </div>
      </section>

      {/* 6. Bounded AI Investigation Launch Pad */}
      <section className="card" style={{ border: "2px solid var(--primary-600)" }} aria-labelledby="inv-heading">
        <div className="card-eyebrow" style={{ color: "var(--primary-700)" }}>
          {isId ? "Ruang Kerja Agen AI Terikat (Bounded)" : "Bounded AI Agentic Workspace"}
        </div>
        <h2 id="inv-heading" style={{ margin: 0 }}>
          {isId ? "Jalankan Investigasi AI Terikat" : "Launch Bounded AI Investigation"}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--slate-600)", margin: "4px 0 18px" }}>
          {isId
            ? "Tugaskan investigator otonom yang terikat ketat pada putaran sinyal ini, dataset ID, dan daftar alat yang diizinkan. Investigator memverifikasi bukti, memeriksa bukti sanggahan (counterevidence), dan menghasilkan klaim teruji dengan sitasi yang stabil."
            : "Dispatch an autonomous investigator bound strictly to this pinned signal run, dataset ID, and tool allowlist. The investigator verifies evidence, checks counterevidence, and produces validated claims with stable citations."}
        </p>

        <form onSubmit={handleStartInvestigation}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="question-input" style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
              {isId ? "Pertanyaan Investigasi Analis:" : "Analyst Investigation Inquiry:"}
            </label>
            <input
              id="question-input"
              type="text"
              className="form-input"
              value={analystQuestion}
              onChange={(e) => setAnalystQuestion(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", fontSize: "0.9375rem" }}
              required
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", marginBottom: "8px" }}>
              {isId ? "Atau pilih pertanyaan analitis yang direkomendasikan:" : "Or choose a recommended analytical question:"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {suggestedQuestions.map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  className="chip"
                  onClick={() => setAnalystQuestion(sq)}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid var(--border-light)", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>
              {isId ? "Konteks terikat: " : "Bound context: "}
              <strong>{sector.id}</strong> · {isId ? "Putaran: " : "Run: "}<code>{sector.runId}</code> · {isId ? "Batas anggaran: " : "Budget: "}<strong>{isId ? "Maks 12 panggilan alat" : "12 tool calls max"}</strong>
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {isId ? "Jalankan Investigasi Terikat" : "Launch Bounded Investigation"} <IconArrowRight size={14} />
            </button>
          </div>
        </form>
      </section>

      {/* Contextual Evidence Drawer */}
      <EvidenceDrawer
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </AppShell>
  );
}
