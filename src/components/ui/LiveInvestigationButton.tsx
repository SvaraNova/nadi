"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LiveInvestigationButton({ signalRunId }: { signalRunId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function start() {
    setRunning(true); setError(null);
    try {
      const response = await fetch("/api/v1/investigations/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signalRunId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Live investigation failed");
      router.push(`/investigations/${data.investigationId}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Live investigation failed"); setRunning(false); }
  }
  return <div style={{ display: "grid", gap: "6px" }}><button type="button" className="btn btn-primary" onClick={start} disabled={running}>{running ? "Running live investigation…" : "Start live investigation"}</button>{error && <small style={{ color: "var(--risk-700)" }}>{error}</small>}</div>;
}
