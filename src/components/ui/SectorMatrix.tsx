import Link from "next/link";
import { useState } from "react";
import type { Route } from "next";
import { SignalDirectionBadge } from "../ui/SignalDirectionBadge";
import { IconArrowRight, IconInfoCircle } from "../ui/Icons";
import { formatScore } from "../../lib/formatters";
import type { SectorSignalSummary } from "../../domain/sectors-dataset";

interface Props {
  sectors: SectorSignalSummary[];
  language: "en" | "id";
  getSectorDisplayName: (s: SectorSignalSummary) => string;
}

export function SectorMatrix({ sectors, language, getSectorDisplayName }: Props) {
  const isId = language === "id";
  const [selectedId, setSelectedId] = useState<string>(sectors[0]?.id ?? "");

  const activeSector = sectors.find((s) => s.id === selectedId) ?? sectors[0];

  return (
    <div className="sector-matrix-wrapper">
      {/* Kolom Kiri: Peta Sektor yang Jelas Berbentuk Kartu Kuadran */}
      <div className="matrix-board">
        <div className="matrix-board-header">
          <div className="matrix-legend-row">
            <span className="legend-chip legend-pressure">
              <span className="legend-dot" /> {isId ? "Tekanan / Risiko Kuat" : "High Pressure / Risk"}
            </span>
            <span className="legend-chip legend-opportunity">
              <span className="legend-dot" /> {isId ? "Peluang Kuat" : "High Opportunity"}
            </span>
            <span className="legend-chip legend-mixed">
              <span className="legend-dot" /> {isId ? "Sinyal Campuran" : "Mixed Signals"}
            </span>
            <span className="legend-chip legend-neutral">
              <span className="legend-dot" /> {isId ? "Stabil / Data Menunggu" : "Stable / Pending Data"}
            </span>
          </div>
          <p className="matrix-board-hint">
            {isId
              ? "Klik salah satu kartu sektor di bawah untuk melihat rincian kondisi keuangannya:"
              : "Click any sector below to inspect its financial condition:"}
          </p>
        </div>

        {/* Daftar Kartu Sektor Interaktif yang Menggantikan Bubble Abstrak */}
        <div className="matrix-sectors-grid">
          {sectors.map((s) => {
            const isSelected = (activeSector?.id === s.id) || (selectedId === s.id);
            const riskVal = Number(s.cohortSignal.riskScore ?? 0);
            const oppVal = Number(s.cohortSignal.opportunityScore ?? 0);
            const label = s.cohortSignal.label;

            let statusText = isId ? "Stabil / Netral" : "Stable / Neutral";
            let statusColorClass = "status-neutral";
            if (label === "risk") {
              statusText = isId ? "Tekanan Tinggi" : "High Pressure";
              statusColorClass = "status-risk";
            } else if (label === "opportunity") {
              statusText = isId ? "Peluang Tinggi" : "High Opportunity";
              statusColorClass = "status-opp";
            } else if (label === "mixed") {
              statusText = isId ? "Sinyal Campuran" : "Mixed";
              statusColorClass = "status-mixed";
            } else if (label === "insufficient_data") {
              statusText = isId ? "Menunggu Rilis Laporan" : "Awaiting Reports";
              statusColorClass = "status-pending";
            }

            return (
              <button
                key={s.id}
                type="button"
                className={`sector-card-btn ${isSelected ? "selected" : ""} ${statusColorClass}`}
                onClick={() => setSelectedId(s.id)}
                aria-pressed={isSelected}
              >
                <div className="sector-card-top">
                  <span className="sector-card-name">{getSectorDisplayName(s)}</span>
                </div>
                <div className="sector-card-badge-row">
                  <SignalDirectionBadge direction={s.cohortSignal.label} size="sm" />
                </div>

                <div className="sector-card-bars">
                  <div className="score-mini-bar">
                    <span className="bar-label">{isId ? "Risiko" : "Risk"}</span>
                    <div className="bar-track">
                      <div className="bar-fill bar-risk" style={{ width: `${Math.min(100, riskVal)}%` }} />
                    </div>
                    <span className="bar-val tabular-nums">
                      {formatScore(s.cohortSignal.riskScore, language).formatted}
                    </span>
                  </div>

                  <div className="score-mini-bar">
                    <span className="bar-label">{isId ? "Peluang" : "Opp"}</span>
                    <div className="bar-track">
                      <div className="bar-fill bar-opp" style={{ width: `${Math.min(100, oppVal)}%` }} />
                    </div>
                    <span className="bar-val tabular-nums">
                      {formatScore(s.cohortSignal.opportunityScore, language).formatted}
                    </span>
                  </div>
                </div>

                <div className="sector-card-footer">
                  <span className="sector-status-pill">{statusText}</span>
                  <span className="sector-sample-count">
                    {s.cohortSignal.eligibleCount}/{s.cohortSignal.totalMembers} {isId ? "emiten" : "firms"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kolom Kanan: Penjelasan Bahasa Manusia Terbaca Seketika */}
      <aside className="matrix-detail-pane">
        <div className="pane-header">
          <div className="pane-eyebrow">{isId ? "PENJELASAN SEKTOR TERPILIH" : "SELECTED SECTOR ANALYSIS"}</div>
          <h3 className="pane-title">{activeSector ? getSectorDisplayName(activeSector) : "—"}</h3>
          <div className="pane-industry">{activeSector?.industry}</div>
        </div>

        {activeSector ? (
          <div className="pane-content">
            {/* Visualisasi Skala Risiko vs Peluang Sektor Terpilih */}
            <div className="score-gauge-box">
              <div className="gauge-item gauge-risk">
                <span className="gauge-title">{isId ? "Tingkat Tekanan / Risiko" : "Risk Level"}</span>
                <span className="gauge-number tabular-nums">
                  {formatScore(activeSector.cohortSignal.riskScore, language).formatted}
                </span>
                <span className="gauge-desc">
                  {Number(activeSector.cohortSignal.riskScore ?? 0) >= 50
                    ? isId ? "Tekanan keuangan luas" : "Significant pressure"
                    : Number(activeSector.cohortSignal.riskScore ?? 0) > 0
                    ? isId ? "Tekanan ringan / terbatas" : "Moderate pressure"
                    : isId ? "Tidak ada tekanan signifikan" : "No significant pressure"}
                </span>
              </div>

              <div className="gauge-item gauge-opp">
                <span className="gauge-title">{isId ? "Tingkat Peluang" : "Opportunity Level"}</span>
                <span className="gauge-number tabular-nums">
                  {formatScore(activeSector.cohortSignal.opportunityScore, language).formatted}
                </span>
                <span className="gauge-desc">
                  {Number(activeSector.cohortSignal.opportunityScore ?? 0) >= 50
                    ? isId ? "Peluang ekspansi tinggi" : "Strong growth opportunity"
                    : Number(activeSector.cohortSignal.opportunityScore ?? 0) > 0
                    ? isId ? "Peluang bertumbuh moderat" : "Moderate growth"
                    : isId ? "Tidak ada peluang menonjol" : "No notable opportunity"}
                </span>
              </div>
            </div>

            {/* Fakta dan Pendorong Utama dalam Bahasa Biasa */}
            <div className="pane-fact-box">
              <strong>{isId ? "Apa yang sedang terjadi di sektor ini?" : "What is happening in this sector?"}</strong>
              <p>{activeSector.dominantDriver}</p>
            </div>

            <div className="pane-meta-list">
              <div>
                <span>{isId ? "Sampel Emiten Terpantau:" : "Sample Tracked:"}</span>
                <strong>
                  {activeSector.cohortSignal.eligibleCount} dari {activeSector.cohortSignal.totalMembers} perusahaan
                </strong>
              </div>
              <div>
                <span>{isId ? "Status Kelayakan Data:" : "Data Coverage:"}</span>
                <strong>{Math.round(Number(activeSector.cohortSignal.coverage || 0) * 100)}% lengkap</strong>
              </div>
            </div>

            <Link
              href={`/radar/stored/${activeSector.runId}` as Route}
              className="btn btn-primary btn-sm pane-action-btn"
            >
              {isId ? "Buka Data Bukti Perusahaan →" : "Inspect Company Evidence →"}
            </Link>
          </div>
        ) : (
          <div className="pane-empty">
            <IconInfoCircle size={24} />
            <p>{isId ? "Pilih salah satu sektor di samping" : "Select a sector card on the left"}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
