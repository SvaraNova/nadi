import { Pool } from "pg";
import { NextResponse } from "next/server";
import { assertLocalRequest } from "../../../../../server/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { assertLocalRequest(request.headers); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  if (!process.env.DATABASE_URL) return NextResponse.json({ datasets: [] });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const result = await pool.query(`SELECT id,manifest_hash,data_cutoff::text,created_at::text,jsonb_array_length(observation_ids) AS observation_count
      FROM dataset WHERE mode='live' ORDER BY created_at DESC LIMIT 20`);
    return NextResponse.json({ datasets: result.rows });
  } catch { return NextResponse.json({ error: "database_query_failed" }, { status: 503 }); }
  finally { await pool.end(); }
}
