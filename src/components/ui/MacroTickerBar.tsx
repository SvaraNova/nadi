"use client";

import type { FC } from "react";
import Link from "next/link";
import type { Route } from "next";

export const MacroTickerBar: FC = () => {
  return (
    <div className="macro-ticker-wrapper" aria-label="Live Macroeconomic Intelligence Ticker">
      <div className="macro-ticker-badge">
        <span className="sidebar-logo-pulse" aria-hidden="true" />
        <span>NADI PULSE</span>
      </div>
      <div className="macro-ticker-content">
        <div className="ticker-item">
          <span className="ticker-label">BPS Mining GDP:</span>
          <span className="ticker-val-neg">-8.20% QoQ</span>
          <span className="ticker-sub">[Review: Not Comparable]</span>
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">Dominant Pressure:</span>
          <Link href={"/radar/run-energy-coal-2026-03-31/energy-coal" as Route} className="ticker-link">
            Coal Mining &amp; Quarrying (Risk 75.0)
          </Link>
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">Dominant Opportunity:</span>
          <Link href={"/radar/run-consumer-staples-2026-03-31/consumer-staples" as Route} className="ticker-link">
            Consumer Staples — F&amp;B (Opp 80.0)
          </Link>
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">Universe Scope:</span>
          <span className="ticker-val">31 Listed Companies · 5 Cohorts</span>
        </div>
        <div className="ticker-sep">/</div>
        <div className="ticker-item">
          <span className="ticker-label">Methodology:</span>
          <span className="ticker-val-mono">Method v0.1 · 100% Deterministic</span>
        </div>
      </div>
    </div>
  );
};
