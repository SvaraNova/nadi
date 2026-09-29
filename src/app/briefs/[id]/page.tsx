"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { AppShell } from "../../../components/layout/AppShell";
import { DataModeBadge } from "../../../components/ui/DataModeBadge";
import { EvidenceDrawer, type EvidenceRecord } from "../../../components/ui/EvidenceDrawer";
import { IconCheck, IconCopy, IconDownload, IconAlertTriangle, IconShieldCheck } from "../../../components/ui/Icons";
import { useLanguage } from "../../../lib/i18n";
import type { Route } from "next";

interface LiveBrief {
  id: string;
  investigationId: string;
  title: string;
  cohortId: string;
  dataMode: "live";
  status: "draft" | "reviewed" | "final";
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  period: string;
  datasetId: string;
  signalRunId: string;
  methodVersion: string;
  author: string;
  executiveSummary: string;
  scope: string;
  signalBreadth: string;
  counterevidenceSummary: string;
  publicIndicatorContext: string;
  analystNotes: string;
  findings: { kind: string; statement: string; citations: string[] }[];
  evidenceRegister: { id: string }[];
  contradictingEvidenceIds: string[];
  dataGaps: string[];
  limitations: string[];
  markdownExport: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function BriefReviewPage({ params }: Props) {
  const { id } = use(params);
  const { language } = useLanguage();
  const isId = language === "id";

  const [brief, setBrief] = useState<LiveBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"document" | "markdown">("document");
  const [copiedMd, setCopiedMd] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/briefs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBrief(data.brief);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleOpenCitation = async (evId: string) => {
    if (!brief) return;
    try {
      const res = await fetch(`/api/v1/evidence/${brief.signalRunId}/${evId}`);
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
        notes: isId ? "Observasi tersitasi terikat pada silsilah brief live." : "Cited observation bound to the live brief lineage.",
        sourcePointer: data.sourcePointer,
        payloadHash: data.payloadHash,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyMarkdown = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  };

  if (loading) {
    return (
      <AppShell dataMode="live">
        <div style={{ padding: "64px 24px", textAlign: "center" }}>
          <div className="sidebar-logo-pulse" style={{ width: "16px", height: "16px", marginBottom: "16px" }} />
          <h2>{isId ? "Memuat Ringkasan Keputusan..." : "Loading Decision Brief..."}</h2>
          <p style={{ color: "var(--slate-500)" }}>{isId ? "Memvalidasi sitasi dan silsilah investigasi" : "Validating citations and investigation lineage"}</p>
        </div>
      </AppShell>
    );
  }

  if (!brief) {
    return (
      <AppShell dataMode="live">
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <h2>{isId ? "Brief Tidak Ditemukan" : "Brief Not Found"}</h2>
          <Link href={"/briefs" as Route} className="btn btn-primary">{isId ? "Kembali ke Brief" : "Return to Briefs"}</Link>
        </div>
      </AppShell>
    );
  }

  const exportHref = `/api/v1/investigations/${brief.investigationId}/export?lang=${language}`;

  return (
    <AppShell dataMode="live">
      {/* Back Link */}
      <div style={{ marginBottom: "16px" }}>
        <Link href={"/briefs" as Route} style={{ fontSize: "0.875rem", color: "var(--slate-600)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          {isId ? "← Kembali ke Ringkasan Keputusan" : "← Back to Decision Briefs"}
        </Link>
      </div>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <DataModeBadge mode="live" size="sm" />
              <span className="badge badge-snapshot">
                {isId ? `Versi ${brief.currentVersion}.0` : `Version ${brief.currentVersion}.0`}
              </span>
              <span className={`badge ${brief.status === "final" ? "badge-opportunity" : "badge-neutral"}`}>
                STATUS: {brief.status === "final" ? "FINAL" : brief.status === "reviewed" ? (isId ? "DITELAAH" : "REVIEWED") : (isId ? "DRAF" : "DRAFT")}
              </span>
              <span className="badge badge-opportunity" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <IconCheck size={12} /> {brief.evidenceRegister.length} {isId ? "Sitasi Terikat" : "Bound Citations"}
              </span>
            </div>
            <h1>{brief.title}</h1>
            <p className="page-subtitle">
              {isId ? "Kohort: " : "Cohort: "}<strong>{brief.cohortId}</strong> · {isId ? "Referensi: " : "Reference: "}<code>{brief.id}</code>
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "var(--slate-200)", padding: "2px", borderRadius: "var(--radius-md)" }}>
              <button type="button" className={`btn btn-sm ${activeTab === "document" ? "btn-primary" : ""}`} onClick={() => setActiveTab("document")}>
                {isId ? "Dokumen Eksekutif" : "Executive Document"}
              </button>
              <button type="button" className={`btn btn-sm ${activeTab === "markdown" ? "btn-primary" : ""}`} onClick={() => setActiveTab("markdown")}>
                {isId ? "Sumber Markdown" : "Markdown Source"}
              </button>
            </div>

            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleCopyMarkdown(brief.markdownExport)} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {copiedMd ? (<><IconCheck size={13} /> {isId ? "Tersalin!" : "Copied!"}</>) : (<><IconCopy size={13} /> {isId ? "Salin .md" : "Copy .md"}</>)}
            </button>

            <a href={exportHref} download={`${brief.id}.md`} className="btn btn-primary btn-sm" title={isId ? "Ekspor markdown offline deterministik" : "Deterministic offline markdown export"} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <IconDownload size={13} /> {isId ? "Unduh .md" : "Download .md"}
            </a>
          </div>
        </div>
      </div>

      {activeTab === "document" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card" style={{ borderTop: "4px solid var(--primary-800)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "12px", borderBottom: "1px solid var(--border-light)", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "0.6875rem", letterSpacing: "0.08em", fontWeight: 800, textTransform: "uppercase", color: "var(--primary-900)" }}>
                    {isId ? "BRIEF INVESTIGASI LIVE" : "LIVE INVESTIGATION BRIEF"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
                    {isId ? `Metode v${brief.methodVersion} · Penyusun: ${brief.author}` : `Method v${brief.methodVersion} · Author: ${brief.author}`}
                  </div>
                </div>
                <span className="badge badge-opportunity" style={{ fontSize: "0.6875rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <IconShieldCheck size={12} /> {isId ? "ASAL DATA TERVERIFIKASI" : "VERIFIED LINEAGE"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", padding: "10px 12px", background: "var(--slate-50)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>{isId ? "Kohort Sasaran" : "Target Cohort"}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--slate-900)" }}>{brief.cohortId}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>{isId ? "Basis Kuartal" : "Quarter Base"}</div>
                  <div className="tabular-nums" style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--slate-900)" }}>{brief.period}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>{isId ? "Cakupan Bukti" : "Evidence Scope"}</div>
                  <div className="tabular-nums" style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--slate-900)" }}>{brief.evidenceRegister.length} {isId ? "Sitasi" : "Citations"}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-eyebrow">{isId ? "Bagian 1 · Penilaian Tingkat Tinggi" : "Section 1 · High-Level Assessment"}</div>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 10px" }}>{isId ? "Ringkasan Eksekutif" : "Executive Summary"}</h2>
              <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--slate-900)" }}>{brief.executiveSummary}</p>
            </div>

            <div className="card">
              <div className="card-eyebrow">{isId ? "Bagian 2" : "Section 2"}</div>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>{isId ? "Bukti Terstruktur & Temuan" : "Structured Evidence & Findings"}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {brief.findings.map((f, i) => (
                  <div key={i} style={{ padding: "14px 16px", background: "var(--slate-50)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span className="badge badge-neutral">{isId ? `Temuan 2.${i + 1} · ${f.kind.toUpperCase()}` : `Finding 2.${i + 1} · ${f.kind.toUpperCase()}`}</span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {f.citations.map((c, cIdx) => (
                          <button key={c} type="button" className="citation-tag" onClick={() => handleOpenCitation(c)} title={isId ? `Tinjau bukti tersitasi ${c}` : `Inspect cited evidence ${c}`}>[E{cIdx + 1}]</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--slate-900)", lineHeight: 1.5 }}>{f.statement}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-eyebrow">{isId ? "Bagian 3" : "Section 3"}</div>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>{isId ? "Bukti Sanggahan & Indikator Publik" : "Counterevidence & Public Indicators"}</h2>
              <div style={{ marginBottom: "14px", padding: "12px 14px", background: "var(--warn-50)", border: "1px solid var(--warn-200)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--warn-900)", textTransform: "uppercase", marginBottom: "4px" }}>{isId ? "Bukti Sanggahan / Counterevidence" : "Counterevidence"}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--warn-900)", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span>{brief.counterevidenceSummary}</span>
                  {brief.contradictingEvidenceIds.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {brief.contradictingEvidenceIds.map((c, cIdx) => (
                        <button key={c} type="button" className="citation-tag" onClick={() => handleOpenCitation(c)}>[C{cIdx + 1}]</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: "12px 14px", background: "var(--slate-50)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-700)", textTransform: "uppercase", marginBottom: "4px" }}>{isId ? "Konteks Makroekonomi Publik (Tidak Dapat Dibandingkan Langsung)" : "Public Macroeconomic Context (Not Comparable)"}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--slate-700)", lineHeight: 1.45 }}>{brief.publicIndicatorContext}</div>
              </div>
              {brief.dataGaps.length > 0 && (
                <div style={{ marginTop: "12px", padding: "12px 14px", background: "var(--slate-50)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", color: "var(--slate-700)" }}>
                  <strong>{isId ? "Kesenjangan Data: " : "Data Gaps: "}</strong>{brief.dataGaps.join(" · ")}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card">
              <div className="card-eyebrow">{isId ? "Register Sitasi" : "Citation Register"}</div>
              <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>{isId ? `Bukti Tersitasi (${brief.evidenceRegister.length})` : `Cited Evidence (${brief.evidenceRegister.length})`}</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", margin: "0 0 12px" }}>{isId ? "Setiap butir merujuk pada observasi live yang tersimpan di PostgreSQL." : "Each item references a live observation persisted in PostgreSQL."}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {brief.evidenceRegister.map((item, idx) => (
                  <div key={item.id} style={{ padding: "10px 12px", background: "var(--slate-50)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <code style={{ fontSize: "0.6875rem", color: "var(--slate-500)" }}>{item.id}</code>
                    <button type="button" className="citation-tag" onClick={() => handleOpenCitation(item.id)}>[E{idx + 1}] {isId ? "Telusuri" : "Inspect"}</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-eyebrow">{isId ? "Asal-usul & Jejak Audit" : "Provenance & Lineage"}</div>
              <table style={{ margin: 0, fontSize: "0.75rem" }}>
                <tbody>
                  <tr><td style={{ color: "var(--slate-500)", padding: "6px 0" }}>{isId ? "Investigasi:" : "Investigation:"}</td><td style={{ padding: "6px 0" }}><code style={{ fontSize: "0.6875rem" }}>{brief.investigationId}</code></td></tr>
                  <tr><td style={{ color: "var(--slate-500)", padding: "6px 0" }}>{isId ? "Putaran Sinyal:" : "Signal Run:"}</td><td style={{ padding: "6px 0" }}><code style={{ fontSize: "0.6875rem" }}>{brief.signalRunId}</code></td></tr>
                  <tr><td style={{ color: "var(--slate-500)", padding: "6px 0" }}>{isId ? "Dibuat:" : "Created:"}</td><td style={{ padding: "6px 0" }} className="tabular-nums">{new Date(brief.createdAt).toLocaleString(isId ? "id-ID" : "en-US")}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
            <div>
              <div className="card-eyebrow">{isId ? "Keluaran Deterministik" : "Deterministic Output"}</div>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{isId ? "Aliran Sumber Markdown" : "Markdown Source Stream"}</h2>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleCopyMarkdown(brief.markdownExport)} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                {copiedMd ? (<><IconCheck size={13} /> {isId ? "Tersalin ke Papan Klip" : "Copied to Clipboard"}</>) : (<><IconCopy size={13} /> {isId ? "Salin Markdown Mentah" : "Copy Raw Markdown"}</>)}
              </button>
              <a href={exportHref} download={`${brief.id}.md`} className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconDownload size={13} /> {isId ? "Unduh .md" : "Download .md"}
              </a>
            </div>
          </div>
          <pre style={{ background: "var(--slate-50)", padding: "20px", borderRadius: "var(--radius-md)", overflowX: "auto", fontSize: "0.8125rem", lineHeight: 1.6, border: "1px solid var(--border-light)", fontFamily: "var(--font-mono)" }}>
            {brief.markdownExport}
          </pre>
        </div>
      )}

      {brief.status === "draft" && brief.evidenceRegister.length === 0 && (
        <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--warn-100)", border: "1px solid var(--warn-500)", borderRadius: "var(--radius-md)", color: "var(--warn-900)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <IconAlertTriangle size={16} />
          <div>{isId ? "Brief ini belum memiliki bukti tersitasi." : "This brief has no cited evidence yet."}</div>
        </div>
      )}

      <EvidenceDrawer evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
    </AppShell>
  );
}
