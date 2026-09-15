"use client";

import type { FC } from "react";
import { useLanguage } from "../../lib/i18n";

export type NadiMode = "live" | "snapshot" | "synthetic";

interface Props {
  mode: NadiMode | string;
  size?: "sm" | "md";
}

export const DataModeBadge: FC<Props> = ({ mode, size = "md" }) => {
  const { language } = useLanguage();
  const normalized = mode.toLowerCase();
  
  let className = "badge badge-synthetic";
  let label = language === "id" ? "DEMO SINTETIS" : "SYNTHETIC DEMO";
  let description = language === "id"
    ? "Data simulasi untuk pengujian sistem dan demonstrasi. Bukan temuan ekonomi riil."
    : "Simulated benchmark data for testing. Not a real economic finding.";

  if (normalized === "live") {
    className = "badge badge-live";
    label = language === "id" ? "DATA LANGSUNG" : "LIVE DATA";
    description = language === "id"
      ? "Terhubung langsung ke feed Sectors API v2 & BPS."
      : "Directly connected to Sectors API v2 & BPS feed.";
  } else if (normalized === "snapshot") {
    className = "badge badge-snapshot";
    label = language === "id" ? "ARSIP DATA" : "IMMUTABLE SNAPSHOT";
    description = language === "id"
      ? "Data historis emiten IDX yang dibekukan pada saat penarikan."
      : "Pinned read-only quarterly release.";
  }

  return (
    <span
      className={`${className} ${size === "sm" ? "btn-sm" : ""}`}
      role="status"
      aria-label={`Data mode: ${label}`}
      title={description}
      style={{ cursor: "help" }}
    >
      <span className="badge-pip" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
