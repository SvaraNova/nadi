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
import { useLanguage } from "../../lib/i18n";

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
  const { language, setLanguage, t } = useLanguage();
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

  // Navigation structure with professional SVG icons and bilingual labels
  const navSections = [
    {
      sectionTitle: t("nav.discovery"),
      items: [
        { href: "/" as Route, label: t("nav.overview"), icon: <IconOverview size={17} /> },
        { href: "/radar" as Route, label: t("nav.radar"), icon: <IconRadar size={17} />, badge: language === "id" ? "5 Sektor" : "5 Cohorts" },
      ],
    },
    {
      sectionTitle: t("nav.deepAnalysis"),
      items: [
        { href: "/investigations" as Route, label: t("nav.investigations"), icon: <IconInvestigation size={17} /> },
        { href: "/briefs" as Route, label: t("nav.briefs"), icon: <IconBrief size={17} />, badge: "v1.0" },
      ],
    },
    {
      sectionTitle: t("nav.governance"),
      items: [
        { href: "/data" as Route, label: t("nav.dataMethod"), icon: <IconDataMethod size={17} /> },
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
      if (segment === "radar") label = t("nav.radar");
      else if (segment === "investigations") label = t("nav.investigations");
      else if (segment === "briefs") label = t("nav.briefs");
      else if (segment === "data") label = t("nav.dataMethod");
      else if (segment.startsWith("run-") || segment.startsWith("inv-") || segment.startsWith("brief-")) {
        label = segment.length > 18 ? `${segment.slice(0, 15)}…` : segment;
      } else if (segment === "energy-coal") label = language === "id" ? "Energi — Batubara" : "Energy — Coal";
      return { label, href: url };
    }),
  ];

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">
        {t("nav.skipToContent")}
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
              <span className="sidebar-subtitle">{t("brand.fullName")}</span>
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
              {t("session.label")}
            </span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as "analyst" | "operator" | "admin")}
              className="role-badge-select"
              aria-label="Switch active session role"
              suppressHydrationWarning
            >
              <option value="analyst">{t("session.analyst")}</option>
              <option value="operator">{t("session.operator")}</option>
              <option value="admin">{t("session.admin")}</option>
            </select>
          </div>

          <div style={{ color: "var(--slate-500)", fontSize: "0.625rem", lineHeight: 1.4 }}>
            <div><strong style={{ color: "var(--slate-700)" }}>{t("engine.title")}</strong></div>
            <div style={{ marginTop: "1px" }}>{t("engine.subtitle")}</div>
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

          {/* Right Actions: Search Trigger, Language Switcher & Mode */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="topbar-search-trigger"
              onClick={() => setIsCommandOpen(true)}
              aria-label="Open Command Palette (Press ⌘K)"
            >
              <IconSearch size={14} />
              <span style={{ flex: 1, textAlign: "left" }}>{t("nav.quickSearch")}</span>
              <span className="kbd-shortcut">⌘K</span>
            </button>

            {/* Language Switcher */}
            <div
              className="lang-switcher"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "var(--slate-100)",
                padding: "2px",
                borderRadius: "6px",
                border: "1px solid var(--border-light)",
              }}
              role="group"
              aria-label={t("action.switchLanguage")}
            >
              <button
                type="button"
                onClick={() => setLanguage("id")}
                style={{
                  padding: "3px 7px",
                  fontSize: "0.6875rem",
                  fontWeight: language === "id" ? 700 : 500,
                  background: language === "id" ? "#ffffff" : "transparent",
                  color: language === "id" ? "var(--slate-900)" : "var(--slate-500)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  boxShadow: language === "id" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
                aria-pressed={language === "id"}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                style={{
                  padding: "3px 7px",
                  fontSize: "0.6875rem",
                  fontWeight: language === "en" ? 700 : 500,
                  background: language === "en" ? "#ffffff" : "transparent",
                  color: language === "en" ? "var(--slate-900)" : "var(--slate-500)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  boxShadow: language === "en" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
                aria-pressed={language === "en"}
              >
                EN
              </button>
            </div>

            <DataModeBadge mode={dataMode} size="sm" />

            <span style={{ fontSize: "0.75rem", color: "var(--slate-500)" }} title="Active comparison period">
              <strong className="tabular-nums">{activePeriod}</strong>
            </span>

            <Link href={"/data" as Route} className="btn btn-secondary btn-sm" title={t("action.viewMethod")}>
              {t("action.viewMethod")}
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
