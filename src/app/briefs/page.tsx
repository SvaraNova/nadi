"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { DataModeBadge } from "../../components/ui/DataModeBadge";
import { listBriefs } from "../../server/briefs/brief-service";
import { IconDownload, IconArrowRight } from "../../components/ui/Icons";
import { useLanguage } from "../../lib/i18n";
import type { Route } from "next";

export default function BriefsPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const briefs = useMemo(() => listBriefs(), []);

  const filtered = useMemo(() => {
    return briefs.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchT = b.title.toLowerCase().includes(q);
        const matchC = b.cohortId.toLowerCase().includes(q);
        if (!matchT && !matchC) return false;
      }
      return true;
    });
  }, [briefs, statusFilter, search]);

  return (
    <AppShell dataMode="synthetic">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-snapshot">
                {isId ? "Hasil Eksekutif" : "Executive Deliverables"}
              </span>
              <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>
                {isId ? "Dukungan Ekspor Markdown Offline" : "Offline Markdown Support"}
              </span>
            </div>
            <h1>{isId ? "Ringkasan Keputusan Kabinet & Kebijakan" : "Cabinet & Policy Decision Briefs"}</h1>
            <p className="page-subtitle">
              {isId
                ? "Ringkasan keputusan yang dapat diedit, memiliki riwayat versi, dan disitasi secara lengkap untuk mensintesis data emiten ke dalam wawasan kebijakan."
                : "Editable, versioned, and cited deliverables synthesizing corporate observations into actionable policy insights."}
            </p>
          </div>
          <Link href={"/investigations" as Route} className="btn btn-primary">
            {isId ? "+ Ringkasan Baru dari Investigasi" : "+ New Brief from Investigation"}
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <section className="filter-bar" aria-label={isId ? "Filter ringkasan keputusan" : "Brief filters"}>
        <div className="filter-group">
          <label htmlFor="brief-status" className="filter-label">{isId ? "Status:" : "Status:"}</label>
          <select
            id="brief-status"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{isId ? "Semua Status" : "All Statuses"}</option>
            <option value="final">{isId ? "Versi Final (Terkunci)" : "Final Version (Locked)"}</option>
            <option value="reviewed">{isId ? "Ditelaah (Internal)" : "Reviewed (Internal)"}</option>
            <option value="draft">{isId ? "Kertas Kerja Draf" : "Draft Working Paper"}</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="brief-search" className="filter-label">{isId ? "Cari:" : "Search:"}</label>
          <input
            id="brief-search"
            type="search"
            placeholder={isId ? "Cari judul ringkasan atau kohort..." : "Search brief title or cohort..."}
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

      {/* Briefs Table */}
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{isId ? "Judul & Kohort Sektor" : "Title & Sector Cohort"}</th>
                <th scope="col">{isId ? "Periode" : "Period"}</th>
                <th scope="col">{isId ? "Versi Snapshot" : "Snapshot Version"}</th>
                <th scope="col">{isId ? "Status" : "Status"}</th>
                <th scope="col">{isId ? "Mode" : "Mode"}</th>
                <th scope="col">{isId ? "Modifikasi Terakhir" : "Last Modified"}</th>
                <th scope="col">{isId ? "Tindakan" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const statusBadge =
                  b.status === "final"
                    ? "badge-opportunity"
                    : b.status === "reviewed"
                    ? "badge-live"
                    : "badge-neutral";
                const statusText =
                  b.status === "final"
                    ? (isId ? "FINAL" : "FINAL")
                    : b.status === "reviewed"
                    ? (isId ? "DITELAAH" : "REVIEWED")
                    : (isId ? "DRAF" : "DRAFT");

                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{b.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
                        {isId ? "Kohort: " : "Cohort: "}<strong>{b.cohortId}</strong> · {isId ? "Investigasi Sumber: " : "Source Investigation: "}<code>{b.investigationId}</code>
                      </div>
                    </td>
                    <td className="tabular-nums" style={{ fontSize: "0.875rem" }}>
                      {b.period}
                    </td>
                    <td>
                      <span className="badge badge-snapshot">
                        v{b.currentVersion}.0
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge}`}>
                        {statusText}
                      </span>
                    </td>
                    <td>
                      <DataModeBadge mode={b.dataMode} size="sm" />
                    </td>
                    <td className="tabular-nums" style={{ fontSize: "0.8125rem" }}>
                      {new Date(b.updatedAt).toLocaleDateString(isId ? "id-ID" : "en-US")} {new Date(b.updatedAt).toLocaleTimeString(isId ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Link href={`/briefs/${b.id}` as Route} className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {isId ? "Telaah" : "Review"} <IconArrowRight size={12} />
                        </Link>
                        <a
                          href={`/api/briefs/${b.id}/export?lang=${language}`}
                          download={`${b.id}.md`}
                          className="btn btn-secondary btn-sm"
                          title={isId ? "Unduh ringkasan Markdown" : "Download Markdown brief"}
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <IconDownload size={12} /> .md
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
