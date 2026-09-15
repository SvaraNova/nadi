"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { DataModeBadge } from "../../components/ui/DataModeBadge";
import { listBriefs } from "../../server/briefs/brief-service";
import { IconDownload, IconArrowRight } from "../../components/ui/Icons";
import type { Route } from "next";

export default function BriefsPage() {
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
              <span className="badge badge-snapshot">Executive Deliverables</span>
              <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>Offline Markdown Support</span>
            </div>
            <h1>Cabinet &amp; Policy Decision Briefs</h1>
            <p className="page-subtitle">
              Editable, versioned, and cited deliverables synthesizing corporate observations into actionable policy insights.
            </p>
          </div>
          <Link href={"/investigations" as Route} className="btn btn-primary">
            + New Brief from Investigation
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <section className="filter-bar" aria-label="Brief filters">
        <div className="filter-group">
          <label htmlFor="brief-status" className="filter-label">Status:</label>
          <select
            id="brief-status"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="final">Final Version (Locked)</option>
            <option value="reviewed">Reviewed (Internal)</option>
            <option value="draft">Draft Working Paper</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="brief-search" className="filter-label">Search:</label>
          <input
            id="brief-search"
            type="search"
            placeholder="Search brief title or cohort..."
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
          Reset
        </button>
      </section>

      {/* Briefs Table */}
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Title &amp; Sector Cohort</th>
                <th scope="col">Period</th>
                <th scope="col">Snapshot Version</th>
                <th scope="col">Status</th>
                <th scope="col">Mode</th>
                <th scope="col">Last Modified</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--slate-950)" }}>{b.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "2px" }}>
                      Cohort: <strong>{b.cohortId}</strong> · Source Investigation: <code>{b.investigationId}</code>
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
                    <span className={`badge ${b.status === "final" ? "badge-opportunity" : b.status === "reviewed" ? "badge-live" : "badge-neutral"}`}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <DataModeBadge mode={b.dataMode} size="sm" />
                  </td>
                  <td className="tabular-nums" style={{ fontSize: "0.8125rem" }}>
                    {new Date(b.updatedAt).toLocaleDateString()} {new Date(b.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Link href={`/briefs/${b.id}` as Route} className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        Review <IconArrowRight size={12} />
                      </Link>
                      <a
                        href={`/api/briefs/${b.id}/export`}
                        download={`${b.id}.md`}
                        className="btn btn-secondary btn-sm"
                        title="Download Markdown brief"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <IconDownload size={12} /> .md
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
