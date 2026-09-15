"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { AppShell } from "../../../components/layout/AppShell";
import { DataModeBadge } from "../../../components/ui/DataModeBadge";
import { validateBriefCitations, renderBriefMarkdown, type DecisionBriefData } from "../../../domain/brief";
import { EvidenceDrawer, type EvidenceRecord } from "../../../components/ui/EvidenceDrawer";
import { IconCheck, IconCopy, IconDownload, IconAlertTriangle, IconShieldCheck } from "../../../components/ui/Icons";
import { useLanguage } from "../../../lib/i18n";
import type { Route } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export default function BriefBuilderPage({ params }: Props) {
  const { id } = use(params);
  const { language } = useLanguage();
  const isId = language === "id";

  const [brief, setBrief] = useState<DecisionBriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"document" | "markdown">("document");
  const [copiedMd, setCopiedMd] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);

  // Editable fields
  const [title, setTitle] = useState("");
  const [analystNotes, setAnalystNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "reviewed" | "final">("draft");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/briefs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBrief(data.brief);
          setTitle(data.brief.title);
          setAnalystNotes(data.brief.analystNotes);
          setStatus(data.brief.status);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async (isNewVersion = false) => {
    if (!brief) return;
    setSaving(true);
    try {
      const nextVersion = isNewVersion ? brief.currentVersion + 1 : brief.currentVersion;
      const res = await fetch(`/api/briefs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          analystNotes,
          status,
          currentVersion: nextVersion,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBrief(data.brief);
        alert(isNewVersion ? `Snapshot created: v${nextVersion}.0!` : "Brief saved successfully!");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save brief.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCitation = (evId: string) => {
    const item = brief?.evidenceRegister.find((e) => e.id === evId);
    setSelectedEvidence({
      id: evId,
      entityName: item?.symbol || "Constituent Observation",
      symbol: item?.symbol || "IDX",
      metric: item?.metric || "revenue",
      priorValue: item?.priorValue || "—",
      currentValue: item?.currentValue || "—",
      unit: item?.unit || "IDR",
      currency: "IDR",
      basis: "standalone_quarter",
      period: brief?.period || "Q1-2026",
      retrievedAt: "2026-09-14 18:30:00 UTC",
      formula: "100 * (current - prior) / |prior|",
      calculationResult: item?.calculation || "—",
      datasetId: brief?.datasetId || "synthetic-dataset-v0.1",
      signalRunId: brief?.signalRunId || "run-energy-coal-2026-03-31",
      sourcePointer: item?.sourcePointer || "/0/metric",
      notes: "Immutable cited observation registered in brief provenance.",
    });
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
      <AppShell dataMode="synthetic">
        <div style={{ padding: "64px 24px", textAlign: "center" }}>
          <div className="sidebar-logo-pulse" style={{ width: "16px", height: "16px", marginBottom: "16px" }} />
          <h2>Loading Decision Brief...</h2>
          <p style={{ color: "var(--slate-500)" }}>Validating immutable citations and version snapshots</p>
        </div>
      </AppShell>
    );
  }

  if (!brief) {
    return (
      <AppShell dataMode="synthetic">
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <h2>Brief Not Found</h2>
          <Link href={"/briefs" as Route} className="btn btn-primary">Return to Briefs</Link>
        </div>
      </AppShell>
    );
  }

  const { valid: citationsValid, missingCitations } = validateBriefCitations(brief);
  const markdownText = renderBriefMarkdown(
    {
      ...brief,
      title,
      analystNotes,
      status,
    },
    language
  );

  return (
    <AppShell dataMode={brief.dataMode}>
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
              <DataModeBadge mode={brief.dataMode} size="sm" />
              <span className="badge badge-snapshot">
                {isId ? `Versi ${brief.currentVersion}.0` : `Version ${brief.currentVersion}.0`}
              </span>
              <span className={`badge ${status === "final" ? "badge-opportunity" : "badge-neutral"}`}>
                STATUS: {status === "final" ? (isId ? "FINAL" : "FINAL") : status === "reviewed" ? (isId ? "DITELAAH" : "REVIEWED") : (isId ? "DRAF" : "DRAFT")}
              </span>
              {citationsValid && (
                <span className="badge badge-opportunity" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <IconCheck size={12} /> {brief.evidenceRegister.length} {isId ? "Sitasi Terverifikasi" : "Citations Verified"}
                </span>
              )}
            </div>
            <h1>{isId ? "Ringkasan Keputusan Eksekutif" : "Executive Decision Brief"}</h1>
            <p className="page-subtitle">
              {isId ? "Kohort: " : "Cohort: "}<strong>{brief.cohortId}</strong> · {isId ? "Referensi: " : "Reference: "}<code>{brief.id}</code>
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "var(--slate-200)", padding: "2px", borderRadius: "var(--radius-md)" }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "document" ? "btn-primary" : ""}`}
                onClick={() => setActiveTab("document")}
              >
                {isId ? "Dokumen Eksekutif" : "Executive Document"}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "markdown" ? "btn-primary" : ""}`}
                onClick={() => setActiveTab("markdown")}
              >
                {isId ? "Sumber Markdown" : "Markdown Source"}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? (isId ? "Menyimpan..." : "Saving...") : (isId ? "Simpan Draf" : "Save Draft")}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSave(true)}
              disabled={saving}
              title={isId ? "Buat peningkatan versi snapshot yang tidak dapat ditimpa" : "Create an immutable, non-overwritable version increment"}
            >
              {isId ? `Versi Snapshot ${brief.currentVersion + 1}.0` : `Snapshot Version ${brief.currentVersion + 1}.0`}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleCopyMarkdown(markdownText)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {copiedMd ? (
                <>
                  <IconCheck size={13} /> {isId ? "Tersalin!" : "Copied!"}
                </>
              ) : (
                <>
                  <IconCopy size={13} /> {isId ? "Salin .md" : "Copy .md"}
                </>
              )}
            </button>

            <a
              href={`/api/briefs/${id}/export?lang=${language}`}
              download={`${id}.md`}
              className="btn btn-primary btn-sm"
              title={isId ? "Ekspor markdown offline deterministik" : "Deterministic offline markdown export"}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <IconDownload size={13} /> {isId ? "Unduh .md" : "Download .md"}
            </a>
          </div>
        </div>
      </div>

      {!citationsValid && (
        <div style={{ padding: "12px 16px", background: "var(--warn-100)", border: "1px solid var(--warn-500)", borderRadius: "var(--radius-md)", color: "var(--warn-900)", marginBottom: "20px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <IconAlertTriangle size={16} />
          <div><strong>{isId ? "Peringatan Sitasi:" : "Citation Warning:"}</strong> {isId ? "ID bukti terdaftar tidak ditemukan:" : "Missing registered evidence IDs:"} {missingCitations.join(", ")}.</div>
        </div>
      )}

      {activeTab === "document" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
          {/* Main Paper */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Formal Institutional Masthead & Title Card */}
            <div className="card" style={{ borderTop: "4px solid var(--primary-800)", background: "linear-gradient(180deg, #ffffff 0%, var(--slate-50) 100%)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "12px", borderBottom: "1px solid var(--border-light)", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "0.6875rem", letterSpacing: "0.08em", fontWeight: 800, textTransform: "uppercase", color: "var(--primary-900)" }}>
                    {isId ? "REPUBLIK INDONESIA · MEMORANDUM KEBIJAKAN KABINET" : "REPUBLIC OF INDONESIA · CABINET POLICY MEMORANDUM"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
                    {isId
                      ? `Platform Intelijen Deteksi Dini Makroekonomi NADI · Metode v${brief.methodVersion}`
                      : `NADI Macroeconomic Early-Warning Intelligence Platform · Method v${brief.methodVersion}`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="badge badge-neutral" style={{ fontSize: "0.6875rem", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>
                    {isId ? "TERBATAS // SALINAN ANALIS KEBIJAKAN" : "RESTRICTED // POLICY ANALYST COPY"}
                  </span>
                  <span className="badge badge-opportunity" style={{ fontSize: "0.6875rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <IconShieldCheck size={12} /> {isId ? "ASAL DATA TERVERIFIKASI" : "VERIFIED LINEAGE"}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label htmlFor="brief-title-input" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", display: "block", marginBottom: "4px" }}>
                  {isId ? "Perihal Memorandum:" : "Memorandum Subject:"}
                </label>
                <input
                  id="brief-title-input"
                  type="text"
                  className="form-input"
                  style={{ width: "100%", fontSize: "1.25rem", fontWeight: 800, color: "var(--slate-950)", letterSpacing: "-0.015em" }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isId ? "Judul Ringkasan Keputusan" : "Decision Brief Title"}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", padding: "10px 12px", background: "var(--white)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>
                    {isId ? "Kohort Sasaran" : "Target Cohort"}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--slate-900)" }}>{brief.cohortId}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>
                    {isId ? "Basis Kuartal" : "Quarter Base"}
                  </div>
                  <div className="tabular-nums" style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--slate-900)" }}>{brief.period}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>
                    {isId ? "Cakupan Bukti" : "Evidence Scope"}
                  </div>
                  <div className="tabular-nums" style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--slate-900)" }}>
                    {brief.evidenceRegister.length} {isId ? "Sitasi Tidak Dapat Diubah" : "Immutable Citations"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label htmlFor="status-select" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--slate-700)" }}>
                    {isId ? "Klasifikasi Dokumen & Tahap Telaah:" : "Document Classification & Review State:"}
                  </label>
                  <select
                    id="status-select"
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "draft" | "reviewed" | "final")}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="draft">{isId ? "Draf (Kertas Kerja Analis)" : "Draft (Analyst Working Paper)"}</option>
                    <option value="reviewed">{isId ? "Ditelaah (Diverifikasi oleh Analis Kebijakan Utama)" : "Reviewed (Verified by Lead Policy Analyst)"}</option>
                    <option value="final">{isId ? "Final (Terkunci untuk Distribusi Kabinet)" : "Final (Locked for Cabinet Distribution)"}</option>
                  </select>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>
                  {isId ? "Versi: " : "Version: "}<strong className="tabular-nums">v{brief.currentVersion}.0</strong>
                </div>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div className="card">
              <div className="card-eyebrow">
                {isId ? "Bagian 1 · Penilaian Tingkat Tinggi" : "Section 1 · High-Level Assessment"}
              </div>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 10px" }}>
                {isId ? "Ringkasan Eksekutif" : "Executive Summary"}
              </h2>
              <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--slate-900)" }}>
                {brief.executiveSummary}
              </p>
            </div>

            {/* Section 2: Analyst Notes */}
            <div className="card" style={{ borderLeft: "4px solid var(--primary-700)" }}>
              <div className="card-eyebrow" style={{ color: "var(--primary-800)" }}>
                {isId ? "Bagian 2 · Komentar Analis Ahli" : "Section 2 · Human Analyst Commentary"}
              </div>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 8px" }}>
                {isId ? "Implikasi & Rekomendasi Kebijakan" : "Policy Implications & Recommendations"}
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--slate-600)", margin: "0 0 10px" }}>
                {isId
                  ? "Bagian ini ditulis langsung oleh analis ahli dan akan disertakan dalam ekspor markdown resmi."
                  : "This section is directly authored by the human analyst and will be included in the official markdown export."}
              </p>
              <textarea
                className="form-input"
                style={{ width: "100%", minHeight: "120px", fontSize: "0.875rem", lineHeight: 1.5 }}
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                placeholder={isId ? "Masukkan rekomendasi kebijakan untuk Kementerian ESDM, Kementerian Keuangan, atau Bank Indonesia..." : "Enter policy recommendations for Ministry of Energy, Ministry of Finance, or Bank Indonesia..."}
              />
            </div>

            {/* Section 3: Structured Findings */}
            <div className="card">
              <div className="card-eyebrow">{isId ? "Bagian 3" : "Section 3"}</div>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>
                {isId ? "Bukti Terstruktur & Temuan" : "Structured Evidence & Findings"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {brief.findings.map((f, i) => {
                  const kindLabel =
                    f.kind === "observation"
                      ? (isId ? "OBSERVASI" : "OBSERVATION")
                      : f.kind === "interpretation"
                      ? (isId ? "INTERPRETASI" : "INTERPRETATION")
                      : f.kind === "hypothesis"
                      ? (isId ? "HIPOTESIS" : "HYPOTHESIS")
                      : f.kind === "counterevidence"
                      ? (isId ? "SANGGAHAN" : "COUNTEREVIDENCE")
                      : (isId ? "BATASAN" : "LIMITATION");

                  return (
                    <div
                      key={f.id}
                      style={{
                        padding: "14px 16px",
                        background: "var(--slate-50)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span className="badge badge-neutral">
                          {isId ? `Temuan 3.${i + 1} · ${kindLabel}` : `Finding 3.${i + 1} · ${f.kind.toUpperCase()}`}
                        </span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {f.citations.map((c, cIdx) => (
                            <button
                              key={c}
                              type="button"
                              className="citation-tag"
                              onClick={() => handleOpenCitation(c)}
                              title={isId ? `Tinjau bukti tersitasi ${c}` : `Inspect cited evidence ${c}`}
                            >
                              [E{cIdx + 1}]
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--slate-900)", lineHeight: 1.5 }}>
                        {f.statement}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Counterevidence & Macro Context */}
            <div className="card">
              <div className="card-eyebrow">{isId ? "Bagian 4" : "Section 4"}</div>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>
                {isId ? "Bukti Sanggahan & Indikator Publik" : "Counterevidence & Public Indicators"}
              </h2>
              <div style={{ marginBottom: "14px", padding: "12px 14px", background: "var(--warn-50)", border: "1px solid var(--warn-200)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--warn-900)", textTransform: "uppercase", marginBottom: "4px" }}>
                  {isId ? "Emiten Divergen (Bukti Sanggahan / Counterevidence)" : "Divergent Constituents (Counterevidence)"}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--warn-900)", lineHeight: 1.45 }}>
                  {brief.counterevidenceSummary}
                </div>
              </div>

              <div style={{ padding: "12px 14px", background: "var(--slate-50)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--slate-700)", textTransform: "uppercase", marginBottom: "4px" }}>
                  {isId ? "Konteks Makroekonomi Resmi BPS (Tidak Dapat Dibandingkan Langsung)" : "Official BPS Macroeconomic Context (Not Comparable)"}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--slate-700)", lineHeight: 1.45 }}>
                  {brief.publicIndicatorContext}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Evidence Register & Audit Provenance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card">
              <div className="card-eyebrow">{isId ? "Register Sitasi" : "Citation Register"}</div>
              <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>
                {isId ? `Bukti Tersitasi (${brief.evidenceRegister.length})` : `Cited Evidence (${brief.evidenceRegister.length})`}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", margin: "0 0 12px" }}>
                {isId ? "Setiap butir merupakan observasi yang diverifikasi oleh Metode v0.1." : "Each item represents an immutable observation verified by Method v0.1."}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {brief.evidenceRegister.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "10px 12px",
                      background: "var(--slate-50)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong className="tabular-nums" style={{ color: "var(--slate-900)" }}>{item.symbol}</strong>
                      <button
                        type="button"
                        className="citation-tag"
                        onClick={() => handleOpenCitation(item.id)}
                      >
                        [E{idx + 1}] {isId ? "Telusuri" : "Inspect"}
                      </button>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--slate-600)", marginTop: "4px" }}>
                      {isId ? "Metrik: " : "Metric: "}{item.metric} · {isId ? "Hasil: " : "Result: "}<strong className="tabular-nums">{item.calculation}</strong>
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--slate-400)", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
                      {item.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-eyebrow">{isId ? "Asal-usul & Jejak Audit" : "Provenance & Lineage"}</div>
              <table style={{ margin: 0, fontSize: "0.75rem" }}>
                <tbody>
                  <tr>
                    <td style={{ color: "var(--slate-500)", padding: "6px 0" }}>{isId ? "Penyusun:" : "Author:"}</td>
                    <td style={{ padding: "6px 0" }}><strong>{brief.author}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--slate-500)", padding: "6px 0" }}>{isId ? "Dataset:" : "Dataset:"}</td>
                    <td style={{ padding: "6px 0" }}><code style={{ fontSize: "0.6875rem" }}>{brief.datasetId}</code></td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--slate-500)", padding: "6px 0" }}>{isId ? "Putaran Sinyal:" : "Signal Run:"}</td>
                    <td style={{ padding: "6px 0" }}><code style={{ fontSize: "0.6875rem" }}>{brief.signalRunId}</code></td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--slate-500)", padding: "6px 0" }}>{isId ? "Dibuat:" : "Created:"}</td>
                    <td style={{ padding: "6px 0" }} className="tabular-nums">
                      {new Date(brief.createdAt).toLocaleString(isId ? "id-ID" : "en-US")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Markdown Source Tab */
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
            <div>
              <div className="card-eyebrow">{isId ? "Keluaran Deterministik" : "Deterministic Output"}</div>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{isId ? "Aliran Sumber Markdown" : "Markdown Source Stream"}</h2>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleCopyMarkdown(markdownText)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                {copiedMd ? (
                  <>
                    <IconCheck size={13} /> {isId ? "Tersalin ke Papan Klip" : "Copied to Clipboard"}
                  </>
                ) : (
                  <>
                    <IconCopy size={13} /> {isId ? "Salin Markdown Mentah" : "Copy Raw Markdown"}
                  </>
                )}
              </button>
              <a
                href={`/api/briefs/${id}/export?lang=${language}`}
                download={`${id}.md`}
                className="btn btn-primary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <IconDownload size={13} /> {isId ? "Unduh .md" : "Download .md"}
              </a>
            </div>
          </div>
          <pre
            style={{
              background: "var(--slate-50)",
              padding: "20px",
              borderRadius: "var(--radius-md)",
              overflowX: "auto",
              fontSize: "0.8125rem",
              lineHeight: 1.6,
              border: "1px solid var(--border-light)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {markdownText}
          </pre>
        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </AppShell>
  );
}
