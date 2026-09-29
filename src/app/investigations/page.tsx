"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { DataModeBadge } from "../../components/ui/DataModeBadge";
import { useLanguage } from "../../lib/i18n";
import type { Route } from "next";
import type { InvestigationBrief } from "../../domain/investigation";

interface LiveInvestigationRow {
  id: string;
  signal_run_id: string;
  status: string;
  brief: InvestigationBrief | null;
  created_at: string;
  finished_at: string | null;
  mode: string;
}

export default function InvestigationsPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [investigations, setInvestigations] = useState<LiveInvestigationRow[] | null>(null);
  useEffect(() => { void fetch("/api/v1/investigations/live").then((response) => response.ok ? response.json() : null).then((payload) => setInvestigations(payload?.investigations ?? [])).catch(() => setInvestigations([])); }, []);

  const filtered = useMemo(() => {
    if (!investigations) return [];
    return investigations.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const question = inv.brief?.investigationQuestions?.[0] ?? "";
        const cohortId = inv.brief?.cohortId ?? "";
        if (!question.toLowerCase().includes(q) && !cohortId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [investigations, statusFilter, search]);

  if (!investigations) {
    return <AppShell dataMode="live"><div className="card" style={{ padding: "48px", textAlign: "center" }}><h2>{isId ? "Memuat investigasi live..." : "Loading live investigations..."}</h2><p>{isId ? "Daftar ini hanya membaca investigation_run yang tersimpan di PostgreSQL." : "This list only reads investigation_run rows persisted in PostgreSQL."}</p></div></AppShell>;
  }

  return (
    <AppShell dataMode="live">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-snapshot">
                {isId ? "Orkestrasi Alat Terikat" : "Bounded Tool Orchestration"}
              </span>
              <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>
                {isId ? "Batas Anggaran Ketat" : "Strict Grounding Budget"}
              </span>
            </div>
            <h1>{isId ? "Investigasi Ekonomi AI" : "AI Economic Investigations"}</h1>
            <p className="page-subtitle">
              {isId
                ? "Investigasi AI berbasis bukti yang terikat pada dataset live yang tidak dapat diubah dan perhitungan sinyal yang dapat direproduksi."
                : "Bounded, evidence-grounded AI investigations pinned to immutable live datasets and reproducible signal calculations."}
            </p>
          </div>
          <Link href={"/radar" as Route} className="btn btn-primary">
            {isId ? "+ Investigasi Baru dari Radar" : "+ New Investigation from Radar"}
          </Link>
        </div>
      </div>
      <div className="flow-guide">
        <strong>{isId ? "Apa yang dilakukan AI?" : "What does the AI do?"}</strong>
        <span>{isId ? "AI membaca signal dan evidence live yang sudah tersedia untuk menyusun interpretasi. AI tidak menghitung ulang skor dan tidak boleh membuat angka atau sumber baru." : "The AI reads the available live signal and evidence to form interpretations. It does not recalculate scores and must not invent numbers or sources."}</span>
        <small>{isId ? "Periksa supporting evidence, counterevidence, dan data gaps sebelum memakai brief." : "Review supporting evidence, counterevidence, and data gaps before using a brief."}</small>
      </div>

      {/* Filter Bar */}
      <section className="filter-bar" aria-label={isId ? "Filter investigasi" : "Investigation filters"}>
        <div className="filter-group">
          <label htmlFor="status-filter" className="filter-label">{isId ? "Status:" : "Status:"}</label>
          <select
            id="status-filter"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{isId ? "Semua Status" : "All Statuses"}</option>
            <option value="completed">{isId ? "Selesai (Klaim Terverifikasi)" : "Completed (Claims Verified)"}</option>
            <option value="running">{isId ? "Berjalan" : "Running"}</option>
            <option value="partial">{isId ? "Sebagian" : "Partial"}</option>
            <option value="cancelled">{isId ? "Dibatalkan" : "Cancelled"}</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="search-inv" className="filter-label">{isId ? "Cari:" : "Search:"}</label>
          <input
            id="search-inv"
            type="search"
            placeholder={isId ? "Cari pertanyaan atau sektor..." : "Search questions or sectors..."}
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "260px" }}
          />
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => { setStatusFilter("all"); setSearch(""); }}
        >
          {isId ? "Atur Ulang" : "Reset"}
        </button>
      </section>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "32px", textAlign: "center" }}>
          <h3>{isId ? "Belum ada investigasi live" : "No live investigations yet"}</h3>
          <p style={{ color: "var(--slate-500)" }}>{isId ? "Buka sebuah run live dari radar dan jalankan investigasi untuk melihatnya di sini." : "Open a live run from the radar and start an investigation to see it here."}</p>
          <Link href={"/radar" as Route} className="btn btn-primary">{isId ? "Buka Radar" : "Open Radar"}</Link>
        </div>
      ) : (
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{isId ? "Kohort Sektor" : "Sector Cohort"}</th>
                <th scope="col">{isId ? "Pertanyaan Analis" : "Analyst Inquiry"}</th>
                <th scope="col">{isId ? "Status" : "Status"}</th>
                <th scope="col">{isId ? "Mode Data" : "Data Mode"}</th>
                <th scope="col">{isId ? "Dibuat" : "Created"}</th>
                <th scope="col">{isId ? "Tindakan" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const statusBadge =
                  inv.status === "completed"
                    ? "badge-opportunity"
                    : inv.status === "running"
                    ? "badge-risk"
                    : "badge-neutral";
                const statusText =
                  inv.status === "completed"
                    ? (isId ? "SELESAI" : "COMPLETED")
                    : inv.status === "running"
                    ? (isId ? "BERJALAN" : "RUNNING")
                    : (isId ? "SEBAGIAN" : "PARTIAL");

                return (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{inv.brief?.cohortId ?? "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", fontFamily: "var(--font-mono)" }}>
                        {inv.brief?.period ?? "—"}
                      </div>
                    </td>
                    <td style={{ maxWidth: "340px", fontSize: "0.875rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--slate-900)" }}>{inv.brief?.investigationQuestions?.[0] ?? "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
                        ID: <code style={{ fontSize: "0.6875rem" }}>{inv.id}</code>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge}`}>
                        {statusText}
                      </span>
                    </td>
                    <td>
                      <DataModeBadge mode="live" size="sm" />
                    </td>
                    <td className="tabular-nums" style={{ fontSize: "0.8125rem" }}>
                      {new Date(inv.created_at).toLocaleString(isId ? "id-ID" : "en-US")}
                    </td>
                    <td>
                      <Link href={`/investigations/${inv.id}` as Route} className="btn btn-secondary btn-sm">
                        {isId ? "Buka Ruang Kerja →" : "Open Workspace →"}
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
