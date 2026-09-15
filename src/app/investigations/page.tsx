"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { DataModeBadge } from "../../components/ui/DataModeBadge";
import { listInvestigations } from "../../server/investigation/investigation-service";
import type { Route } from "next";

export default function InvestigationsPage() {
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
              <span className="badge badge-snapshot">Bounded Tool Orchestration</span>
              <span style={{ fontSize: "0.8125rem", color: "var(--slate-500)" }}>Strict Grounding Budget</span>
            </div>
            <h1>AI Economic Investigations</h1>
            <p className="page-subtitle">
              Bounded, evidence-grounded AI investigations pinned to immutable datasets and reproducible signal calculations.
            </p>
          </div>
          <Link href={"/radar" as Route} className="btn btn-primary">
            + New Investigation from Radar
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <section className="filter-bar" aria-label="Investigation filters">
        <div className="filter-group">
          <label htmlFor="status-filter" className="filter-label">Status:</label>
          <select
            id="status-filter"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed (Claims Verified)</option>
            <option value="running">Running</option>
            <option value="partial">Partial</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="search-inv" className="filter-label">Search:</label>
          <input
            id="search-inv"
            type="search"
            placeholder="Search questions or sectors..."
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

      {/* Table of Investigations */}
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Sector Cohort</th>
                <th scope="col">Analyst Inquiry</th>
                <th scope="col">Status</th>
                <th scope="col">Model / Provider</th>
                <th scope="col">Data Mode</th>
                <th scope="col">Logged Events</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
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
                    <span className={`badge ${inv.status === "completed" ? "badge-opportunity" : inv.status === "running" ? "badge-risk" : "badge-neutral"}`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>
                    {inv.model}
                  </td>
                  <td>
                    <DataModeBadge mode={inv.dataMode} size="sm" />
                  </td>
                  <td className="tabular-nums" style={{ fontSize: "0.8125rem" }}>
                    {inv.events.length} tool calls
                  </td>
                  <td>
                    <Link href={`/investigations/${inv.id}` as Route} className="btn btn-secondary btn-sm">
                      Open Workspace →
                    </Link>
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
