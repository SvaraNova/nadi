// Explicit fictional records, reproducible across process restarts.
export function syntheticSources(scenario: string) {
  if (!["baseline", "revision", "missing"].includes(scenario)) throw new Error("INVALID_SCENARIO");
  return Array.from({ length: 6 }, (_, i) => {
    const symbol = `SYNTHETIC-${i + 1}`;
    const prior = { symbol, date: "2025-03-31", revenue: "100", operating_pnl: "10", operating_cash_flow: "10", total_debt: "20", total_assets: "100" };
    const current = { ...prior, date: "2026-03-31", revenue: scenario === "revision" && i === 0 ? "81" : "80",
      operating_pnl: "4", operating_cash_flow: "2", total_debt: scenario === "missing" && i === 0 ? null : "30" };
    return { symbol, raw: JSON.stringify([prior, current]) };
  });
}
