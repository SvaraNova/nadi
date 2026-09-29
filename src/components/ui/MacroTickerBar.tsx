"use client";

import { useEffect, useState, type FC } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useLanguage } from "../../lib/i18n";

interface LiveSector {
  id: string;
  name: string;
  runId: string;
  cohortSignal: { label: string; riskScore: string | null; opportunityScore: string | null; eligibleCount: number; totalMembers: number };
}

interface LiveIndicator {
  name: string;
  value: string | null;
  unit: string;
  relation: string;
  cohort_key: string;
}

export const MacroTickerBar: FC = () => {
  const { language } = useLanguage();
  const isId = language === "id";
  const [sectors, setSectors] = useState<LiveSector[]>([]);
  const [indicator, setIndicator] = useState<LiveIndicator | null>(null);

  useEffect(() => {
    void fetch("/api/signal-runs/live").then((r) => (r.ok ? r.json() : null)).then((p) => setSectors(p?.sectors ?? [])).catch(() => setSectors([]));
    void fetch("/api/v1/public-indicators/live").then((r) => (r.ok ? r.json() : null)).then((p) => setIndicator(p?.indicators?.find((i: LiveIndicator) => i.cohort_key === "energy-coal") ?? p?.indicators?.[0] ?? null)).catch(() => setIndicator(null));
  }, []);

  const strongestPressure = sectors
    .filter((s) => s.cohortSignal.label === "risk")
    .sort((a, b) => Number(b.cohortSignal.riskScore ?? 0) - Number(a.cohortSignal.riskScore ?? 0))[0];
  const strongestOpportunity = sectors
    .filter((s) => s.cohortSignal.label === "opportunity")
    .sort((a, b) => Number(b.cohortSignal.opportunityScore ?? 0) - Number(a.cohortSignal.opportunityScore ?? 0))[0];
  const totalUniverse = sectors.reduce((acc, s) => acc + s.cohortSignal.totalMembers, 0);

  const indicatorValue = indicator?.value != null ? Number(indicator.value) : null;
  const relationLabel = indicator?.relation === "not_comparable"
    ? (isId ? "Belum Dapat Diperbandingkan" : "Not Comparable")
    : indicator?.relation.replaceAll("_", " ");

  return (
    <div className="macro-ticker-wrapper" aria-label={isId ? "Pita Informasi Makroekonomi Terkini" : "Live Macroeconomic Intelligence Ticker"}>
      <div className="macro-ticker-badge">
        <span className="sidebar-logo-pulse" aria-hidden="true" />
        <span>NADI PULSE</span>
      </div>
      <div className="macro-ticker-content">
        {indicatorValue !== null ? (
          <>
            <div className="ticker-item">
              <span className="ticker-label">{isId ? "PDB Pertambangan BPS:" : "BPS Mining GDP:"}</span>
              <span className={indicatorValue < 0 ? "ticker-val-neg" : "ticker-val"}>
                {indicatorValue.toLocaleString(isId ? "id-ID" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% QoQ
              </span>
              <span className="ticker-sub">{isId ? `[Evaluasi: ${relationLabel}]` : `[Review: ${relationLabel}]`}</span>
            </div>
            <div className="ticker-sep">/</div>
          </>
        ) : null}
        <div className="ticker-item">
          <span className="ticker-label">{isId ? "Tekanan Utama:" : "Dominant Pressure:"}</span>
          {strongestPressure ? (
            <Link href={`/radar/stored/${strongestPressure.runId}` as Route} className="ticker-link">
              {strongestPressure.name} ({isId ? "Risiko" : "Risk"} {Number(strongestPressure.cohortSignal.riskScore).toFixed(1)})
            </Link>
          ) : (
            <span className="ticker-val">{isId ? "Tidak ada sinyal tekanan luas" : "No broad pressure signal"}</span>
          )}
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">{isId ? "Peluang Utama:" : "Dominant Opportunity:"}</span>
          {strongestOpportunity ? (
            <Link href={`/radar/stored/${strongestOpportunity.runId}` as Route} className="ticker-link">
              {strongestOpportunity.name} ({isId ? "Peluang" : "Opp"} {Number(strongestOpportunity.cohortSignal.opportunityScore).toFixed(1)})
            </Link>
          ) : (
            <span className="ticker-val">{isId ? "Tidak ada sinyal peluang luas" : "No broad opportunity signal"}</span>
          )}
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">{isId ? "Cakupan Pemantauan:" : "Universe Scope:"}</span>
          <span className="ticker-val">{isId ? `${totalUniverse} Emiten Terbuka · ${sectors.length} Sektor` : `${totalUniverse} Listed Companies · ${sectors.length} Cohorts`}</span>
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">{isId ? "Metodologi:" : "Methodology:"}</span>
          <span className="ticker-val-mono">{isId ? "Metode v0.1 · 100% Deterministik" : "Method v0.1 · 100% Deterministic"}</span>
        </div>
      </div>
    </div>
  );
};
