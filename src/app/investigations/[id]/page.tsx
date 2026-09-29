"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { DataModeBadge } from "../../../components/ui/DataModeBadge";
import { EvidenceDrawer, type EvidenceRecord } from "../../../components/ui/EvidenceDrawer";
import { IconTerminal, IconAlertTriangle } from "../../../components/ui/Icons";
import { useLanguage } from "../../../lib/i18n";
import type { InvestigationBrief, InvestigationEvent, InvestigationStatus } from "../../../domain/investigation";
import type { Route } from "next";

const TOOL_LABELS: Record<string, { id: string; en: string }> = {
  get_signal: { id: "Membaca sinyal sektor", en: "Reading sector signal" },
  list_company_signals: { id: "Memeriksa sinyal perusahaan", en: "Inspecting company signals" },
  get_company_evidence: { id: "Mengambil bukti perusahaan", en: "Retrieving company evidence" },
  get_counterevidence: { id: "Mencari bukti penyangkal", en: "Checking counterevidence" },
  compare_public_indicator: { id: "Membandingkan indikator publik", en: "Comparing public indicator" },
  get_public_indicator: { id: "Mengambil indikator publik", en: "Retrieving public indicator" },
};

function getToolLabel(tool: string, isId: boolean): string {
  return TOOL_LABELS[tool]?.[isId ? "id" : "en"] ?? tool.replace(/_/g, " ");
}

interface LiveInvestigation {
  id: string;
  cohortId: string;
  signalRunId: string;
  question: string;
  status: InvestigationStatus;
  dataMode: "live";
  period: string;
  methodVersion: string;
  model: string;
  createdAt: string;
  finishedAt?: string;
  events: readonly InvestigationEvent[];
  brief: InvestigationBrief | null;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function InvestigationWorkspacePage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const { language } = useLanguage();
  const isId = language === "id";

