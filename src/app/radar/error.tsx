"use client";

export default function RadarError({ reset }: { reset: () => void }) {
  return <main role="alert"><p className="eyebrow">NADI · RECOVERABLE ERROR</p><h1>Radar could not be loaded</h1><p>The stored run remains unchanged. Check the database connection and try again.</p><button type="button" onClick={reset}>Retry loading radar</button></main>;
}
