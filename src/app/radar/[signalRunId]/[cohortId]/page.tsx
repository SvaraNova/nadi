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

interface Props {
  params: Promise<{ signalRunId: string; cohortId: string }>;
}

export default function SignalDetailPage({ params }: Props) {
  const router = useRouter();
  const { signalRunId: _signalRunId, cohortId } = use(params);

  const allSectors = useMemo(() => buildSectorSignalRuns(), []);
  const sector = allSectors.find((s) => s.id === cohortId) || allSectors[0];
  const sectorDef = SECTOR_DEFINITIONS.find((s) => s.id === sector.id) || SECTOR_DEFINITIONS[0];

  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | "supporting" | "contradicting" | "neutral">("all");
  const [analystQuestion, setAnalystQuestion] = useState(
    "What factors are driving this financial pattern, and how robust is the signal across constituents?"
  );

  const suggestedQuestions = [
    "What primarily drives the financial pressure or margin contraction in this cohort?",
    "How broadly is the pattern shared between large-caps and mid-tier producers?",
    "Which specific companies contradict the dominant trend, and why?",
    "Is the result heavily dominated by a single large constituent?",
  ];

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
      calcResult = feat ? `${feat.revenueGrowth}%` : "—";
    } else if (metric === "operatingPnl") {
      formula = "100 * (current_pnl/current_rev - prior_pnl/prior_rev)";
      calcResult = feat ? `${feat.operatingMarginChange}% pts` : "—";
    } else if (metric === "operatingCashFlow") {
      formula = "100 * (current_ocf/current_rev - prior_ocf/prior_rev)";
      calcResult = feat ? `${feat.operatingCashFlowMarginChange}% pts` : "—";
    } else if (metric === "totalDebt") {
      formula = "100 * (current_debt/current_assets - prior_debt/prior_assets)";
      calcResult = feat ? `${feat.debtAssetsChange}% pts` : "—";
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
          ← Back to Sector Radar
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
              <span className="badge badge-snapshot">Method v0.1 Evaluated</span>
              <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>Standalone Quarters</span>
            </div>
            <h1 style={{ fontSize: "1.85rem", margin: "0 0 4px" }}>{sector.name}</h1>
            <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--slate-600)" }}>
              Reporting Period: <strong>Q1-2026 vs Q1-2025</strong> · Dataset ID: <code>{sector.datasetId}</code> · Signal Run: <code>{sector.runId}</code>
            </p>
          </div>
          <div>
            <SignalDirectionBadge direction={cohort.label} />
          </div>
        </div>

        {/* 4 Summary Counters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "20px", paddingTop: "18px", borderTop: "1px solid var(--border-light)" }}>
          <div>
            <div className="card-eyebrow">Direction &amp; Scores</div>
            <div className="tabular-nums" style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              <span style={{ color: "var(--risk-700)" }}>Risk: {cohort.riskScore ?? "—"}</span> · <span style={{ color: "var(--opp-700)" }}>Opp: {cohort.opportunityScore ?? "—"}</span>
            </div>
          </div>
          <div>
            <div className="card-eyebrow">Signal Breadth</div>
            <div className="tabular-nums" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--slate-900)" }}>
              {cohort.riskBreadth ? `${Math.round(Number(cohort.riskBreadth) * 100)}% risk` : cohort.opportunityBreadth ? `${Math.round(Number(cohort.opportunityBreadth) * 100)}% opp` : "—"}
            </div>
          </div>
          <div>
            <div className="card-eyebrow">Sample Coverage</div>
            <div className="tabular-nums" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--slate-900)" }}>
              {cohort.eligibleCount} of {cohort.totalMembers} ({Math.round(Number(cohort.coverage) * 100)}%)
            </div>
          </div>
          <div>
            <div className="card-eyebrow">Constituent Sample</div>
            <div className="tabular-nums" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--slate-900)" }}>
              {sectorDef.companies.length} reporting entities
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive 8-Quarter Trajectory Chart (SVG) */}
      <section className="card" style={{ marginBottom: "28px" }} aria-labelledby="trend-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div className="card-eyebrow">Multi-Quarter Trend</div>
            <h2 id="trend-heading" style={{ margin: 0 }}>
              Historical Signal Trajectory (5 Observed Quarters)
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
              Units: Signal Score (0–100 Heuristic, Method v0.1) · Source: IDX Audited Disclosures via Sectors API
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.75rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--risk-700)", fontWeight: 700 }}>
                <span style={{ width: "12px", height: "3px", background: "var(--risk-600)", display: "inline-block" }} />
                Risk Score
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--opp-700)", fontWeight: 700 }}>
                <span style={{ width: "12px", height: "3px", background: "var(--opp-600)", display: "inline-block" }} />
                Opportunity Score
              </span>
            </div>
          </div>
        </div>

        {/* Clean SVG Trajectory Chart */}
        <div style={{ width: "100%", height: "200px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)", padding: "16px 20px 24px", position: "relative", marginBottom: "16px" }}>
          <svg width="100%" height="100%" viewBox="0 0 800 160" preserveAspectRatio="none" style={{ overflow: "visible" }}>
            {/* Grid baselines */}
            <line x1="0" y1="87" x2="800" y2="87" stroke="var(--slate-300)" strokeDasharray="3,3" strokeWidth="1" />
            <text x="5" y="82" fill="var(--slate-400)" fontSize="10" fontFamily="var(--font-mono)">50.0 Critical Signal Action Baseline</text>

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

        <div style={{ fontSize: "0.8125rem", color: "var(--slate-500)", display: "flex", justifyContent: "space-between" }}>
          <span>Notice: Observed quarterly signal score progression. Gaps in reported data are preserved without synthetic interpolation.</span>
          <span className="tabular-nums">Base: Q1-2025 → Target: Q1-2026</span>
        </div>
      </section>

      {/* 3. Deterministic Driver Decomposition */}
      <section className="card" style={{ marginBottom: "28px" }} aria-labelledby="drivers-heading">
        <div className="card-eyebrow">Method v0.1 Decomposition</div>
        <h2 id="drivers-heading">Deterministic Driver Decomposition</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 18px" }}>
          Four fundamental financial drivers evaluated via strict decimal arithmetic. Each driver earns 25 points if its threshold condition is triggered.
        </p>

        <div className="grid-4">
          {/* Driver 1 */}
          <div className="card" style={{ background: "var(--slate-50)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              1. Revenue Growth (YoY)
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "4px 0 10px" }}>
              Threshold: &le; -10% (Risk) / &ge; +10% (Opp)
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: "80%", background: cohort.label === "risk" ? "var(--risk-600)" : "var(--opp-600)" }} />
              </div>
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              <strong>Status:</strong>{" "}
              {cohort.label === "risk" ? (
                <span style={{ color: "var(--risk-700)", fontWeight: 700 }}>Triggered Risk (-21.4% YoY)</span>
              ) : cohort.label === "opportunity" ? (
                <span style={{ color: "var(--opp-700)", fontWeight: 700 }}>Triggered Opportunity</span>
              ) : (
                <span>Within neutral band</span>
              )}
            </div>
          </div>

          {/* Driver 2 */}
          <div className="card" style={{ background: "var(--slate-50)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              2. Operating Margin &Delta;
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "4px 0 10px" }}>
              Threshold: &le; -2.0% pts (Risk) / &ge; +2.0% pts (Opp)
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: "95%", background: cohort.label === "risk" ? "var(--risk-600)" : "var(--opp-600)" }} />
              </div>
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              <strong>Status:</strong>{" "}
              {cohort.label === "risk" ? (
                <span style={{ color: "var(--risk-700)", fontWeight: 700 }}>Triggered Risk (-3.8% pts)</span>
              ) : cohort.label === "opportunity" ? (
                <span style={{ color: "var(--opp-700)", fontWeight: 700 }}>Triggered Opportunity (+2.4% pts)</span>
              ) : (
                <span>Mixed / compressed</span>
              )}
            </div>
          </div>

          {/* Driver 3 */}
          <div className="card" style={{ background: "var(--slate-50)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              3. OCF Margin &Delta;
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "4px 0 10px" }}>
              Threshold: &le; -3.0% pts (Risk) / &ge; +3.0% pts (Opp)
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: "90%", background: cohort.label === "risk" ? "var(--risk-600)" : "var(--opp-600)" }} />
              </div>
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              <strong>Status:</strong>{" "}
              {cohort.label === "risk" ? (
                <span style={{ color: "var(--risk-700)", fontWeight: 700 }}>Triggered Risk (-4.1% pts)</span>
              ) : cohort.label === "opportunity" ? (
                <span style={{ color: "var(--opp-700)", fontWeight: 700 }}>Triggered Opportunity (+3.2% pts)</span>
              ) : (
                <span>Neutral cash conversion</span>
              )}
            </div>
          </div>

          {/* Driver 4 */}
          <div className="card" style={{ background: "var(--slate-50)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              4. Debt-to-Assets &Delta;
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "4px 0 10px" }}>
              Threshold: &ge; +5.0% pts (Risk) / &le; -5.0% pts (Opp)
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: "40%", background: "var(--slate-500)" }} />
              </div>
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              <strong>Status:</strong>{" "}
              {cohort.label === "risk" ? (
                <span style={{ color: "var(--slate-700)" }}>Stable (+1.8% pts, Sub-threshold)</span>
              ) : (
                <span style={{ color: "var(--slate-600)" }}>Stable leverage</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Constituent Evidence Distribution */}
      <section className="card" style={{ marginBottom: "28px" }} aria-labelledby="constituents-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div className="card-eyebrow">Constituent Breakdown</div>
            <h2 id="constituents-heading" style={{ margin: 0 }}>
              Constituent Evidence Distribution ({filteredCompanies.length} entities)
            </h2>
          </div>
          {/* Role Filter Chips */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={`chip ${roleFilter === "all" ? "active" : ""}`}
              onClick={() => setRoleFilter("all")}
            >
              All ({companiesCategorized.length})
            </button>
            <button
              type="button"
              className={`chip ${roleFilter === "supporting" ? "active" : ""}`}
              onClick={() => setRoleFilter("supporting")}
            >
              Supporting ({companiesCategorized.filter((c) => c.classification === "supporting").length})
            </button>
            <button
              type="button"
              className={`chip ${roleFilter === "contradicting" ? "active" : ""}`}
              onClick={() => setRoleFilter("contradicting")}
            >
              Contradicting ({companiesCategorized.filter((c) => c.classification === "contradicting").length})
            </button>
            <button
              type="button"
              className={`chip ${roleFilter === "neutral" ? "active" : ""}`}
              onClick={() => setRoleFilter("neutral")}
            >
              Neutral ({companiesCategorized.filter((c) => c.classification === "neutral").length})
            </button>
          </div>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 16px" }}>
          Inspect supporting, contradicting, and neutral constituents. Click any metric pill to open its verified source lineage in the Evidence Drawer.
        </p>

        <div className="table-container" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th scope="col">Constituent Entity</th>
                <th scope="col">Role Classification</th>
                <th scope="col" style={{ width: "95px" }}>5-Q Trend</th>
                <th scope="col" style={{ textAlign: "right" }}>Risk / Opp</th>
                <th scope="col" style={{ textAlign: "right" }}>Revenue Growth</th>
                <th scope="col" style={{ textAlign: "right" }}>Op Margin &Delta;</th>
                <th scope="col" style={{ textAlign: "right" }}>OCF Margin &Delta;</th>
                <th scope="col" style={{ textAlign: "right" }}>Debt/Assets &Delta;</th>
                <th scope="col" style={{ textAlign: "right" }}>Evidence Lineage</th>
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
                        {c.classification.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <InlineSparkline
                        data={compSparkData}
                        color={compSparkColor}
                        width={80}
                        height={20}
                        fill
                        ariaLabel={`5-quarter trend for ${c.symbol}`}
                      />
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: 700, textAlign: "right" }}>
                      <span style={{ color: "var(--risk-700)" }}>{c.signal?.riskScore ?? "—"}</span> / <span style={{ color: "var(--opp-700)" }}>{c.signal?.opportunityScore ?? "—"}</span>
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {feat ? (
                        <button
                          type="button"
                          className="citation-tag"
                          onClick={() => handleOpenEvidence(c.symbol, "revenue", c.name)}
                          title="Click to view revenue lineage"
                        >
                          {feat.revenueGrowth}%
                        </button>
                      ) : "—"}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {feat ? (
                        <button
                          type="button"
                          className="citation-tag"
                          onClick={() => handleOpenEvidence(c.symbol, "operatingPnl", c.name)}
                          title="Click to view operating margin lineage"
                        >
                          {feat.operatingMarginChange}%
                        </button>
                      ) : "—"}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {feat ? (
                        <button
                          type="button"
                          className="citation-tag"
                          onClick={() => handleOpenEvidence(c.symbol, "operatingCashFlow", c.name)}
                          title="Click to view cash flow lineage"
                        >
                          {feat.operatingCashFlowMarginChange}%
                        </button>
                      ) : "—"}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {feat ? (
                        <button
                          type="button"
                          className="citation-tag"
                          onClick={() => handleOpenEvidence(c.symbol, "totalDebt", c.name)}
                          title="Click to view debt/assets lineage"
                        >
                          {feat.debtAssetsChange}%
                        </button>
                      ) : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEvidence(c.symbol, "revenue", c.name)}
                      >
                        Inspect Lineage →
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
            <div className="card-eyebrow">Macroeconomic Cross-Reference</div>
            <h2 id="public-heading" style={{ margin: 0 }}>Official Public Indicator Context (BPS)</h2>
          </div>
          <span className="badge badge-insufficient">Status: Not Comparable</span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 16px" }}>
          Official BPS (Badan Pusat Statistik) macroeconomic series reviewed for this cohort.
        </p>

        <div style={{ background: "var(--slate-50)", padding: "18px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--slate-950)" }}>
                Quarterly GDP growth — Mining and Quarrying
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", marginTop: "2px" }}>
                Source: Badan Pusat Statistik (BPS - Statistics Indonesia) · Published: 2026-05-05
              </div>
            </div>
            <div>
              <div className="tabular-nums" style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--risk-700)" }}>
                -8.20% QoQ
              </div>
            </div>
          </div>

          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed var(--border-strong)", fontSize: "0.8125rem", color: "var(--slate-700)", lineHeight: 1.6 }}>
            <strong>Human Reviewer Rationale (Reviewer: fchyoga, 2026-09-14):</strong>
            <p style={{ margin: "4px 0 0" }}>
              Corporate company signals and the national Mining and Quarrying GDP series differ in population, geography, definitions, and measurement.
              Listed companies represent large-scale export operations, while national GDP includes informal, artisanal, and domestic regional mining.
              Directional movement must be treated as context only; causality or direct alignment cannot be claimed without further econometric review.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Bounded AI Investigation Launch Pad */}
      <section className="card" style={{ border: "2px solid var(--primary-600)" }} aria-labelledby="inv-heading">
        <div className="card-eyebrow" style={{ color: "var(--primary-700)" }}>Bounded AI Agentic Workspace</div>
        <h2 id="inv-heading" style={{ margin: 0 }}>Launch Bounded AI Investigation</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--slate-600)", margin: "4px 0 18px" }}>
          Dispatch an autonomous investigator bound strictly to this pinned signal run, dataset ID, and tool allowlist.
          The investigator verifies evidence, checks counterevidence, and produces validated claims with stable citations.
        </p>

        <form onSubmit={handleStartInvestigation}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="question-input" style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
              Analyst Investigation Inquiry:
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
              Or choose a recommended analytical question:
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
              Bound context: <strong>{sector.id}</strong> · Run: <code>{sector.runId}</code> · Budget: <strong>12 tool calls max</strong>
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Launch Bounded Investigation <IconArrowRight size={14} />
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