  const [investigation, setInvestigation] = useState<LiveInvestigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingBrief, setOpeningBrief] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const response = await fetch(`/api/v1/investigations/${id}`);
        if (response.ok && !ignore) {
          const data = await response.json();
          setInvestigation(data.investigation);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [id]);

  const handleOpenBrief = async () => {
    if (!investigation) return;
    setOpeningBrief(true);
    try {
      const res = await fetch("/api/v1/briefs/from-investigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investigationId: investigation.id }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/briefs/${data.briefId}` as Route);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOpeningBrief(false);
    }
  };

  const handleOpenCitation = async (evId: string) => {
    if (!investigation) return;
    try {
      const res = await fetch(`/api/v1/evidence/${investigation.signalRunId}/${evId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedEvidence({
        id: data.id,
        entityName: data.symbol,
        symbol: data.symbol,
        metric: data.metric,
        priorValue: data.priorValue,
        currentValue: data.currentValue,
        unit: data.unit,
        currency: data.currency,
        basis: data.basis,
        period: data.period,
        retrievedAt: data.retrievedAt,
        formula: "100 * (current - prior) / |prior|",
        calculationResult: data.currentValue && data.priorValue ? `${(100 * (Number(data.currentValue) - Number(data.priorValue)) / Math.abs(Number(data.priorValue))).toFixed(2)}%` : "—",
        datasetId: data.datasetId,
        signalRunId: data.signalRunId,
        notes: isId ? "Observasi tersitasi terikat pada silsilah investigasi live." : "Cited observation bound to the live investigation lineage.",
        sourcePointer: data.sourcePointer,
        payloadHash: data.payloadHash,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppShell dataMode="live">
        <div style={{ padding: "64px 24px", textAlign: "center" }}>
          <div className="sidebar-logo-pulse" style={{ width: "16px", height: "16px", marginBottom: "16px" }} />
          <h2>{isId ? "Memuat ruang kerja investigasi..." : "Loading investigation workspace..."}</h2>
          <p style={{ color: "var(--slate-500)" }}>
            {isId ? "Mengambil konteks putaran sinyal tersemat dan asal-usul klaim" : "Retrieving pinned signal run context and claim lineage"}
          </p>
        </div>
      </AppShell>
    );
  }

  if (!investigation) {
    return (
      <AppShell dataMode="live">
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <h2>{isId ? "Investigasi Tidak Ditemukan" : "Investigation Not Found"}</h2>
          <p>{isId ? "Investigasi yang diminta tidak ada atau sudah kedaluwarsa." : "The requested investigation does not exist or has expired."}</p>
          <Link href={"/investigations" as Route} className="btn btn-primary">
            {isId ? "Kembali ke Daftar Investigasi" : "Return to Investigations"}
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell dataMode="live">
      {/* Back link */}
      <div style={{ marginBottom: "16px" }}>
        <Link href={"/investigations" as Route} style={{ fontSize: "0.875rem", color: "var(--slate-600)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          {isId ? "← Kembali ke Daftar Investigasi" : "← Back to Investigations"}
        </Link>
      </div>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <DataModeBadge mode="live" size="sm" />
              <span className={`badge ${investigation.status === "completed" ? "badge-opportunity" : "badge-neutral"}`}>
                STATUS: {investigation.status === "completed" ? (isId ? "SELESAI" : "COMPLETED") : investigation.status === "running" ? (isId ? "BERJALAN" : "RUNNING") : (isId ? "SEBAGIAN" : "PARTIAL")}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--slate-500)", fontFamily: "var(--font-mono)" }}>
                ID: {investigation.id}
              </span>
            </div>
            <h1>{isId ? "Ruang Kerja Investigasi AI Terikat" : "Bounded AI Investigation Workspace"}</h1>
            <p className="page-subtitle">
              {isId ? "Pertanyaan: " : "Inquiry: "}&quot;<strong>{investigation.question}</strong>&quot;
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {investigation.status === "completed" && investigation.brief && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenBrief}
                disabled={openingBrief}
              >
                {openingBrief ? (isId ? "Membuka..." : "Opening...") : (isId ? "Buka Ringkasan Keputusan →" : "Open Decision Brief →")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Column Workspace */}
      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(340px, 1fr) minmax(360px, 1.2fr)", gap: "20px", alignItems: "start" }}>

        {/* COLUMN 1: Pinned Context & Budgets */}
        <div className="card" style={{ position: "sticky", top: "76px" }}>
          <div className="card-eyebrow">{isId ? "Batasan Perlindungan Deterministik" : "Deterministic Guardrails"}</div>
          <h2 style={{ fontSize: "1rem", margin: "0 0 14px", color: "var(--slate-950)" }}>
            {isId ? "Konteks Investigasi Tersemat" : "Pinned Investigation Context"}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.8125rem" }}>
            <div>
              <span style={{ color: "var(--slate-500)" }}>{isId ? "Sektor Sasaran:" : "Target Sector:"}</span>
              <div style={{ fontWeight: 700, color: "var(--slate-950)", fontSize: "0.9375rem" }}>
                {investigation.cohortId}
              </div>
            </div>

            <div>
              <span style={{ color: "var(--slate-500)" }}>{isId ? "Periode Pelaporan:" : "Reporting Period:"}</span>
              <div className="tabular-nums" style={{ fontWeight: 600 }}>{investigation.period}</div>
            </div>

            <div>
              <span style={{ color: "var(--slate-500)" }}>{isId ? "ID Putaran Sinyal:" : "Signal Run ID:"}</span>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", wordBreak: "break-all", background: "var(--slate-50)", padding: "4px 8px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
                {investigation.signalRunId}
              </div>
            </div>

            <div>
              <span style={{ color: "var(--slate-500)" }}>{isId ? "Mesin Metode:" : "Method Engine:"}</span>
              <div><strong>Method v{investigation.methodVersion}</strong> ({isId ? "Deterministik" : "Deterministic"})</div>
            </div>

            <div>
              <span style={{ color: "var(--slate-500)" }}>{isId ? "Model Otonom:" : "Autonomous Model:"}</span>
              <div><strong className="tabular-nums">{investigation.model}</strong></div>
            </div>

            <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
                {isId ? "Batasan & Kuota Aktif" : "Active Guardrails & Quota"}
              </div>
              <ul style={{ margin: 0, paddingLeft: "16px", color: "var(--slate-700)", fontSize: "0.75rem", lineHeight: 1.6 }}>
                <li>{isId ? "Anggaran Alat: Maks 12 panggilan" : "Tool Budget: 12 calls max"}</li>
                <li>{isId ? "Batas Waktu Eksekusi: 120 detik" : "Execution Timeout: 120 seconds"}</li>
                <li>{isId ? "Validasi Sitasi: Ditegakkan" : "Citation Validation: Enforced"}</li>
                <li>{isId ? "Proteksi Fabrikasi: Tanpa angka atau sumber baru" : "Fabrication Protection: No invented numbers or sources"}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Timeline & Tool Execution Stream */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <div className="card-eyebrow">{isId ? "Jejak Eksekusi" : "Execution Trace"}</div>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{isId ? "Lini Masa Investigasi" : "Investigation Timeline"}</h2>
            </div>
            <span className="badge badge-neutral">
              {isId ? `${investigation.events.length} Peristiwa` : `${investigation.events.length} Events`}
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
                        {getToolLabel(ev.tool, isId)}
                      </>
                    ) : (
                      ev.type.replace(/_/g, " ")
                    )}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: "0.6875rem", color: "var(--slate-500)" }}>
                    {new Date(ev.at).toLocaleTimeString(isId ? "id-ID" : "en-US")}
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
              <div className="card-eyebrow">{isId ? "Landasan Bukti" : "Evidence Grounding"}</div>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{isId ? "Temuan Terstruktur & Klaim" : "Structured Findings & Claims"}</h2>
            </div>
            {investigation.brief && <span className="badge badge-opportunity">{isId ? "Klaim Terverifikasi" : "Claims Verified"}</span>}
          </div>

          {!investigation.brief ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--slate-500)" }}>
              <p>{isId ? "Investigasi ini belum menghasilkan temuan terstruktur." : "This investigation has not produced structured findings yet."}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Executive Synthesis */}
              <div style={{ background: "var(--slate-50)", padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                <div className="card-eyebrow">{isId ? "Sintesis Eksekutif" : "Executive Synthesis"}</div>
                <p style={{ margin: "4px 0 0", fontSize: "0.875rem", lineHeight: 1.5, color: "var(--slate-900)" }}>
                  {investigation.brief.summary}
                </p>
              </div>

              {/* Claims Breakdown */}
              <div>
                <div className="card-eyebrow">
                  {isId ? `Klaim Teruji (${investigation.brief.claims.length})` : `Atomic Claims (${investigation.brief.claims.length})`}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                  {investigation.brief.claims.map((claim, idx) => {
                    let badgeClass = "badge-neutral";
                    if (claim.kind === "observation") badgeClass = "badge-opportunity";
                    else if (claim.kind === "interpretation") badgeClass = "badge-live";
                    else if (claim.kind === "limitation") badgeClass = "badge-insufficient";

                    const kindLabel =
                      claim.kind === "observation"
                        ? (isId ? "OBSERVASI" : "OBSERVATION")
                        : claim.kind === "interpretation"
                        ? (isId ? "INTERPRETASI" : "INTERPRETATION")
                        : claim.kind === "hypothesis"
                        ? (isId ? "HIPOTESIS" : "HYPOTHESIS")
                        : (isId ? "BATASAN" : "LIMITATION");

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
                            {kindLabel}
                          </span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {claim.evidenceIds.map((eid, eIdx) => (
                              <button
                                key={eid}
                                type="button"
                                className="citation-tag"
                                onClick={() => handleOpenCitation(eid)}
                                title={isId ? `Klik untuk meninjau rekaman bukti ${eid}` : `Click to inspect evidence record ${eid}`}
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
              {investigation.brief.contradictingEvidenceIds.length > 0 ? (
                <div style={{ padding: "12px 14px", background: "var(--warn-50)", border: "1px solid var(--warn-200)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--warn-900)", textTransform: "uppercase", marginBottom: "4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <IconAlertTriangle size={13} /> {isId ? "Bukti Sanggahan & Divergensi" : "Counterevidence & Divergence"}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--warn-900)", lineHeight: 1.45, display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {investigation.brief.contradictingEvidenceIds.map((eid, eIdx) => (
                      <button key={eid} type="button" className="citation-tag" onClick={() => handleOpenCitation(eid)}>[C{eIdx + 1}]</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "12px 14px", background: "var(--slate-50)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", color: "var(--slate-600)" }}>
                  {isId ? "Tidak ada bukti sanggahan yang diajukan untuk investigasi ini." : "No counterevidence was raised for this investigation."}
                </div>
              )}

              {investigation.brief.dataGaps.length > 0 && (
                <div style={{ padding: "12px 14px", background: "var(--slate-50)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", color: "var(--slate-700)", lineHeight: 1.5 }}>
                  <strong>{isId ? "Kesenjangan Data: " : "Data Gaps: "}</strong>
                  {investigation.brief.dataGaps.join(" · ")}
                </div>
              )}

              {/* Public Macro Comparison Context */}
              <div style={{ padding: "12px 14px", background: "var(--slate-50)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", lineHeight: 1.45 }}>
                <span style={{ fontWeight: 700, color: "var(--slate-800)" }}>
                  {isId ? "Konteks Makro Publik: " : "Public Macro Context: "}
                </span>
                <span style={{ color: "var(--slate-700)" }}>{investigation.brief.publicComparison}</span>
              </div>

              {/* CTA */}
              <div style={{ paddingTop: "8px" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={handleOpenBrief}
                  disabled={openingBrief}
                >
                  {openingBrief ? (isId ? "Membuka..." : "Opening...") : (isId ? "Buka Ringkasan Keputusan →" : "Open Decision Brief →")}
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
