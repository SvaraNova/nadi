import type { FC } from "react";

export type NadiMode = "live" | "snapshot" | "synthetic";

interface Props {
  mode: NadiMode | string;
  size?: "sm" | "md";
}

export const DataModeBadge: FC<Props> = ({ mode, size = "md" }) => {
  const normalized = mode.toLowerCase();
  let className = "badge badge-synthetic";
  let label = "SYNTHETIC DEMO";
  let description = "Generated deterministic benchmark data for testing";

  if (normalized === "live") {
    className = "badge badge-live";
    label = "LIVE DATA";
    description = "Directly connected to IDX & BPS feed";
  } else if (normalized === "snapshot") {
    className = "badge badge-snapshot";
    label = "IMMUTABLE SNAPSHOT";
    description = "Pinned read-only quarterly release";
  }

  return (
    <span
      className={`${className} ${size === "sm" ? "btn-sm" : ""}`}
      role="status"
      aria-label={`Data mode: ${label}`}
      title={description}
    >
      <span className="badge-pip" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
