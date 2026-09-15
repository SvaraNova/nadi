"use client";

import type { FC } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useLanguage } from "../../lib/i18n";

export const MacroTickerBar: FC = () => {
  const { language } = useLanguage();
  const isId = language === "id";

  return (
    <div className="macro-ticker-wrapper" aria-label={isId ? "Pita Informasi Makroekonomi Terkini" : "Live Macroeconomic Intelligence Ticker"}>
      <div className="macro-ticker-badge">
        <span className="sidebar-logo-pulse" aria-hidden="true" />
        <span>NADI PULSE</span>
      </div>
      <div className="macro-ticker-content">
        <div className="ticker-item">
          <span className="ticker-label">{isId ? "PDB Pertambangan BPS:" : "BPS Mining GDP:"}</span>
          <span className="ticker-val-neg">−8,20% QoQ</span>
          <span className="ticker-sub">{isId ? "[Evaluasi: Belum Dapat Diperbandingkan]" : "[Review: Not Comparable]"}</span>
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">{isId ? "Tekanan Utama:" : "Dominant Pressure:"}</span>
          <Link href={"/radar/run-energy-coal-2026-03-31/energy-coal" as Route} className="ticker-link">
            {isId ? "Pertambangan Batubara (Risiko 75,0)" : "Coal Mining & Quarrying (Risk 75.0)"}
          </Link>
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">{isId ? "Peluang Utama:" : "Dominant Opportunity:"}</span>
          <Link href={"/radar/run-consumer-staples-2026-03-31/consumer-staples" as Route} className="ticker-link">
            {isId ? "Barang Konsumsi Pokok — Makanan & Minuman (Peluang 80,0)" : "Consumer Staples — F&B (Opp 80.0)"}
          </Link>
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">{isId ? "Cakupan Pemantauan:" : "Universe Scope:"}</span>
          <span className="ticker-val">{isId ? "31 Emiten Terbuka · 5 Sektor" : "31 Listed Companies · 5 Cohorts"}</span>
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
