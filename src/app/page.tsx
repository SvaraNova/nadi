"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AppShell } from "../components/layout/AppShell";
import { SignalDirectionBadge } from "../components/ui/SignalDirectionBadge";
import { InlineSparkline } from "../components/ui/InlineSparkline";
import { IconArrowRight, IconShieldCheck, IconInfoCircle } from "../components/ui/Icons";
import { buildSectorSignalRuns, type SectorSignalSummary } from "../domain/sectors-dataset";
import type { Route } from "next";

export default function OverviewPage() {
  const sectors = useMemo(() => buildSectorSignalRuns(), []);
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

  return (
    <AppShell
      dataMode="synthetic"
      datasetTimestamp="2026-09-15 08:00 WIB"
      activePeriod="Q1-2026 vs Q1-2025"
    >
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-live">National Early-Warning Pulse</span>
              <span style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>Reporting Cycle: Q1-2026</span>
              <span className="kbd-shortcut">Press ⌘K to Search</span>
            </div>
            <h1>National Economic Pulse &amp; Financial Shifts</h1>
            <p className="page-subtitle">
              Early-warning macroeconomic signals detected through quarterly audited disclosures across Indonesian listed entities.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link href={"/radar" as Route} className="btn btn-primary btn-sm">
              Explore Sector Radar <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Metabase-Style Macro Telemetry Grid */}
      <section className="grid-4" style={{ marginBottom: "20px" }} aria-label="Macro KPI Summary">
        {/* Cell 1: Pressure */}
        <div className="card" style={{ borderTop: "3px solid var(--risk-600)" }}>
          <div className="card-eyebrow" style={{ color: "var(--risk-700)" }}>Dominant Pressure</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--slate-950)", margin: "4px 0" }}>
            {strongestPressure.name.split("—")[1] || strongestPressure.name}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)" }}>
            Risk Score: <strong className="tabular-nums" style={{ color: "var(--risk-700)" }}>{strongestPressure.cohortSignal.riskScore ?? "—"}/100</strong>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
            Signal Breadth: <strong className="tabular-nums">{Math.round(Number(strongestPressure.cohortSignal.riskBreadth || 0) * 100)}%</strong> of constituents
          </div>
          <div style={{ marginTop: "10px" }}>
            <Link href={`/radar/${strongestPressure.runId}/${strongestPressure.id}` as Route} style={{ fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              Inspect Evidence Lineage <IconArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Cell 2: Opportunity */}
        <div className="card" style={{ borderTop: "3px solid var(--opp-600)" }}>
          <div className="card-eyebrow" style={{ color: "var(--opp-700)" }}>Dominant Opportunity</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--slate-950)", margin: "4px 0" }}>
            {strongestOpportunity.name.split("—")[1] || strongestOpportunity.name}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)" }}>
            Opp Score: <strong className="tabular-nums" style={{ color: "var(--opp-700)" }}>{strongestOpportunity.cohortSignal.opportunityScore ?? "—"}/100</strong>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
            Signal Breadth: <strong className="tabular-nums">{Math.round(Number(strongestOpportunity.cohortSignal.opportunityBreadth || 0) * 100)}%</strong> of constituents
          </div>
          <div style={{ marginTop: "10px" }}>
            <Link href={`/radar/${strongestOpportunity.runId}/${strongestOpportunity.id}` as Route} style={{ fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              Inspect Evidence Lineage <IconArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Cell 3: Active Shifts */}
        <div className="card" style={{ borderTop: "3px solid var(--primary-700)" }}>
          <div className="card-eyebrow">Active Sector Shifts</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--slate-950)", margin: "4px 0" }}>
            <span className="tabular-nums">{pressureSectors.length + opportunitySectors.length + mixedSectors.length}</span> <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)", fontWeight: 500 }}>of {sectors.length} cohorts</span>
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)" }}>
            {pressureSectors.length} pressure, {opportunitySectors.length} expanding, {mixedSectors.length} divergent
          </div>
          <div style={{ marginTop: "10px" }}>
            <span className="badge badge-risk">{pressureSectors.length} High Attention</span>
          </div>
        </div>

        {/* Cell 4: System Integrity & Coverage */}
        <div className="card" style={{ borderTop: "3px solid var(--slate-400)" }}>
          <div className="card-eyebrow">Sample Coverage</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--slate-950)", margin: "4px 0" }}>
            <span className="tabular-nums">{totalEligible}</span> <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)", fontWeight: 500 }}>/ {totalUniverse} companies</span>
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)" }}>
            {insufficientSectors.length} cohort below 60% reporting threshold
          </div>
          <div style={{ marginTop: "10px" }}>
            <span className="badge badge-snapshot">
              <IconShieldCheck size={12} /> Method v0.1 Verified
            </span>
          </div>
        </div>
      </section>

      {/* Interactive 2D Coordinate Plane with Our World in Data Transparency */}
      <section className="card" style={{ marginBottom: "20px", padding: 0 }} aria-labelledby="pulse-matrix-heading">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div className="card-eyebrow">Interactive Sector Coordinate Mapping</div>
            <h2 id="pulse-matrix-heading" style={{ margin: "2px 0 0", fontSize: "1.1rem", color: "var(--slate-950)" }}>
              Opportunity vs. Risk Coordinate Plane
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
              X-Axis: Opportunity Score (0–100) · Y-Axis: Risk Score (0–100) · Circle size proportional to constituent count.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className={`btn btn-sm ${matrixView === "chart" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMatrixView("chart")}
              aria-label="View as 2D Coordinate Chart"
            >
              2D Chart
            </button>
            <button
              type="button"
              className={`btn btn-sm ${matrixView === "table" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMatrixView("table")}
              aria-label="View as Accessible Data Table"
            >
              Data Table
            </button>
          </div>
        </div>

        {matrixView === "chart" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px" }}>
            {/* Matrix Coordinate Plane */}
            <div style={{ position: "relative", height: "340px", margin: "16px", background: "var(--slate-50)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)", overflow: "hidden" }}>
              {/* Axes */}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "var(--border-subtle)", borderTop: "1px dashed var(--slate-300)" }} />
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "var(--border-subtle)", borderLeft: "1px dashed var(--slate-300)" }} />

              {/* Quadrant Indicators */}
              <div style={{ position: "absolute", top: "10px", left: "12px", fontSize: "0.6875rem", fontWeight: 700, padding: "2px 8px", background: "var(--risk-50)", color: "var(--risk-800)", borderRadius: "var(--radius-xs)", border: "1px solid var(--risk-border)" }}>
                Quadrant I: High Pressure
              </div>
              <div style={{ position: "absolute", top: "10px", right: "12px", fontSize: "0.6875rem", fontWeight: 700, padding: "2px 8px", background: "var(--mixed-50)", color: "var(--mixed-800)", borderRadius: "var(--radius-xs)", border: "1px solid var(--mixed-border)" }}>
                Quadrant II: Volatile / Divergent
              </div>
              <div style={{ position: "absolute", bottom: "10px", left: "12px", fontSize: "0.6875rem", fontWeight: 700, padding: "2px 8px", background: "var(--slate-100)", color: "var(--slate-600)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
                Quadrant IV: Baseline / Inert
              </div>
              <div style={{ position: "absolute", bottom: "10px", right: "12px", fontSize: "0.6875rem", fontWeight: 700, padding: "2px 8px", background: "var(--opp-50)", color: "var(--opp-800)", borderRadius: "var(--radius-xs)", border: "1px solid var(--opp-border)" }}>
                Quadrant III: High Opportunity
              </div>

              {/* Plotted Sectors */}
              {sectors.map((s) => {
                const opp = Number(s.cohortSignal.opportunityScore || 0);
                const risk = Number(s.cohortSignal.riskScore || 0);
                const leftPercent = 14 + (opp / 100) * 72;
                const bottomPercent = 14 + (risk / 100) * 72;
                const diameter = 36 + s.cohortSignal.eligibleCount * 3;

                let bgColor = "var(--slate-600)";
                if (s.cohortSignal.label === "risk") bgColor = "var(--risk-600)";
                else if (s.cohortSignal.label === "opportunity") bgColor = "var(--opp-600)";
                else if (s.cohortSignal.label === "mixed") bgColor = "var(--mixed-700)";

                const isHovered = hoveredSector?.id === s.id;

                return (
                  <Link
                    key={s.id}
                    href={`/radar/${s.runId}/${s.id}` as Route}
                    onMouseEnter={() => setHoveredSector(s)}
                    onMouseLeave={() => setHoveredSector(null)}
                    style={{
                      position: "absolute",
                      left: `${leftPercent}%`,
                      bottom: `${bottomPercent}%`,
                      width: `${diameter}px`,
                      height: `${diameter}px`,
                      backgroundColor: bgColor,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--white)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      fontWeight: 800,
                      transform: isHovered ? "translate(-50%, 50%) scale(1.25)" : "translate(-50%, 50%)",
                      boxShadow: isHovered ? "0 0 0 3px var(--white), 0 4px 12px rgba(0,0,0,0.25)" : "0 1px 3px rgba(0,0,0,0.15)",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      textDecoration: "none",
                      zIndex: isHovered ? 10 : 2,
                    }}
                    title={`${s.name} (Risk: ${risk}, Opp: ${opp})`}
                  >
                    {s.id.slice(0, 3).toUpperCase()}
                  </Link>
                );
              })}
            </div>

            {/* Snapping Inspector Panel */}
            <div style={{ padding: "16px 18px", background: "var(--slate-50)", borderLeft: "1px solid var(--border-light)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", letterSpacing: "0.06em", marginBottom: "8px" }}>
                  Active Telemetry Node
                </div>

                {hoveredSector ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <SignalDirectionBadge direction={hoveredSector.cohortSignal.label} size="sm" />
                      <span style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>{hoveredSector.industry}</span>
                    </div>
                    <h3 style={{ margin: "2px 0 10px", fontSize: "0.95rem", color: "var(--slate-950)", fontWeight: 700 }}>
                      {hoveredSector.name}
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ background: "var(--white)", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
                        <div style={{ fontSize: "0.625rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 600 }}>Risk Score</div>
                        <div className="tabular-nums" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--risk-700)" }}>
                          {hoveredSector.cohortSignal.riskScore ?? "—"}
                        </div>
                      </div>
                      <div style={{ background: "var(--white)", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
                        <div style={{ fontSize: "0.625rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 600 }}>Opp Score</div>
                        <div className="tabular-nums" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--opp-700)" }}>
                          {hoveredSector.cohortSignal.opportunityScore ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--slate-700)", marginBottom: "8px", lineHeight: 1.4 }}>
                      <strong>Driver:</strong> {hoveredSector.dominantDriver}
                    </div>

                    <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)" }}>
                      Sample: {hoveredSector.cohortSignal.eligibleCount} of {hoveredSector.cohortSignal.totalMembers} constituents.
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "32px 8px", textAlign: "center", color: "var(--slate-500)", fontSize: "0.75rem" }}>
                    <div style={{ color: "var(--slate-400)", marginBottom: "6px" }}><IconInfoCircle size={22} /></div>
                    Hover over any cohort node on the matrix to inspect its real-time telemetry.
                  </div>
                )}
              </div>

              <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border-light)" }}>
                <Link href={"/radar" as Route} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
                  Open Sector Radar <IconArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Accessible Table Fallback (OWID Pattern) */
          <div className="table-scroll" style={{ padding: "16px" }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Sector Cohort</th>
                  <th scope="col">Direction</th>
                  <th scope="col" style={{ textAlign: "right" }}>Risk Score</th>
                  <th scope="col" style={{ textAlign: "right" }}>Opp Score</th>
                  <th scope="col" style={{ textAlign: "right" }}>Breadth</th>
                  <th scope="col">Dominant Driver</th>
                  <th scope="col" style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sectors.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{s.name}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)" }}>{s.industry}</div>
                    </td>
                    <td><SignalDirectionBadge direction={s.cohortSignal.label} size="sm" /></td>
                    <td className="tabular-nums" style={{ textAlign: "right", color: "var(--risk-700)", fontWeight: 700 }}>
                      {s.cohortSignal.riskScore ?? "—"}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right", color: "var(--opp-700)", fontWeight: 700 }}>
                      {s.cohortSignal.opportunityScore ?? "—"}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      {s.cohortSignal.riskBreadth ? `${Math.round(Number(s.cohortSignal.riskBreadth) * 100)}%` : s.cohortSignal.opportunityBreadth ? `${Math.round(Number(s.cohortSignal.opportunityBreadth) * 100)}%` : "—"}
                    </td>
                    <td style={{ fontSize: "0.75rem", maxWidth: "260px" }}>{s.dominantDriver}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/radar/${s.runId}/${s.id}` as Route} className="btn btn-secondary btn-sm">
                        Inspect →
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
            <strong>Metric:</strong> Signal Heuristic (Scale: 0 to 100) · <strong>Period:</strong> Q1-2026 vs Q1-2025 YoY standalone quarters
          </div>
          <div>
            <strong>Source:</strong> IDX Disclosures via Sectors Financial API v2 · Method v0.1
          </div>
        </div>
      </section>

      {/* Sector Shift Ranking Board (High Data-Ink Table with Inline Sparklines) */}
      <section className="card" style={{ marginBottom: "20px" }} aria-labelledby="shift-ranking-heading">
        <div className="card-header">
          <div>
            <div className="card-eyebrow">Deterministic Signal Rankings</div>
            <h2 id="shift-ranking-heading" style={{ margin: "2px 0 0", fontSize: "1.1rem", color: "var(--slate-950)" }}>
              Ranked Sector Shifts &amp; Financial Velocity
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
              Sorted by macro intervention priority with 5-quarter trend sparklines.
            </div>
          </div>
          <span className="badge badge-snapshot">
            <IconShieldCheck size={12} /> Method v0.1 Verified
          </span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Sector Cohort</th>
                <th scope="col">Direction</th>
                <th scope="col" style={{ width: "110px" }}>5-Q Trend</th>
                <th scope="col" style={{ textAlign: "right" }}>Risk / Opp</th>
                <th scope="col" style={{ textAlign: "right" }}>Breadth</th>
                <th scope="col">Dominant Financial Driver</th>
                <th scope="col">Counter-Signal Divergence</th>
                <th scope="col" style={{ textAlign: "right" }}>Action</th>
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
                      <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{s.name}</div>
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
                        ariaLabel={`5-quarter trend for ${s.name}`}
                      />
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right", fontWeight: 700 }}>
                      <span style={{ color: "var(--risk-700)" }}>{s.cohortSignal.riskScore ?? "—"}</span>
                      <span style={{ color: "var(--slate-400)", margin: "0 4px" }}>/</span>
                      <span style={{ color: "var(--opp-700)" }}>{s.cohortSignal.opportunityScore ?? "—"}</span>
                    </td>
                    <td className="tabular-nums" style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600 }}>
                        {s.cohortSignal.riskBreadth ? `${Math.round(Number(s.cohortSignal.riskBreadth) * 100)}% risk` : ""}
                        {s.cohortSignal.opportunityBreadth ? `${Math.round(Number(s.cohortSignal.opportunityBreadth) * 100)}% opp` : ""}
                        {!s.cohortSignal.riskBreadth && !s.cohortSignal.opportunityBreadth ? "Baseline" : ""}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)" }}>
                        {s.cohortSignal.eligibleCount}/{s.cohortSignal.totalMembers} sample
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
                        Deep Dive <IconArrowRight size={12} />
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
                <div className="card-eyebrow">Bounded Research Workflows</div>
                <h2 className="panel-title" style={{ margin: 0, fontSize: "1rem" }}>Active AI Economic Investigations</h2>
              </div>
              <Link href={"/investigations" as Route} className="btn btn-secondary btn-sm">
                View All <IconArrowRight size={12} />
              </Link>
            </div>
            <div style={{ padding: "12px 14px", background: "var(--slate-50)", borderLeft: "3px solid var(--risk-600)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "var(--slate-950)", fontSize: "0.8125rem" }}>Energy — Coal Mining &amp; Quarrying</strong>
                <span className="badge badge-risk">Pressure</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--slate-700)", marginTop: "4px" }}>
                “Is thermal coal margin compression shared broadly across mid-caps?”
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", marginTop: "6px", display: "flex", gap: "10px" }}>
                <span>Completed</span>
                <span>6 Tool Runs</span>
                <span>Ollama Qwen2.5-7B</span>
              </div>
              <div style={{ marginTop: "8px" }}>
                <Link href={"/investigations/inv-energy-coal-demo" as Route} style={{ fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Open Investigation Workspace <IconArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Decision Briefs */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-eyebrow">Cabinet Memorandum Pipeline</div>
                <h2 className="panel-title" style={{ margin: 0, fontSize: "1rem" }}>Executive Cabinet Briefs</h2>
              </div>
              <Link href={"/briefs" as Route} className="btn btn-secondary btn-sm">
                View All <IconArrowRight size={12} />
              </Link>
            </div>
            <div style={{ padding: "12px 14px", background: "var(--primary-50)", borderLeft: "3px solid var(--primary-800)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "var(--slate-950)", fontSize: "0.8125rem" }}>Q1-2026 Coal Sector Shift: Export Margin Contraction</strong>
                <span className="badge badge-snapshot">v1.0 Final</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--slate-700)", marginTop: "4px" }}>
                Official decision brief with 15 verified citations, counterevidence register, and BPS macroeconomic context.
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <Link href={"/briefs/brief-energy-coal-q1-2026" as Route} className="btn btn-primary btn-sm">
                  Read Brief <IconArrowRight size={12} />
                </Link>
                <a
                  href="/api/briefs/brief-energy-coal-q1-2026/export"
                  download="brief-energy-coal-q1-2026.md"
                  className="btn btn-secondary btn-sm"
                >
                  Export .md
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
