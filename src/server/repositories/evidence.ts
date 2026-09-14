import type { Pool } from "pg";
import type { CompanySignal, CohortSignal } from "../../domain/signals";

export type StoredRun = { id: string; dataset_id: string; method_version: string; config_hash: string; config_json: { target: string; prior: string; persistence: string } | null; cohort_result: CohortSignal; mode: string; manifest_hash: string; data_cutoff: string | null };
export type StoredCompany = { id: string; company_id: string; symbol: string; result: CompanySignal };
export type EvidenceRow = { id: string; role: string; metric: string; value: string | null; unit: string | null; currency: string | null; period: string; start: string | null; basis: string; quality_status: string; revision: number; source_snapshot_id: string; source_pointer: string; provider: string; source_url: string; payload_hash: string; retrieved_at: string; available_at: string | null };
export async function readRun(pool: Pool, id: string) {
  const run = (await pool.query<StoredRun>(`SELECT r.*,d.mode,d.manifest_hash,d.data_cutoff::text FROM signal_run r JOIN dataset d ON d.id=r.dataset_id WHERE r.id=$1`, [id])).rows[0];
  if (!run) return null;
  const companies = (await pool.query<StoredCompany>(`SELECT cs.id,cs.company_id,c.provider_symbol AS symbol,cs.result FROM company_signal cs JOIN company c ON c.id=cs.company_id WHERE cs.signal_run_id=$1 ORDER BY c.provider_symbol`, [id])).rows;
  return { run, companies };
}
export async function readEvidence(pool: Pool, runId: string, companySignalId: string) {
  const context = await readRun(pool, runId);
  const company = context?.companies.find(c => c.id === companySignalId);
  if (!context || !company) return null;
  const rows = (await pool.query<EvidenceRow>(`SELECT o.id,e.role,o.metric,o.decimal_value::text AS value,o.unit,o.currency,
    o.period_end::text AS period,o.period_start::text AS start,o.basis,o.quality_status,o.revision,o.source_snapshot_id,o.source_pointer,
    s.provider,s.source_url,s.payload_hash,s.retrieved_at::text,o.available_at::text
    FROM signal_evidence e JOIN observation o ON o.id=e.observation_id JOIN source_snapshot s ON s.id=o.source_snapshot_id
    JOIN signal_run r ON r.id=e.signal_run_id JOIN dataset d ON d.id=r.dataset_id
    WHERE e.signal_run_id=$1 AND e.company_signal_id=$2 AND o.company_id=$3
      AND d.observation_ids @> jsonb_build_array(o.id::text) AND s.mode=d.mode
    ORDER BY e.role,o.metric`, [runId, companySignalId, company.company_id])).rows;
  const expected = (await pool.query("SELECT prior_observation_ids,current_observation_ids FROM company_signal WHERE id=$1", [companySignalId])).rows[0];
  const actual = rows.map(r => `${r.role}:${r.id}`).sort();
  const wanted = [...expected.prior_observation_ids.map((id: string) => `prior:${id}`), ...expected.current_observation_ids.map((id: string) => `current:${id}`)].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error("EVIDENCE_LINEAGE_MISMATCH");
  return { ...context, company, rows };
}
export function publicSourceUrl(value: string): string | null {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash ? url.href : null; } catch { return null; }
}
