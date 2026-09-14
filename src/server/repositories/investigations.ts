import type { Pool } from "pg";
import type { InvestigationBrief, InvestigationEvent, InvestigationStatus } from "../../domain/investigation";

export async function startInvestigation(pool: Pool, signalRunId: string, budget: Readonly<Record<string, number>>): Promise<string> {
  const result = await pool.query<{ id: string }>("INSERT INTO investigation_run(signal_run_id,budget) VALUES($1,$2) RETURNING id", [signalRunId, budget]);
  return result.rows[0].id;
}

export async function appendInvestigationEvent(pool: Pool, investigationId: string, event: InvestigationEvent, sequence: number): Promise<void> {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error("INVALID_EVENT_SEQUENCE");
  await pool.query("INSERT INTO investigation_event(investigation_run_id,sequence,type,tool,message,occurred_at) VALUES($1,$2,$3,$4,$5,$6)", [investigationId, sequence, event.type, event.tool ?? null, event.message, event.at]);
}

export async function finishInvestigation(pool: Pool, investigationId: string, status: InvestigationStatus, brief: InvestigationBrief | null, failureReason: string | null): Promise<void> {
  await pool.query("UPDATE investigation_run SET status=$2,brief=$3,failure_reason=$4,finished_at=now() WHERE id=$1", [investigationId, status, brief, failureReason]);
}
