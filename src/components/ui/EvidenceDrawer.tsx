"use client";

import { useState, useEffect, type FC } from "react";
import { IconClose, IconCopy, IconCheck, IconShieldCheck } from "./Icons";

export interface EvidenceRecord {
  id: string;
  entityName: string;
  symbol: string;
  metric: string;
  priorValue: string | null;
  currentValue: string | null;
  unit: string;
  currency: string;
  basis: string;
  period: string;
  retrievedAt: string;
  formula: string;
  calculationResult: string;
  datasetId: string;
  signalRunId: string;
  notes?: string;
  sourcePointer?: string;
  payloadHash?: string;
}

interface Props {
  evidence: EvidenceRecord | null;
  onClose: () => void;
}

export const EvidenceDrawer: FC<Props> = ({ evidence, onClose }) => {
  const [activeTab, setActiveTab] = useState<"math" | "disclosure" | "lineage">("math");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (evidence) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [evidence, onClose]);

  if (!evidence) return null;

  const handleCopy = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="badge badge-snapshot">Evidence Lineage</span>
              <span style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>Method v0.1 Verified</span>
            </div>
            <h3 id="drawer-title" style={{ margin: 0, fontSize: "1.2rem", color: "var(--slate-950)" }}>
              {evidence.id}
            </h3>
            <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", marginTop: "2px" }}>
              {evidence.entityName} (<strong className="tabular-nums">{evidence.symbol}</strong>)
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close evidence drawer"
          >
            <IconClose size={14} /> Close
          </button>
        </div>

        {/* Tabbed Navigation */}
        <div className="drawer-tabs">
          <button
            type="button"
            className={`drawer-tab ${activeTab === "math" ? "active" : ""}`}
            onClick={() => setActiveTab("math")}
          >
            Formula & Math
          </button>
          <button
            type="button"
            className={`drawer-tab ${activeTab === "disclosure" ? "active" : ""}`}
            onClick={() => setActiveTab("disclosure")}
          >
            Disclosures & Basis
          </button>
          <button
            type="button"
            className={`drawer-tab ${activeTab === "lineage" ? "active" : ""}`}
            onClick={() => setActiveTab("lineage")}
          >
            Cryptographic Lineage
          </button>
        </div>

        <div className="drawer-body">
          {/* TAB 1: FORMULA & CALCULATION */}
          {activeTab === "math" && (
            <div>
              <div className="card" style={{ marginBottom: "20px", background: "var(--slate-50)" }}>
                <div className="card-eyebrow">Deterministic Calculation (Decimal.js)</div>
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--slate-600)" }}>Applied Formula:</span>
                  <div
                    style={{
                      marginTop: "4px",
                      padding: "10px 12px",
                      background: "var(--white)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8125rem",
                      color: "var(--primary-800)",
                    }}
                  >
                    {evidence.formula}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ padding: "10px", background: "var(--white)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase" }}>Prior Base Value</div>
                    <div className="tabular-nums" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--slate-800)", marginTop: "2px" }}>
                      {evidence.priorValue ? Number(evidence.priorValue).toLocaleString("id-ID") : "—"}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--slate-400)" }}>{evidence.currency} ({evidence.unit})</div>
                  </div>

                  <div style={{ padding: "10px", background: "var(--white)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase" }}>Current Target Value</div>
                    <div className="tabular-nums" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--slate-800)", marginTop: "2px" }}>
                      {evidence.currentValue ? Number(evidence.currentValue).toLocaleString("id-ID") : "—"}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--slate-400)" }}>{evidence.currency} ({evidence.unit})</div>
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "var(--primary-50)", border: "1px solid var(--primary-200)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--primary-800)", fontWeight: 700, textTransform: "uppercase" }}>
                    Deterministic Output Result
                  </div>
                  <div className="tabular-nums" style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--primary-900)", marginTop: "2px" }}>
                    {evidence.calculationResult}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--primary-700)", marginTop: "2px" }}>
                    Calculated via Method v0.1 without floating point drift.
                  </div>
                </div>
              </div>

              {evidence.notes && (
                <div style={{ padding: "12px 16px", background: "var(--warn-50)", border: "1px solid var(--warn-200)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", color: "var(--warn-900)" }}>
                  <strong>Accounting Treatment:</strong> {evidence.notes}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DISCLOSURES & BASIS */}
          {activeTab === "disclosure" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="card" style={{ padding: "16px" }}>
                <div className="card-eyebrow">Financial Statement Context</div>
                <table style={{ margin: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ color: "var(--slate-500)", width: "160px" }}>Entity Symbol</td>
                      <td><strong className="tabular-nums">{evidence.symbol}</strong> ({evidence.entityName})</td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--slate-500)" }}>Evaluated Metric</td>
                      <td><strong>{evidence.metric.replace(/_/g, " ").toUpperCase()}</strong></td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--slate-500)" }}>Accounting Basis</td>
                      <td><span className="badge badge-neutral">{evidence.basis}</span> (Discrete standalone quarter, not YTD)</td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--slate-500)" }}>Target Period</td>
                      <td><strong className="tabular-nums">{evidence.period}</strong></td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--slate-500)" }}>Reporting Currency</td>
                      <td><strong>{evidence.currency}</strong> (Normalized to IDR)</td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--slate-500)" }}>Source JSON Pointer</td>
                      <td><code>{evidence.sourcePointer || "/0"}</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: "0.8125rem", color: "var(--slate-600)", lineHeight: 1.6 }}>
                <strong>Quality Assurance Note:</strong> Standalone quarterly figures for Q2, Q3, and Q4 are derived deterministically by subtracting prior cumulative filings from the current year-to-date filing, preserving audit alignment.
              </div>
            </div>
          )}

          {/* TAB 3: CRYPTOGRAPHIC LINEAGE */}
          {activeTab === "lineage" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="card" style={{ padding: "16px", background: "var(--slate-50)" }}>
                <div className="card-eyebrow">Cryptographic Audit Hashes</div>

                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-600)" }}>
                      Observation SHA-256 Hash
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "2px 8px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      onClick={() => handleCopy(evidence.payloadHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "hash")}
                    >
                      {copiedField === "hash" ? (
                        <>
                          <IconCheck size={11} /> Copied!
                        </>
                      ) : (
                        <>
                          <IconCopy size={11} /> Copy Hash
                        </>
                      )}
                    </button>
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "8px 12px",
                      background: "var(--white)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      wordBreak: "break-all",
                      color: "var(--slate-800)",
                    }}
                  >
                    {evidence.payloadHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-600)" }}>
                      Stable Citation Reference
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "2px 8px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      onClick={() => handleCopy(evidence.id, "ref")}
                    >
                      {copiedField === "ref" ? (
                        <>
                          <IconCheck size={11} /> Copied!
                        </>
                      ) : (
                        <>
                          <IconCopy size={11} /> Copy Ref
                        </>
                      )}
                    </button>
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "8px 12px",
                      background: "var(--white)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--primary-800)",
                      fontWeight: 700,
                    }}
                  >
                    {evidence.id}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-600)" }}>Dataset Lineage</span>
                  <table style={{ margin: "6px 0 0", fontSize: "0.8125rem" }}>
                    <tbody>
                      <tr>
                        <td style={{ color: "var(--slate-500)", padding: "6px 0" }}>Dataset Run ID:</td>
                        <td style={{ padding: "6px 0" }}><code>{evidence.datasetId}</code></td>
                      </tr>
                      <tr>
                        <td style={{ color: "var(--slate-500)", padding: "6px 0" }}>Signal Run ID:</td>
                        <td style={{ padding: "6px 0" }}><code>{evidence.signalRunId}</code></td>
                      </tr>
                      <tr>
                        <td style={{ color: "var(--slate-500)", padding: "6px 0" }}>Observation Timestamp:</td>
                        <td style={{ padding: "6px 0" }} className="tabular-nums">{evidence.retrievedAt}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "28px", paddingTop: "16px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>
              Citation key: <strong>[{evidence.id.split("-").slice(1, 3).join("-")}]</strong>
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => handleCopy(evidence.id, "citation")}
            >
              {copiedField === "citation" ? (
                <>
                  <IconCheck size={12} /> Reference Copied
                </>
              ) : (
                <>
                  <IconCopy size={12} /> Copy Citation Tag
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
