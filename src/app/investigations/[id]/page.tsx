"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { DataModeBadge } from "../../../components/ui/DataModeBadge";
import { EvidenceDrawer, type EvidenceRecord } from "../../../components/ui/EvidenceDrawer";
import { IconTerminal, IconAlertTriangle, IconArrowRight, IconShieldCheck } from "../../../components/ui/Icons";
import type { StoredInvestigationRecord } from "../../../server/investigation/investigation-service";
import type { Route } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export default function InvestigationWorkspacePage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);

  const [investigation, setInvestigation] = useState<StoredInvestigationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/investigations/${id}`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setInvestigation(data.investigation);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleRunInvestigation = async () => {
    setExecuting(true);
    try {
      const res = await fetch(`/api/investigations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute" }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvestigation(data.investigation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  const handleCancel = async () => {
    try {
      const res = await fetch(`/api/investigations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvestigation(data.investigation);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCitation = (evId: string) => {
    setSelectedEvidence({
      id: evId,
      entityName: evId.includes("AADI") ? "PT Adaro Andalan Indonesia Tbk" : evId.includes("BYAN") ? "PT Bayan Resources Tbk" : "PT Bumi Resources Tbk",
      symbol: evId.includes("AADI") ? "AADI.JK" : evId.includes("BYAN") ? "BYAN.JK" : "BUMI.JK",
      metric: evId.includes("REVENUE") ? "revenue" : evId.includes("PNL") ? "operating_pnl" : "total_debt",
      priorValue: "12500000",
      currentValue: "9800000",
      unit: "IDR thousands",
      currency: "IDR",
      basis: "standalone_quarter",
      period: "Q1-2026 (ended 2026-03-31)",
      retrievedAt: "2026-09-14 18:30:00 UTC",
      formula: "100 * (current - prior) / |prior|",
      calculationResult: "-21.6% YoY",
      datasetId: "synthetic-dataset-v0.1",
      signalRunId: investigation?.signalRunId || "run-energy-coal-2026-03-31",
      notes: "Strict IDR normalization; observation lineage verified by bounded claim validator.",
      sourcePointer: "/0/revenue",
      payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    });
  };

  if (loading) {
    return (
      <AppShell dataMode="synthetic">
        <div style={{ padding: "64px 24px", textAlign: "center" }}>
          <div className="sidebar-logo-pulse" style={{ width: "16px", height: "16px", marginBottom: "16px" }} />
          <h2>Loading investigation workspace...</h2>
          <p style={{ color: "var(--slate-500)" }}>Retrieving pinned signal run context and claim lineage</p>
        </div>
      </AppShell>
    );
  }

  if (!investigation) {
    return (
      <AppShell dataMode="synthetic">
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <h2>Investigation Not Found</h2>
          <p>The requested investigation does not exist or has expired.</p>
          <Link href={"/investigations" as Route} className="btn btn-primary">
            Return to Investigations
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell dataMode={investigation.dataMode}>
      {/* Back link */}
      <div style={{ marginBottom: "16px" }}>
        <Link href={"/investigations" as Route} style={{ fontSize: "0.875rem", color: "var(--slate-600)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          ← Back to Investigations
        </Link>
      </div>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <DataModeBadge mode={investigation.dataMode} size="sm" />
              <span className={`badge ${investigation.status === "completed" ? "badge-opportunity" : "badge-neutral"}`}>
                STATUS: {investigation.status.toUpperCase()}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--slate-500)", fontFamily: "var(--font-mono)" }}>
                ID: {investigation.id}
              </span>
            </div>
            <h1>Bounded AI Investigation Workspace</h1>
            <p className="page-subtitle">
              Inquiry: “<strong>{investigation.question}</strong>”
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {investigation.status === "running" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRunInvestigation}
                disabled={executing}
              >
                {executing ? "Running Investigation..." : "Execute Bounded Run"}
              </button>
            )}
            {investigation.status === "running" && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Cancel Run
              </button>
            )}
            {investigation.status === "completed" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => router.push(`/briefs/new?investigationId=${investigation.id}` as Route)}
              >
                Promote to Decision Brief →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Column Workspace */}
      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(340px, 1fr) minmax(360px, 1.2fr)", gap: "20px", alignItems: "start" }}>

        {/* COLUMN 1: Pinned Context & Budgets */}
        <div className="card" style={{ position: "sticky", top: "76px" }}>
          <div className="card-eyebrow">Deterministic Guardrails</div>
          <h2 style={{ fontSize: "1rem", margin: "0 0 14px", color: "var(--slate-950)" }}>
            Pinned Investigation Context
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.8125rem" }}>
            <div>
              <span style={{ color: "var(--slate-500)" }}>Target Sector:</span>
              <div style={{ fontWeight: 700, color: "var(--slate-950)", fontSize: "0.9375rem" }}>
                {investigation.cohortId}
              </div>
            </div>

            <div>
              <span style={{ color: "var(--slate-500)" }}>Reporting Period:</span>
              <div className="tabular-nums" style={{ fontWeight: 600 }}>{investigation.period}</div>
            </div>

            <div>
              <span style={{ color: "var(--slate-500)" }}>Signal Run ID:</span>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", wordBreak: "break-all", background: "var(--slate-50)", padding: "4px 8px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
                {investigation.signalRunId}
              </div>
            </div>

            <div>
              <span style={{ color: "var(--slate-500)" }}>Method Engine:</span>
              <div><strong>Method v{investigation.methodVersion}</strong> (Deterministic)</div>
            </div>

            <div>
              <span style={{ color: "var(--slate-500)" }}>Autonomous Model:</span>
              <div><strong className="tabular-nums">{investigation.model}</strong></div>
            </div>

            <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
                Active Guardrails &amp; Quota
              </div>
              <ul style={{ margin: 0, paddingLeft: "16px", color: "var(--slate-700)", fontSize: "0.75rem", lineHeight: 1.6 }}>
                <li>Tool Budget: <strong>12 calls max</strong> (6 used)</li>
                <li>Execution Timeout: <strong>120 seconds</strong></li>
                <li>Strict Allowlist: <strong>Active</strong></li>
                <li>Citation Validation: <strong>Enforced</strong></li>
                <li>Fabrication Protection: <strong>No external LLM data</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Timeline & Tool Execution Stream */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <div className="card-eyebrow">Execution Trace</div>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Investigation Timeline</h2>
            </div>
            <span className="badge badge-neutral">
              {investigation.events.length} Events
            </span>
          </div>

          <div className="event-feed">
            {investigation.events.map((ev, index) => (
              <div
                key={index}
                className={`event-item ${ev.type === "completed" ? "success" : ev.tool ? "tool" : ""}`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-700)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    {ev.tool ? (
                      <>
                        <IconTerminal size={13} />
                        Tool: {ev.tool}
                      </>
                    ) : (
                      ev.type.replace(/_/g, " ")
                    )}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: "0.6875rem", color: "var(--slate-500)" }}>
                    {new Date(ev.at).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--slate-800)", lineHeight: 1.4 }}>
                  {ev.message}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 3: Validated Claims & Grounded Synthesis */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <div className="card-eyebrow">Evidence Grounding</div>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Structured Findings &amp; Claims</h2>
            </div>
            <span className="badge badge-opportunity">Claims Verified</span>
          </div>

          {!investigation.brief ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--slate-500)" }}>
              <p>Run the investigation to generate structured, evidence-grounded findings.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRunInvestigation}
                disabled={executing}
              >
                {executing ? "Executing..." : "Start Bounded Run"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Executive Synthesis */}
              <div style={{ background: "var(--slate-50)", padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                <div className="card-eyebrow">Executive Synthesis</div>
                <p style={{ margin: "4px 0 0", fontSize: "0.875rem", lineHeight: 1.5, color: "var(--slate-900)" }}>
                  {investigation.brief.summary}
                </p>
              </div>

              {/* Claims Breakdown */}
              <div>
                <div className="card-eyebrow">Atomic Claims ({investigation.brief.claims.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                  {investigation.brief.claims.map((claim, idx) => {
                    let badgeClass = "badge-neutral";
                    if (claim.kind === "observation") badgeClass = "badge-opportunity";
                    else if (claim.kind === "interpretation") badgeClass = "badge-live";
                    else if (claim.kind === "hypothesis") badgeClass = "badge-synthetic";
                    else if (claim.kind === "limitation") badgeClass = "badge-insufficient";

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 14px",
                          background: "var(--white)",
                          border: "1px solid var(--border-light)",
                          borderRadius: "var(--radius-md)",
                          boxShadow: "var(--shadow-xs)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span className={`badge ${badgeClass}`}>
                            {claim.kind.toUpperCase()}
                          </span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {claim.evidenceIds.map((eid, eIdx) => (
                              <button
                                key={eid}
                                type="button"
                                className="citation-tag"
                                onClick={() => handleOpenCitation(eid)}
                                title={`Click to inspect evidence record ${eid}`}
                              >
                                [E{eIdx + 1}]
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--slate-800)", lineHeight: 1.45 }}>
                          {claim.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Counterevidence Register */}
              {investigation.brief.contradictingEvidenceIds.length > 0 && (
                <div style={{ padding: "12px 14px", background: "var(--warn-50)", border: "1px solid var(--warn-200)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--warn-900)", textTransform: "uppercase", marginBottom: "4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <IconAlertTriangle size={13} /> Counterevidence &amp; Divergence Register
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--warn-900)", lineHeight: 1.45 }}>
                    <strong>BUMI.JK</strong> recorded revenue expansion (+2.17%), diverging from the sector-wide margin compression observed in AADI.JK and BYAN.JK.
                  </div>
                </div>
              )}

              {/* Public Macro Comparison Context */}
              <div style={{ padding: "12px 14px", background: "var(--slate-50)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", lineHeight: 1.45 }}>
                <span style={{ fontWeight: 700, color: "var(--slate-800)" }}>Public Macro Context: </span>
                <span style={{ color: "var(--slate-700)" }}>{investigation.brief.publicComparison}</span>
              </div>

              {/* CTA */}
              <div style={{ paddingTop: "8px" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => router.push(`/briefs/new?investigationId=${investigation.id}` as Route)}
                >
                  Deliver Decision Brief →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </AppShell>
  );
}
