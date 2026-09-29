import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "database_not_configured" }, { status: 503 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const result = await pool.query(`
      SELECT sr.id, sr.dataset_id, sr.method_version, sr.status, sr.cohort_result,
             sr.config_json, d.mode, d.data_cutoff::text AS data_cutoff
      FROM signal_run sr
      JOIN dataset d ON d.id = sr.dataset_id
      WHERE d.mode = 'live'
      ORDER BY sr.created_at DESC
      LIMIT 1
    `);
    const row = result.rows[0];
    return NextResponse.json({ run: row ?? null });
  } catch {
    return NextResponse.json({ error: "database_query_failed" }, { status: 503 });
  } finally {
    await pool.end();
  }
}
