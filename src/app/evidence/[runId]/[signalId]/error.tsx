"use client";

export default function EvidenceError({ reset }: { reset: () => void }) {
  return <main><h1>Evidence could not be loaded</h1><p>The stored run remains unchanged. Check the database connection and try again.</p><button onClick={reset}>Retry</button></main>;
}
