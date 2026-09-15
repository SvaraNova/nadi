import { NextResponse } from "next/server";

export async function GET() {
  const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    system: "NADI — National Discovery Intelligence",
    version: "0.1.0",
    methodVersion: "0.1",
    dataMode: isDatabaseConfigured ? "snapshot" : "synthetic",
    database: {
      configured: isDatabaseConfigured,
      status: isDatabaseConfigured ? "connected" : "in_memory_synthetic",
    },
    capabilities: {
      radar: true,
      evidence_lineage: true,
      bounded_investigation: true,
      decision_briefs: true,
      markdown_export: true,
    },
  });
}
