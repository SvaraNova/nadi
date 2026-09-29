import { Pool } from "pg";
import { NextResponse } from "next/server";
import { assertLocalRequest } from "../../../../../server/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { assertLocalRequest(request.headers); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  if (!process.env.DATABASE_URL) return NextResponse.json({ indicators: [] });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const result = await pool.query(`SELECT i.name,i.definition,i.source_url,i.publisher,i.value,i.unit,i.geography,
      i.period_start::text,i.period_end::text,i.published_at::text,i.retrieved_at::text,
      m.cohort_key,m.relation,m.rationale,m.reviewer,m.reviewed_at::text
      FROM public_indicator i JOIN indicator_mapping m ON m.indicator_id=i.id
      ORDER BY i.period_end DESC LIMIT 20`);
    return NextResponse.json({ indicators: result.rows });
  } catch { return NextResponse.json({ error: "database_query_failed" }, { status: 503 }); }
  finally { await pool.end(); }
}
