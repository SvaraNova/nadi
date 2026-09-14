"use client";

export default function RadarError({ reset }: { reset: () => void }) {
  return <main><h1>Radar could not be loaded</h1><p>Check the database connection and try again.</p><button onClick={reset}>Retry</button></main>;
}
