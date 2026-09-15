import type { FC } from "react";

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
  const norm = (direction || "neutral").toLowerCase().replace(/-/g, "_");
  let className = "badge badge-neutral";
  let label = "NEUTRAL";

  if (norm === "risk" || norm === "pressure") {
    className = "badge badge-risk";
    label = "PRESSURE";
  } else if (norm === "opportunity") {
    className = "badge badge-opportunity";
    label = "OPPORTUNITY";
  } else if (norm === "mixed") {
    className = "badge badge-mixed";
    label = "MIXED";
  } else if (norm === "insufficient" || norm === "insufficient_data") {
    className = "badge badge-insufficient";
    label = "INSUFFICIENT DATA";
  } else if (norm === "no_broad_signal") {
    className = "badge badge-neutral";
    label = "NO BROAD SIGNAL";
  }

  return (
    <span className={`${className} ${size === "sm" ? "btn-sm" : ""}`} role="status">
      <span className="badge-pip" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
