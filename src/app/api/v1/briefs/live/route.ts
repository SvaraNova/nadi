import { Pool } from "pg";
import { NextResponse } from "next/server";
import { assertLocalRequest } from "../../../../../server/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { assertLocalRequest(request.headers); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  if (!process.env.DATABASE_URL) return NextResponse.json({ briefs: [] });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const result = await pool.query(`SELECT b.id,b.investigation_id,b.cohort_id,b.title,b.status,b.current_version,b.created_at::text,b.updated_at::text,
      v.content->>'dataMode' AS data_mode FROM brief b JOIN brief_version v ON v.brief_id=b.id AND v.version_number=b.current_version
      WHERE v.content->>'dataMode'='live' ORDER BY b.updated_at DESC LIMIT 20`);
    return NextResponse.json({ briefs: result.rows });
  } catch {
    return NextResponse.json({ error: "database_query_failed" }, { status: 503 });
  } finally { await pool.end(); }
}
