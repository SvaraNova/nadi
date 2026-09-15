"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { SignalDirectionBadge } from "../../components/ui/SignalDirectionBadge";
import { InlineSparkline } from "../../components/ui/InlineSparkline";
import { buildSectorSignalRuns, SECTOR_DEFINITIONS } from "../../domain/sectors-dataset";
import type { Route } from "next";

const SECTOR_SPARKLINE_DATA: Record<string, number[]> = {
  "energy-coal": [20, 30, 50, 65, 75],
  "consumer-staples": [40, 55, 65, 72, 80],
  "basic-materials-nickel": [35, 45, 50, 60, 70],
  "retail-trade": [40, 42, 45, 48, 50],
  "financials-banks": [25, 30, 35, 40, 45],
};

export default function RadarPage() {
  const allSectors = useMemo(() => buildSectorSignalRuns(), []);

  // Filter States
  const [period, setPeriod] = useState("Q1-2026");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"strength" | "breadth" | "name">("strength");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const industries = useMemo(() => {
    return Array.from(new Set(allSectors.map((s) => s.industry)));
  }, [allSectors]);

  // Counts for filter chips
  const counts = useMemo(() => {
    return {
      all: allSectors.length,
      pressure: allSectors.filter((s) => s.cohortSignal.label === "risk").length,
      opportunity: allSectors.filter((s) => s.cohortSignal.label === "opportunity").length,
      mixed: allSectors.filter((s) => s.cohortSignal.label === "mixed").length,
      neutral: allSectors.filter((s) => s.cohortSignal.label === "insufficient_data" || s.cohortSignal.label === "no_broad_signal").length,
    };
  }, [allSectors]);

  const filteredSectors = useMemo(() => {
    return allSectors
      .filter((s) => {
        // Direction
        if (directionFilter === "pressure" && s.cohortSignal.label !== "risk") return false;
        if (directionFilter === "opportunity" && s.cohortSignal.label !== "opportunity") return false;
        if (directionFilter === "mixed" && s.cohortSignal.label !== "mixed") return false;
        if (directionFilter === "neutral" && s.cohortSignal.label !== "insufficient_data" && s.cohortSignal.label !== "no_broad_signal") return false;

        // Industry
        if (industryFilter !== "all" && s.industry !== industryFilter) return false;

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchInd = s.industry.toLowerCase().includes(q);
          const def = SECTOR_DEFINITIONS.find((sd) => sd.id === s.id);
          const matchTicker = def?.companies.some((c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
          if (!matchName && !matchInd && !matchTicker) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "strength") {
          const scoreA = Math.max(Number(a.cohortSignal.riskScore || 0), Number(a.cohortSignal.opportunityScore || 0));
          const scoreB = Math.max(Number(b.cohortSignal.riskScore || 0), Number(b.cohortSignal.opportunityScore || 0));
          return scoreB - scoreA;
        }
        if (sortBy === "breadth") {
          const breadthA = Math.max(Number(a.cohortSignal.riskBreadth || 0), Number(a.cohortSignal.opportunityBreadth || 0));
          const breadthB = Math.max(Number(b.cohortSignal.riskBreadth || 0), Number(b.cohortSignal.opportunityBreadth || 0));
          return breadthB - breadthA;
        }
        return a.name.localeCompare(b.name);
      });
  }, [allSectors, directionFilter, industryFilter, searchQuery, sortBy]);

  const handleReset = () => {
    setDirectionFilter("all");
    setIndustryFilter("all");
    setSearchQuery("");
    setSortBy("strength");
  };

  return (
    <AppShell dataMode="synthetic" activePeriod={`${period} vs ${period === "Q1-2026" ? "Q1-2025" : "Q4-2024"}`}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-snapshot">Evidence Cohorts</span>
              <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>Method v0.1 Evaluated</span>
            </div>
            <h1>Sector Signal Radar</h1>
            <p className="page-subtitle">
              Explore corporate evidence, breadth of financial shifts, and deterministic signal scores across Indonesian sectors.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "cards" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setViewMode("cards")}
              aria-label="Cards view"
            >
              Cards Grid
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "table" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              Data Table
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Strip */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        <button
          type="button"
          className={`chip ${directionFilter === "all" ? "active" : ""}`}
          onClick={() => setDirectionFilter("all")}
        >
          All Cohorts ({counts.all})
        </button>
        <button
          type="button"
          className={`chip ${directionFilter === "pressure" ? "active" : ""}`}
          onClick={() => setDirectionFilter("pressure")}
        >
          ● Pressure ({counts.pressure})
        </button>
        <button
          type="button"
          className={`chip ${directionFilter === "opportunity" ? "active" : ""}`}
          onClick={() => setDirectionFilter("opportunity")}
        >
          ● Opportunity ({counts.opportunity})
        </button>
        <button
          type="button"
          className={`chip ${directionFilter === "mixed" ? "active" : ""}`}
          onClick={() => setDirectionFilter("mixed")}
        >
          ● Mixed ({counts.mixed})
        </button>
        <button
          type="button"
          className={`chip ${directionFilter === "neutral" ? "active" : ""}`}
          onClick={() => setDirectionFilter("neutral")}
        >
          ● Neutral / Insufficient ({counts.neutral})
        </button>
      </div>

      {/* Main Filter Bar */}
      <section className="filter-bar" aria-label="Radar filters">
        <div className="filter-group">
          <label htmlFor="period-select" className="filter-label">Period:</label>
          <select
            id="period-select"
            className="form-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="Q1-2026">Q1-2026 vs Q1-2025 (Latest)</option>
            <option value="Q4-2025">Q4-2025 vs Q4-2024</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="industry-select" className="filter-label">Industry:</label>
          <select
            id="industry-select"
            className="form-select"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="all">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="search-input" className="filter-label">Search:</label>
          <input
            id="search-input"
            type="search"
            placeholder="Search cohort or ticker (e.g. ADRO, ICBP)..."
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "240px" }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sort-select" className="filter-label">Sort:</label>
          <select
            id="sort-select"
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "strength" | "breadth" | "name")}
          >
            <option value="strength">Signal Strength</option>
            <option value="breadth">Signal Breadth</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleReset}
        >
          Reset
        </button>
      </section>

      {/* Results View */}
      {filteredSectors.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px" }}>
          <h3>No cohorts match the filter criteria</h3>
          <p style={{ color: "var(--slate-500)" }}>Try searching a different ticker or resetting your filter selections.</p>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Reset All Filters
          </button>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid-2">
          {filteredSectors.map((s) => {
            const isRisk = s.cohortSignal.label === "risk";
            const isOpp = s.cohortSignal.label === "opportunity";
            const isMixed = s.cohortSignal.label === "mixed";
            const sparkData = SECTOR_SPARKLINE_DATA[s.id] || [50, 50, 50, 50, 50];
            const sparkColor = isRisk
              ? "var(--risk-600)"
              : isOpp
              ? "var(--opp-600)"
              : isMixed
              ? "var(--mixed-600)"
              : "var(--slate-500)";

            const borderAccent = isRisk
              ? "var(--risk-600)"
              : isOpp
              ? "var(--opp-600)"
              : isMixed
              ? "var(--mixed-600)"
              : "var(--slate-300)";

            const def = SECTOR_DEFINITIONS.find((sd) => sd.id === s.id);
            const tickers = def?.companies.map((c) => c.symbol) || [];

            return (
              <div key={s.id} className="card" style={{ borderTop: `3px solid ${borderAccent}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <div className="card-eyebrow">{s.industry}</div>
                      <h2 style={{ margin: "2px 0 0", fontSize: "1.15rem", color: "var(--slate-950)", letterSpacing: "-0.015em" }}>
                        {s.name}
                      </h2>
                    </div>
                    <SignalDirectionBadge direction={s.cohortSignal.label} size="sm" />
                  </div>

                  <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 14px", lineHeight: 1.5 }}>
                    {s.description}
                  </p>

                  {/* Metrics Summary Strip */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", background: "var(--slate-50)", padding: "10px 12px", borderRadius: "var(--radius-sm)", marginBottom: "12px", border: "1px solid var(--border-light)" }}>
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>Risk / Opp</div>
                      <div className="tabular-nums" style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--slate-900)" }}>
                        <span style={{ color: "var(--risk-700)" }}>{s.cohortSignal.riskScore ?? "—"}</span> / <span style={{ color: "var(--opp-700)" }}>{s.cohortSignal.opportunityScore ?? "—"}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>Breadth</div>
                      <div className="tabular-nums" style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--slate-900)" }}>
                        {s.cohortSignal.riskBreadth ? `${Math.round(Number(s.cohortSignal.riskBreadth) * 100)}%` : s.cohortSignal.opportunityBreadth ? `${Math.round(Number(s.cohortSignal.opportunityBreadth) * 100)}%` : "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>Coverage</div>
                      <div className="tabular-nums" style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--slate-900)" }}>
                        {s.cohortSignal.eligibleCount}/{s.cohortSignal.totalMembers}
                      </div>
                    </div>
                  </div>

                  {/* 5-Quarter Trend Sparkline Banner */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--white)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>5-Q Trajectory</div>
                      <div style={{ fontSize: "0.75rem", color: isRisk ? "var(--risk-700)" : isOpp ? "var(--opp-700)" : "var(--slate-700)", fontWeight: 700 }}>
                        {isRisk ? "Ascending Risk (+55pts)" : isOpp ? "Expanding Opportunity (+40pts)" : "Consolidating"}
                      </div>
                    </div>
                    <InlineSparkline
                      data={sparkData}
                      color={sparkColor}
                      width={100}
                      height={28}
                      fill
                      ariaLabel={`5-quarter trajectory for ${s.name}`}
                    />
                  </div>

                  {/* Key Driver Callout */}
                  <div style={{ fontSize: "0.8125rem", color: "var(--slate-800)", marginBottom: "12px", lineHeight: 1.4 }}>
                    <strong>Dominant Driver:</strong> {s.dominantDriver}
                  </div>

                  {/* Constituents Mini-Pills */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", marginBottom: "6px", fontWeight: 700 }}>
                      Tracked Constituents:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {tickers.map((sym) => (
                        <span
                          key={sym}
                          style={{
                            fontSize: "0.6875rem",
                            padding: "2px 6px",
                            borderRadius: "var(--radius-xs)",
                            background: "var(--slate-100)",
                            border: "1px solid var(--border-light)",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color: "var(--slate-700)",
                          }}
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>
                    Dataset: <code style={{ fontSize: "0.6875rem" }}>{s.datasetId}</code>
                  </div>
                  <Link href={`/radar/${s.runId}/${s.id}` as Route} className="btn btn-primary btn-sm">
                    Open Signal &amp; Evidence →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-container">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Cohort / Industry</th>
                  <th scope="col">Signal Direction</th>
                  <th scope="col" style={{ width: "110px" }}>5-Q Trend</th>
                  <th scope="col" style={{ textAlign: "right" }}>Risk / Opp</th>
                  <th scope="col" style={{ textAlign: "right" }}>Breadth</th>
                  <th scope="col" style={{ textAlign: "right" }}>Coverage</th>
                  <th scope="col">Key Constituents</th>
                  <th scope="col">Dominant Financial Driver</th>
                  <th scope="col" style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSectors.map((s) => {
                  const def = SECTOR_DEFINITIONS.find((sd) => sd.id === s.id);
                  const tickers = def?.companies.map((c) => c.symbol).slice(0, 4) || [];
                  const isRisk = s.cohortSignal.label === "risk";
                  const isOpp = s.cohortSignal.label === "opportunity";
                  const isMixed = s.cohortSignal.label === "mixed";
                  const sparkData = SECTOR_SPARKLINE_DATA[s.id] || [50, 50, 50, 50, 50];
                  const sparkColor = isRisk
                    ? "var(--risk-600)"
                    : isOpp
                    ? "var(--opp-600)"
                    : isMixed
                    ? "var(--mixed-600)"
                    : "var(--slate-500)";

                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{s.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>{s.industry}</div>
                      </td>
                      <td><SignalDirectionBadge direction={s.cohortSignal.label} size="sm" /></td>
                      <td>
                        <InlineSparkline
                          data={sparkData}
                          color={sparkColor}
                          width={90}
                          height={22}
                          fill
                          ariaLabel={`5-quarter trend for ${s.name}`}
                        />
                      </td>
                      <td className="tabular-nums" style={{ textAlign: "right" }}>
                        <strong style={{ color: "var(--risk-700)" }}>{s.cohortSignal.riskScore ?? "—"}</strong> / <strong style={{ color: "var(--opp-700)" }}>{s.cohortSignal.opportunityScore ?? "—"}</strong>
                      </td>
                      <td className="tabular-nums" style={{ textAlign: "right" }}>
                        {s.cohortSignal.riskBreadth ? `${Math.round(Number(s.cohortSignal.riskBreadth) * 100)}%` : s.cohortSignal.opportunityBreadth ? `${Math.round(Number(s.cohortSignal.opportunityBreadth) * 100)}%` : "—"}
                      </td>
                      <td className="tabular-nums" style={{ textAlign: "right" }}>{s.cohortSignal.eligibleCount} / {s.cohortSignal.totalMembers}</td>
                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {tickers.map((t) => (
                            <span key={t} style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", background: "var(--slate-100)", padding: "1px 5px", borderRadius: "2px" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.8125rem", maxWidth: "260px" }}>{s.dominantDriver}</td>
                      <td style={{ textAlign: "right" }}>
                        <Link href={`/radar/${s.runId}/${s.id}` as Route} className="btn btn-secondary btn-sm">
                          Inspect →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
