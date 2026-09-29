import { Pool } from "pg";
import { NextResponse } from "next/server";
import { assertLocalRequest } from "../../../../../server/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { assertLocalRequest(request.headers); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !process.env.DATABASE_URL) return NextResponse.json({ error: "investigation_not_found" }, { status: 404 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const result = await pool.query(`SELECT ir.id,ir.signal_run_id,ir.status,ir.brief,ir.created_at::text,ir.finished_at::text,d.mode,sr.method_version,sr.config_json
      FROM investigation_run ir JOIN signal_run sr ON sr.id=ir.signal_run_id JOIN dataset d ON d.id=sr.dataset_id WHERE ir.id=$1`, [id]);
    const row = result.rows[0];
    if (!row || row.mode !== "live") return NextResponse.json({ error: "investigation_not_found" }, { status: 404 });
    const events = await pool.query("SELECT type,tool,message,occurred_at::text AS at FROM investigation_event WHERE investigation_run_id=$1 ORDER BY sequence", [id]);
    const brief = row.brief;
    return NextResponse.json({ investigation: { id: row.id, cohortId: brief?.cohortId ?? "live-cohort", signalRunId: row.signal_run_id, question: brief?.investigationQuestions?.[0] ?? "Live signal review", status: row.status, dataMode: row.mode, period: brief?.period ?? row.config_json?.target ?? "unknown", methodVersion: row.method_version, model: "Deterministic live review", createdAt: row.created_at, finishedAt: row.finished_at ?? undefined, events: events.rows, brief } });
  } catch { return NextResponse.json({ error: "database_query_failed" }, { status: 503 }); }
  finally { await pool.end(); }
}
