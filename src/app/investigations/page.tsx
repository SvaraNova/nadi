"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { DataModeBadge } from "../../components/ui/DataModeBadge";
import { listInvestigations } from "../../server/investigation/investigation-service";
import { useLanguage } from "../../lib/i18n";
import type { Route } from "next";

export default function InvestigationsPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const investigations = useMemo(() => listInvestigations(), []);

  const filtered = useMemo(() => {
    return investigations.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchQ = inv.question.toLowerCase().includes(q);
        const matchC = inv.cohortId.toLowerCase().includes(q);
        if (!matchQ && !matchC) return false;
      }
      return true;
    });
  }, [investigations, statusFilter, search]);

  return (
    <AppShell dataMode="synthetic">
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
                ? "Investigasi AI berbasis bukti yang terikat pada dataset yang tidak dapat diubah dan perhitungan sinyal yang dapat direproduksi."
                : "Bounded, evidence-grounded AI investigations pinned to immutable datasets and reproducible signal calculations."}
            </p>
          </div>
          <Link href={"/radar" as Route} className="btn btn-primary">
            {isId ? "+ Investigasi Baru dari Radar" : "+ New Investigation from Radar"}
          </Link>
        </div>
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

      {/* Table of Investigations */}
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{isId ? "Kohort Sektor" : "Sector Cohort"}</th>
                <th scope="col">{isId ? "Pertanyaan Analis" : "Analyst Inquiry"}</th>
                <th scope="col">{isId ? "Status" : "Status"}</th>
                <th scope="col">{isId ? "Model / Penyedia" : "Model / Provider"}</th>
                <th scope="col">{isId ? "Mode Data" : "Data Mode"}</th>
                <th scope="col">{isId ? "Riwayat Aktivitas Alat" : "Logged Events"}</th>
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
                      <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{inv.cohortId}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", fontFamily: "var(--font-mono)" }}>
                        {inv.period}
                      </div>
                    </td>
                    <td style={{ maxWidth: "340px", fontSize: "0.875rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--slate-900)" }}>{inv.question}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
                        ID: <code style={{ fontSize: "0.6875rem" }}>{inv.id}</code>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge}`}>
                        {statusText}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>
                      {inv.model}
                    </td>
                    <td>
                      <DataModeBadge mode={inv.dataMode} size="sm" />
                    </td>
                    <td className="tabular-nums" style={{ fontSize: "0.8125rem" }}>
                      {isId ? `${inv.events.length} panggilan alat` : `${inv.events.length} tool calls`}
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
    </AppShell>
  );
}
