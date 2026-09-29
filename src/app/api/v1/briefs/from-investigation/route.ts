import { Pool } from "pg";
import { NextResponse } from "next/server";
import { assertLocalRequest } from "../../../../../server/access";
import { persistInvestigationBrief } from "../../../../../server/repositories/briefs";
import type { InvestigationBrief } from "../../../../../domain/investigation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { assertLocalRequest(request.headers); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "database_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const investigationId = typeof body.investigationId === "string" ? body.investigationId : "";
  if (!/^[0-9a-f-]{36}$/i.test(investigationId)) return NextResponse.json({ error: "invalid_investigation_id" }, { status: 400 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const result = await pool.query<{ brief: InvestigationBrief | null; status: string }>("SELECT brief,status FROM investigation_run WHERE id=$1", [investigationId]);
    const row = result.rows[0];
    if (!row?.brief || row.status !== "completed") return NextResponse.json({ error: "completed_investigation_not_found" }, { status: 404 });
    const briefId = await persistInvestigationBrief(pool, investigationId, row.brief, "nadi-live-review");
    return NextResponse.json({ briefId, status: "draft", dataMode: row.brief.dataMode }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "brief_persistence_failed" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
