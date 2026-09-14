import Link from "next/link";
import { calculateCompanySignal, METHOD_VERSION, type CompanyPeriod } from "../../domain/signals";

// Local presentation examples only; these are not persisted datasets or API contracts.
const prior: CompanyPeriod = { revenue: "100", operatingPnl: "10", operatingCashFlow: "10", totalDebt: "20", totalAssets: "100", basis: "standalone_quarter" };
const examples = {
  risk: { ...prior, revenue: "80", operatingPnl: "4", operatingCashFlow: "2", totalDebt: "30" },
  opportunity: { ...prior, revenue: "110", operatingPnl: "13.2", operatingCashFlow: "14.3", totalDebt: "10" },
  missing: { ...prior, totalDebt: null },
} satisfies Record<string, CompanyPeriod>;
const metrics = [
  ["revenue", "Revenue"], ["operatingPnl", "Operating profit"],
  ["operatingCashFlow", "Operating cash flow"], ["totalDebt", "Total debt"], ["totalAssets", "Total assets"],
] as const;

export default async function EvidencePage({ searchParams }: { searchParams: Promise<{ example?: string }> }) {
  const { example } = await searchParams;
  const selected = example === "opportunity" || example === "missing" ? example : "risk";
  const current = examples[selected];
  const signal = calculateCompanySignal(current, prior);
  return <main className="evidence">
    <Link href="/">NADI home</Link>
    <p className="eyebrow">EVIDENCE · SYNTHETIC EXAMPLE</p>
    <h1>Follow the calculation</h1>
    <p>Fictional company SYNTHETIC-ONLY-001. All amounts are illustrative IDR units. No live provider data or persisted signal run is loaded.</p>
    <nav aria-label="Synthetic scenarios" className="scenarios">
      {(["risk", "opportunity", "missing"] as const).map(key => <Link key={key} href={`/evidence?example=${key}`} aria-current={selected === key ? "page" : undefined}>{key === "missing" ? "Missing data" : key === "risk" ? "Risk example" : "Opportunity example"}</Link>)}
    </nav>
    <section aria-labelledby="result-title">
      <h2 id="result-title">Company result · method {METHOD_VERSION}</h2>
      {signal.eligible ? <p>Risk score: {signal.riskScore}/100 · Opportunity score: {signal.opportunityScore}/100</p> : <><p>Insufficient company data. Scores are unavailable.</p><ul>{signal.exclusionReasons.map(reason => <li key={reason}>{reason.replaceAll("_", " ")}</li>)}</ul></>}
      <p>These company scores do not establish cohort breadth or national economic conditions.</p>
    </section>
    <section aria-labelledby="inputs-title">
      <h2 id="inputs-title">Calculation inputs</h2>
      <p>Standalone quarters: 2025-01-01–2025-03-31 and 2026-01-01–2026-03-31. Select an input reference to inspect its exact source value.</p>
      <div className="table-scroll" role="region" aria-label="Calculation input table" tabIndex={0}><table>
        <caption>Synthetic monetary inputs · IDR</caption>
        <thead><tr><th scope="col">Metric</th><th scope="col">Prior quarter</th><th scope="col">Current quarter</th></tr></thead>
        <tbody>{metrics.map(([key, label]) => <tr key={key}><th scope="row">{label}</th><td><a href={`#prior-${key}`}>{prior[key] ?? "Unknown"}</a></td><td><a href={`#current-${key}`}>{current[key] ?? "Unknown"}</a></td></tr>)}</tbody>
      </table></div>
      {signal.features && <dl>
        <dt>Revenue growth (%)</dt><dd>{signal.features.revenueGrowth} — 100 × (current revenue − prior revenue) / |prior revenue|</dd>
        <dt>Operating margin change (percentage points)</dt><dd>{signal.features.operatingMarginChange} — 100 × (current profit / current revenue − prior profit / prior revenue)</dd>
        <dt>Operating cash-flow margin change (percentage points)</dt><dd>{signal.features.operatingCashFlowMarginChange} — 100 × (current cash flow / current revenue − prior cash flow / prior revenue)</dd>
        <dt>Debt-to-assets change (percentage points)</dt><dd>{signal.features.debtAssetsChange} — 100 × (current debt / current assets − prior debt / prior assets)</dd>
      </dl>}
    </section>
    <section aria-labelledby="sources-title"><h2 id="sources-title">Source references</h2><p>References resolve to this local example. No source snapshot, publication date, or provider URL has been assigned.</p>
      {([ ["prior", prior], ["current", current] ] as const).map(([period, values]) => <details key={period} open><summary>{period === "prior" ? "Prior" : "Current"} example record</summary><dl>{metrics.map(([key, label]) => <div id={`${period}-${key}`} key={key}><dt>{label} · <code>/{period}/{key}</code></dt><dd>{values[key] === null ? "null — unknown, not zero" : values[key]}</dd></div>)}</dl></details>)}
    </section>
    <section aria-labelledby="comparison-title"><h2 id="comparison-title">Public indicator comparison</h2><p><strong>Not comparable</strong></p><p>This example is synthetic. No reviewed public indicator or mapping is attached. A valid comparison needs reviewed definitions, geography, units, reporting periods, publication dates, and source references.</p></section>
  </main>;
}
