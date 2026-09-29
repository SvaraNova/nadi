import { Pool } from "pg";
import { NextResponse } from "next/server";
import { assertLocalRequest } from "../../../../../../server/access";
import { readEvidence } from "../../../../../../server/repositories/evidence";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ runId: string; companyId: string }> }) {
  try { assertLocalRequest(request.headers); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  const { runId, companyId } = await params;
  if (![runId, companyId].every((value) => /^[0-9a-f-]{36}$/i.test(value))) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "database_not_configured" }, { status: 503 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const evidence = await readEvidence(pool, runId, companyId);
    if (!evidence) return NextResponse.json({ error: "evidence_not_found" }, { status: 404 });
    const { run, company, rows } = evidence;
    const currentRow = rows.find((row) => row.role === "current");
    const priorRow = rows.find((row) => row.role === "prior" && row.metric === currentRow?.metric);
    return NextResponse.json({
      id: company.id,
      symbol: company.symbol,
      metric: currentRow?.metric ?? "revenue",
      priorValue: priorRow?.value ?? null,
      currentValue: currentRow?.value ?? null,
      unit: currentRow?.unit ?? "IDR",
      currency: currentRow?.currency ?? "IDR",
      basis: currentRow?.basis ?? "standalone_quarter",
      period: run.config_json?.target ?? "unknown",
      retrievedAt: currentRow?.retrieved_at ?? "unknown",
      datasetId: run.dataset_id,
      signalRunId: run.id,
      sourcePointer: currentRow?.source_pointer ?? "unknown",
      payloadHash: currentRow?.payload_hash ?? "unknown",
      rows,
    });
  } catch { return NextResponse.json({ error: "database_query_failed" }, { status: 503 }); }
  finally { await pool.end(); }
}
