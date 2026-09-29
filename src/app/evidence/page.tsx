import Link from "next/link";
import { METHOD_VERSION } from "../../domain/signals";
import type { Route } from "next";

export default function EvidencePage() {
  return <main className="evidence">
    <Link href="/">NADI home</Link>
    <p className="eyebrow">EVIDENCE · METHOD {METHOD_VERSION}</p>
    <h1>How evidence is calculated</h1>
    <p className="page-subtitle">Every company-level signal is derived from four deterministic formulas applied to two reporting periods.</p>
    <div className="flow-guide">
      <strong>What should you learn here?</strong>
      <span>Live evidence is only available in the context of a persisted signal run. This page explains the formulas without showing fabricated company figures.</span>
      <small>Unknown values stay unknown; they are never treated as zero.</small>
    </div>
    <section aria-labelledby="formulas-title">
      <h2 id="formulas-title">The four derived features</h2>
      <dl>
        <dt>Revenue growth (%)</dt><dd>100 × (current revenue − prior revenue) / |prior revenue|</dd>
        <dt>Operating margin change (percentage points)</dt><dd>100 × (current profit / current revenue − prior profit / prior revenue)</dd>
        <dt>Operating cash-flow margin change (percentage points)</dt><dd>100 × (current cash flow / current revenue − prior cash flow / prior revenue)</dd>
        <dt>Debt-to-assets change (percentage points)</dt><dd>100 × (current debt / current assets − prior debt / prior assets)</dd>
      </dl>
    </section>
    <section aria-labelledby="find-title">
      <h2 id="find-title">Find real evidence</h2>
      <p>Live evidence records, source snapshots, and provenance hashes are attached to a persisted signal run and company. Open a live run from the radar to inspect them.</p>
      <Link href={"/radar" as Route} className="btn btn-primary">Open live radar</Link>
    </section>
    <section aria-labelledby="comparison-title">
      <h2 id="comparison-title">Public indicator comparison</h2>
      <p>A valid comparison against an official statistic needs reviewed definitions, geography, units, reporting periods, publication dates, and source references. This context is attached per live signal run, not shown here.</p>
    </section>
  </main>;
}
