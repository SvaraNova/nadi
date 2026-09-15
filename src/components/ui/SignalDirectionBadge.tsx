"use client";

import type { FC } from "react";
import { useLanguage } from "../../lib/i18n";

export type SignalDirection =
  | "risk"
  | "pressure"
  | "opportunity"
  | "mixed"
  | "neutral"
  | "no_broad_signal"
  | "insufficient"
  | "insufficient_data";

interface Props {
  direction: SignalDirection | string;
  size?: "sm" | "md";
}

export const SignalDirectionBadge: FC<Props> = ({ direction, size = "md" }) => {
  const { language } = useLanguage();
  const norm = (direction || "neutral").toLowerCase().replace(/-/g, "_");
  
  let className = "badge badge-neutral";
  let label = language === "id" ? "NETRAL" : "NEUTRAL";
  let tooltip = language === "id" ? "Kondisi stabil tanpa perubahan ekstrem" : "Stable condition without extreme shifts";

  if (norm === "risk" || norm === "pressure") {
    className = "badge badge-risk";
    label = language === "id" ? "TEKANAN RISIKO" : "PRESSURE";
    tooltip = language === "id"
      ? "Tekanan fundamental terdeteksi pada minimal 60% emiten (sebaran risiko ≥ 0,60)."
      : "Fundamental financial pressure detected in at least 60% of cohort companies.";
  } else if (norm === "opportunity") {
    className = "badge badge-opportunity";
    label = language === "id" ? "PELUANG" : "OPPORTUNITY";
    tooltip = language === "id"
      ? "Penguatan fundamental terdeteksi pada minimal 60% emiten (sebaran peluang ≥ 0,60)."
      : "Strengthening fundamentals detected in at least 60% of cohort companies.";
  } else if (norm === "mixed") {
    className = "badge badge-mixed";
    label = language === "id" ? "SINYAL CAMPURAN" : "MIXED SIGNALS";
    tooltip = language === "id"
      ? "Sebaran risiko dan peluang sama-sama melampaui 60% (fundamental bertentangan)."
      : "Both risk and opportunity breadths exceed 60% simultaneously.";
  } else if (norm === "insufficient" || norm === "insufficient_data") {
    className = "badge badge-insufficient";
    label = language === "id" ? "DATA TIDAK MEMADAI" : "INSUFFICIENT DATA";
    tooltip = language === "id"
      ? "Kurang dari 5 emiten atau cakupan < 60%. Skor sengaja tidak dihitung demi integritas bukti."
      : "Fewer than 5 companies or coverage < 60%. Scores nullified by rule for data integrity.";
  } else if (norm === "no_broad_signal") {
    className = "badge badge-neutral";
    label = language === "id" ? "TIDAK ADA SINYAL MELUAS" : "NO BROAD SIGNAL";
    tooltip = language === "id"
      ? "Data lengkap, tetapi tidak ada pola tekanan atau peluang yang mencapai ambang batas 60%."
      : "Sufficient data, but neither risk nor opportunity breadth reached the 60% threshold.";
  }

  return (
    <span
      className={`${className} ${size === "sm" ? "btn-sm" : ""}`}
      role="status"
      title={tooltip}
      style={{ cursor: "help" }}
      aria-label={label}
    >
      <span className="badge-pip" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
