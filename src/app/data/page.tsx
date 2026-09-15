"use client";

import { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { DataModeBadge } from "../../components/ui/DataModeBadge";
import { IconCopy, IconCheck, IconShieldCheck } from "../../components/ui/Icons";
import { SECTOR_DEFINITIONS } from "../../domain/sectors-dataset";

type TabKey = "sources" | "datasets" | "coverage" | "public_indicators" | "methodology";

export default function DataAndMethodPage() {
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

  return (
    <AppShell dataMode="synthetic">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span className="badge badge-snapshot">System Transparency</span>
          <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>Method v0.1 Specification</span>
        </div>
        <h1>Data &amp; Methodology Transparency Workspace</h1>
        <p className="page-subtitle">
          Audit ingestion provenance, historical dataset runs, cohort coverage metrics, public statistical mappings, and deterministic formulas.
        </p>
      </div>

      {/* Segmented Control Navigation */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "24px", background: "var(--white)", padding: "6px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-light)" }}>
        {[
          { key: "sources", label: "1. Data Sources & Feeds" },
          { key: "datasets", label: "2. Dataset Runs & Hashes" },
          { key: "coverage", label: "3. Universe & Coverage" },
          { key: "public_indicators", label: "4. Public Macro Context" },
          { key: "methodology", label: "5. Method v0.1 Math Spec" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`btn btn-sm ${activeTab === t.key ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "var(--radius-md)", border: "none", boxShadow: activeTab === t.key ? "var(--shadow-xs)" : "none" }}
            onClick={() => setActiveTab(t.key as TabKey)}
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
                <div className="card-eyebrow">Corporate Disclosures Connector</div>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem" }}>Sectors Financial API v2</h2>
                <div style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>
                  Primary Provider: Indonesian Listed Companies (IDX) Standardized Financial Statements
                </div>
              </div>
              <span className="badge badge-opportunity">Connector Operational</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", background: "var(--slate-50)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "16px", border: "1px solid var(--border-light)" }}>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>Endpoint Pattern</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--slate-800)", marginTop: "2px" }}>/companies/[symbol]/quarterly</div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>Data Mode</div>
                <div style={{ marginTop: "2px" }}><DataModeBadge mode="synthetic" size="sm" /></div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>Constituent Universe</div>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>31 Listed Indonesian Entities</div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>API Quota State</div>
                <div style={{ fontWeight: 700, color: "var(--opp-700)", marginTop: "2px" }}>41 Remaining / 50 Cap</div>
              </div>
            </div>

            <div style={{ fontSize: "0.875rem", color: "var(--slate-700)", lineHeight: 1.6 }}>
              <strong>Terms &amp; Redistribution Boundaries:</strong> Raw JSON payloads returned by Sectors API are persisted in the local immutable snapshot database with SHA-256 integrity hashing. In accordance with redistribution boundaries, public client interfaces expose normalized metrics and calculation lineage rather than redistributing raw third-party bulk files.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dataset Runs & Hashes */}
      {activeTab === "datasets" && (
        <div className="card">
          <div className="card-eyebrow">Cryptographic Ingestion Ledger</div>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.15rem" }}>Dataset Runs &amp; Observation Counts</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 16px" }}>
            Every signal calculation is bound to an immutable dataset snapshot with cryptographic integrity verification.
          </p>

          <div className="table-container" style={{ margin: 0 }}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Dataset ID</th>
                    <th scope="col">Status</th>
                    <th scope="col">Source Snapshot / SHA-256 Hash</th>
                    <th scope="col">Valid Observations</th>
                    <th scope="col">Rejected</th>
                    <th scope="col">Timestamp</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>synthetic-dataset-v0.1</code></td>
                    <td><span className="badge badge-opportunity btn-sm">COMPLETED</span></td>
                    <td>
                      <code style={{ fontSize: "0.75rem" }}>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
                    </td>
                    <td className="tabular-nums">60 rows</td>
                    <td className="tabular-nums">0 rejected</td>
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
                            <IconCheck size={12} /> Copied
                          </>
                        ) : (
                          <>
                            <IconCopy size={12} /> Copy Hash
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><code>dataset-energy-coal-demo</code></td>
                    <td><span className="badge badge-opportunity btn-sm">COMPLETED</span></td>
                    <td>
                      <code style={{ fontSize: "0.75rem" }}>a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0</code>
                    </td>
                    <td className="tabular-nums">60 rows</td>
                    <td className="tabular-nums">0 rejected</td>
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
                            <IconCheck size={12} /> Copied
                          </>
                        ) : (
                          <>
                            <IconCopy size={12} /> Copy Hash
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
            <div className="card-eyebrow">Sample Completeness</div>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.15rem" }}>Cohort Coverage &amp; Accounting Basis Rules</h2>

            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Cohort Name</th>
                    <th scope="col">Total Universe</th>
                    <th scope="col">Eligible Entities</th>
                    <th scope="col">Coverage %</th>
                    <th scope="col">Accounting Basis</th>
                    <th scope="col">Currency</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Energy — Coal Mining &amp; Quarrying</strong></td>
                    <td className="tabular-nums">7</td>
                    <td className="tabular-nums">6</td>
                    <td className="tabular-nums"><strong style={{ color: "var(--opp-700)" }}>85.7% (Valid)</strong></td>
                    <td>Standalone Quarter</td>
                    <td>IDR Normalized</td>
                  </tr>
                  <tr>
                    <td><strong>Consumer Staples — Food &amp; Beverage</strong></td>
                    <td className="tabular-nums">6</td>
                    <td className="tabular-nums">5</td>
                    <td className="tabular-nums"><strong style={{ color: "var(--opp-700)" }}>83.3% (Valid)</strong></td>
                    <td>Standalone Quarter</td>
                    <td>IDR Normalized</td>
                  </tr>
                  <tr>
                    <td><strong>Basic Materials — Nickel &amp; Minerals</strong></td>
                    <td className="tabular-nums">6</td>
                    <td className="tabular-nums">5</td>
                    <td className="tabular-nums"><strong style={{ color: "var(--opp-700)" }}>83.3% (Valid)</strong></td>
                    <td>Standalone Quarter</td>
                    <td>IDR Normalized</td>
                  </tr>
                  <tr>
                    <td><strong>Industrial — Logistics &amp; Transport</strong></td>
                    <td className="tabular-nums">5</td>
                    <td className="tabular-nums">4</td>
                    <td className="tabular-nums"><strong style={{ color: "var(--opp-700)" }}>80.0% (Valid)</strong></td>
                    <td>Standalone Quarter</td>
                    <td>IDR Normalized</td>
                  </tr>
                  <tr>
                    <td><strong>Telecommunications &amp; Digital Infra</strong></td>
                    <td className="tabular-nums">7</td>
                    <td className="tabular-nums">3</td>
                    <td className="tabular-nums" style={{ color: "var(--risk-700)" }}><strong>42.8% (Insufficient)</strong></td>
                    <td>Standalone Quarter</td>
                    <td>IDR Normalized</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Universe Search */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div className="card-eyebrow">Constituent Directory</div>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>
                  Indexed Indonesian Listed Companies ({filteredCompanies.length} Entities)
                </h3>
              </div>
              <input
                type="search"
                placeholder="Search ticker or company name..."
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
                    <th scope="col">Ticker</th>
                    <th scope="col">Entity Name</th>
                    <th scope="col">Sector Cohort</th>
                    <th scope="col">Industry</th>
                    <th scope="col">Market Cap Tier</th>
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
              <div className="card-eyebrow">Official Statistical Series</div>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.15rem" }}>Quarterly GDP growth — Mining and Quarrying</h2>
              <div style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>
                Publisher: Badan Pusat Statistik (BPS - Statistics Indonesia)
              </div>
            </div>
            <span className="badge badge-insufficient">Review: Not Comparable</span>
          </div>

          <div style={{ background: "var(--slate-50)", padding: "16px", borderRadius: "var(--radius-md)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "16px", border: "1px solid var(--border-light)" }}>
            <div><strong>Geography:</strong> National (Republic of Indonesia)</div>
            <div><strong>Reported QoQ Value:</strong> <span className="tabular-nums" style={{ color: "var(--risk-700)", fontWeight: 700 }}>-8.20%</span></div>
            <div><strong>Observation Cycle:</strong> Q1-2026 (Published May 2026)</div>
            <div><strong>Human Reviewer:</strong> Senior Policy Analyst fchyoga (2026-09-14 08:39 UTC)</div>
          </div>

          <div style={{ fontSize: "0.875rem", color: "var(--slate-700)", lineHeight: 1.6 }}>
            <strong>Formal Review Rationale:</strong> National accounts include informal, artisanal, and small-scale domestic mining operations across all provinces, whereas the NADI Energy/Coal cohort consists exclusively of large-scale, export-oriented IDX listed entities. Directional movement should be inspected for general macro context, but causal claims or validation are not permitted.
          </div>
        </div>
      )}

      {/* Tab 5: Methodology Specification */}
      {activeTab === "methodology" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card">
            <div className="card-eyebrow">Mathematical Specification</div>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>NADI Signal Methodology v0.1 (Deterministic Heuristic)</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--slate-600)", margin: "0 0 18px" }}>
              NADI calculates sector-level signals through transparent decimal arithmetic. The LLM does not generate scores or modify thresholds.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "0.875rem", lineHeight: 1.6 }}>
              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>A. The Four Core Financial Drivers</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "12px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    <strong>1. Revenue Growth YoY:</strong>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary-800)", marginTop: "4px" }}>
                      100 * (current_rev - prior_rev) / |prior_rev|
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    <strong>2. Operating Margin &Delta;:</strong>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary-800)", marginTop: "4px" }}>
                      100 * (current_pnl / current_rev - prior_pnl / prior_rev)
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    <strong>3. OCF Margin &Delta;:</strong>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary-800)", marginTop: "4px" }}>
                      100 * (current_ocf / current_rev - prior_ocf / prior_rev)
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    <strong>4. Debt-to-Assets &Delta;:</strong>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary-800)", marginTop: "4px" }}>
                      100 * (current_debt / current_assets - prior_debt / prior_assets)
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>B. Numerical Threshold Matrix</h3>
                <div className="table-container" style={{ margin: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Driver</th>
                        <th>Risk Threshold</th>
                        <th>Opportunity Threshold</th>
                        <th>Score Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Revenue Growth</strong></td>
                        <td>&le; -10.0%</td>
                        <td>&ge; +10.0%</td>
                        <td>25 points</td>
                      </tr>
                      <tr>
                        <td><strong>Operating Margin Change</strong></td>
                        <td>&le; -2.0% pts</td>
                        <td>&ge; +2.0% pts</td>
                        <td>25 points</td>
                      </tr>
                      <tr>
                        <td><strong>OCF Margin Change</strong></td>
                        <td>&le; -3.0% pts</td>
                        <td>&ge; +3.0% pts</td>
                        <td>25 points</td>
                      </tr>
                      <tr>
                        <td><strong>Debt-to-Assets Change</strong></td>
                        <td>&ge; +5.0% pts</td>
                        <td>&le; -5.0% pts</td>
                        <td>25 points</td>
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
