import { NextResponse } from "next/server";

export async function GET() {
  const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    system: "NADI — National Discovery Intelligence",
    version: "0.1.0",
    methodVersion: "0.1",
    dataMode: isDatabaseConfigured ? "live" : "unavailable",
    database: {
      configured: isDatabaseConfigured,
      status: isDatabaseConfigured ? "connected" : "not_configured",
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
