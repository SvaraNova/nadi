import { Pool } from "pg";
import { NextResponse } from "next/server";
import { assertLocalRequest } from "../../../../../server/access";
import { createHttpLlmProvider } from "../../../../../server/investigation/llm";
import { appendInvestigationEvent, finishInvestigation, startInvestigation } from "../../../../../server/repositories/investigations";
import { persistInvestigationBrief } from "../../../../../server/repositories/briefs";

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
  } catch { return NextResponse.json({ error: "database_query_failed" }, { status: 503 }); }
  finally { await pool.end(); }
}

export async function POST(request: Request) {
  try { assertLocalRequest(request.headers); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "database_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const signalRunId = typeof body.signalRunId === "string" ? body.signalRunId : "";
  const question = typeof body.question === "string" && body.question.trim() ? body.question.trim() : "What evidence supports this live signal?";
  if (!/^[0-9a-f-]{36}$/i.test(signalRunId)) return NextResponse.json({ error: "invalid_signal_run_id" }, { status: 400 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const source = await pool.query<{ dataset_id: string; cohort_result: Record<string, unknown>; config_json: Record<string, unknown> | null; mode: string }>(`SELECT sr.dataset_id,sr.cohort_result,sr.config_json,d.mode FROM signal_run sr JOIN dataset d ON d.id=sr.dataset_id WHERE sr.id=$1 AND d.mode='live'`, [signalRunId]);
    const run = source.rows[0];
    if (!run) return NextResponse.json({ error: "live_signal_run_not_found" }, { status: 404 });
    const evidence = await pool.query<{ id: string; company_id: string; result: Record<string, unknown>; symbol: string }>(`SELECT cs.id,cs.company_id,cs.result,c.provider_symbol AS symbol FROM company_signal cs JOIN company c ON c.id=cs.company_id WHERE cs.signal_run_id=$1 ORDER BY c.provider_symbol`, [signalRunId]);
    const investigationId = await startInvestigation(pool, signalRunId, { maxToolCalls: 12, deadlineMs: 120000 });
    await appendInvestigationEvent(pool, investigationId, { type: "started", at: new Date().toISOString(), message: `Live investigation initialized for ${signalRunId}.` }, 1);
    await appendInvestigationEvent(pool, investigationId, { type: "progress", at: new Date().toISOString(), message: `Loaded ${evidence.rows.length} persisted company signals from PostgreSQL.` }, 2);
    const availableEvidenceIds = evidence.rows.map((row) => row.id);
    const model = process.env.LLM_PROVIDER?.toLowerCase() === "openai" && process.env.LLM_API_KEY ? createHttpLlmProvider({ endpoint: process.env.LLM_ENDPOINT ?? "https://api.openai.com/v1/chat/completions", apiKey: process.env.LLM_API_KEY, model: process.env.LLM_MODEL ?? "gpt-4o-mini", provider: "openai" }) : null;
    let summary = `The persisted live signal is ${String(run.cohort_result.label ?? "unknown")} with ${evidence.rows.length} company-level results. Review the linked evidence before drawing conclusions.`;
    if (model) {
      const response = await model.complete({ system: "You are an evidence-first analyst. Write one concise Indonesian paragraph using only the supplied persisted live signal and company results. Do not invent numbers, causes, citations, or external facts.", user: JSON.stringify({ question, signal: run.cohort_result, companies: evidence.rows.map((row) => ({ symbol: row.symbol, result: row.result })) }) });
      summary = response.text.trim();
      await appendInvestigationEvent(pool, investigationId, { type: "progress", at: new Date().toISOString(), message: `OpenAI interpretation generated with ${response.model}.` }, 3);
    }
    const brief = { title: "Live evidence investigation", runId: signalRunId, cohortId: String(run.config_json?.cohortId ?? "live-cohort"), dataMode: "live" as const, period: String(run.config_json?.target ?? "live period"), methodVersion: "0.1", summary, claims: [{ kind: "observation" as const, text: summary, evidenceIds: availableEvidenceIds, numericFacts: [] }], supportingEvidenceIds: availableEvidenceIds, contradictingEvidenceIds: [], dataGaps: ["Live investigation uses persisted company signals; no unsupported causal claim was generated."], publicComparison: "not_comparable", investigationQuestions: [question], limitations: ["This brief is limited to the persisted live cohort and stored evidence."] };
    await finishInvestigation(pool, investigationId, "completed", brief, null);
    const briefId = await persistInvestigationBrief(pool, investigationId, brief);
    return NextResponse.json({ investigationId, briefId, status: "completed", brief }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "live_investigation_failed" }, { status: 500 }); }
  finally { await pool.end(); }
}
