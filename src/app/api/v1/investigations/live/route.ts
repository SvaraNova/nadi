import { Pool } from "pg";
import { NextResponse } from "next/server";
import { assertLocalRequest } from "../../../../../server/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { assertLocalRequest(request.headers); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  if (!process.env.DATABASE_URL) return NextResponse.json({ investigations: [] });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const result = await pool.query(`SELECT ir.id,ir.signal_run_id,ir.status,ir.brief,ir.created_at::text,ir.finished_at::text,d.mode
      FROM investigation_run ir JOIN signal_run sr ON sr.id=ir.signal_run_id JOIN dataset d ON d.id=sr.dataset_id
      WHERE d.mode='live' ORDER BY ir.created_at DESC LIMIT 20`);
    return NextResponse.json({ investigations: result.rows });
  } catch {
    return NextResponse.json({ error: "database_query_failed" }, { status: 503 });
  } finally { await pool.end(); }
}
