"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { DataModeBadge, type NadiMode } from "../ui/DataModeBadge";
import { MacroTickerBar } from "../ui/MacroTickerBar";
import { CommandPalette } from "../ui/CommandPalette";
import {
  IconOverview,
  IconRadar,
  IconInvestigation,
  IconBrief,
  IconDataMethod,
  IconSearch,
} from "../ui/Icons";
import type { Route } from "next";

interface Props {
  children: ReactNode;
  dataMode?: NadiMode;
  datasetTimestamp?: string;
  activePeriod?: string;
}

export function AppShell({
  children,
  dataMode = "synthetic",
  datasetTimestamp = "2026-09-15 08:00 WIB",
  activePeriod = "Q1-2026 vs Q1-2025",
}: Props) {
  const pathname = usePathname();
  const [activeRole, setActiveRole] = useState<"analyst" | "operator" | "admin">("analyst");
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Navigation structure with professional SVG icons
  const navSections = [
    {
      sectionTitle: "Discovery & Signals",
      items: [
        { href: "/" as Route, label: "Overview Pulse", icon: <IconOverview size={17} /> },
        { href: "/radar" as Route, label: "Sector Radar", icon: <IconRadar size={17} />, badge: "5 Cohorts" },
      ],
    },
    {
      sectionTitle: "Deep Analysis",
      items: [
        { href: "/investigations" as Route, label: "Investigations", icon: <IconInvestigation size={17} /> },
        { href: "/briefs" as Route, label: "Decision Briefs", icon: <IconBrief size={17} />, badge: "v1.0" },
      ],
    },
    {
      sectionTitle: "Governance & Audit",
      items: [
        { href: "/data" as Route, label: "Data & Method", icon: <IconDataMethod size={17} /> },
      ],
    },
  ];

  // Dynamic breadcrumb generation
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "NADI", href: "/" as Route },
    ...pathSegments.map((segment, index) => {
      const url = `/${pathSegments.slice(0, index + 1).join("/")}` as Route;
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === "radar") label = "Sector Radar";
      else if (segment === "investigations") label = "Investigations";
      else if (segment === "briefs") label = "Decision Briefs";
      else if (segment === "data") label = "Data & Method";
      else if (segment.startsWith("run-") || segment.startsWith("inv-") || segment.startsWith("brief-")) {
        label = segment.length > 18 ? `${segment.slice(0, 15)}…` : segment;
      } else if (segment === "energy-coal") label = "Energy — Coal";
      return { label, href: url };
    }),
  ];

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Linear-Style Unified Left Sidebar */}
      <aside className="sidebar" aria-label="Main Navigation">
        <div className="sidebar-header">
          <Link href="/" className="sidebar-brand">
            <div className="sidebar-brand-emblem">N</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>NADI</span>
                <span className="sidebar-logo-pulse" title="System Operational" />
              </div>
              <span className="sidebar-subtitle">National Discovery Intelligence</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div className="sidebar-section-title">{sec.sectionTitle}</div>
              {sec.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="nav-link-icon" aria-hidden="true">{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: "0.625rem",
                          padding: "1px 6px",
                          borderRadius: "var(--radius-xs)",
                          background: isActive ? "var(--primary-100)" : "var(--slate-100)",
                          color: isActive ? "var(--primary-800)" : "var(--slate-600)",
                          fontWeight: 700,
                          border: "1px solid var(--border-light)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Role Switcher & System Spec */}
        <div className="sidebar-footer">
          <div className="role-switcher-container">
            <span style={{ fontSize: "0.625rem", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 700 }}>
              Session:
            </span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as "analyst" | "operator" | "admin")}
              className="role-badge-select"
              aria-label="Switch active session role"
            >
              <option value="analyst">Analyst (Policy)</option>
              <option value="operator">Operator (Data Ops)</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          <div style={{ color: "var(--slate-500)", fontSize: "0.625rem", lineHeight: 1.4 }}>
            <div>Engine: <strong style={{ color: "var(--slate-700)" }}>Method v0.1</strong> (100% Deterministic)</div>
            <div style={{ marginTop: "1px" }}>IDX Listed Coverage · BPS Macro Context</div>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="main-viewport">
        {/* Top Live Macro Ticker Bar */}
        <MacroTickerBar />

        {/* Sticky Topbar */}
        <header className="topbar">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={crumb.href} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {idx > 0 && <span style={{ color: "var(--slate-300)" }}>/</span>}
                  {isLast ? (
                    <span style={{ fontWeight: 600, color: "var(--slate-900)" }}>{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href}>{crumb.label}</Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Actions: Search Trigger & Mode */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              className="topbar-search-trigger"
              onClick={() => setIsCommandOpen(true)}
              aria-label="Open Command Palette (Press ⌘K)"
            >
              <IconSearch size={14} />
              <span style={{ flex: 1, textAlign: "left" }}>Quick search sectors, tickers...</span>
              <span className="kbd-shortcut">⌘K</span>
            </button>

            <DataModeBadge mode={dataMode} size="sm" />

            <span style={{ fontSize: "0.75rem", color: "var(--slate-500)" }} title="Active comparison period">
              <strong className="tabular-nums">{activePeriod}</strong>
            </span>

            <Link href={"/data" as Route} className="btn btn-secondary btn-sm" title="View Method v0.1 Specification">
              Method Spec
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="main-content">
          {children}
        </main>
      </div>

      {/* Global Raycast-Style Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onRoleChange={(r) => setActiveRole(r)}
      />
    </div>
  );
}
