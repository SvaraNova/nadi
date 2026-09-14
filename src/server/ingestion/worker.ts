import type { Pool } from "pg";
import { normalizeQuarterlyPayload, parseQuarterlyRaw } from "../../domain/normalize-quarterly";
import { createSourceSnapshot } from "../../domain/source-snapshot";
import { syntheticSources } from "./synthetic";

export async function runOne(pool: Pool, owner: string): Promise<{ jobId: string; datasetId: string } | null> {
  const connection = await pool.connect();
  let job: { id: string; lease_token: string; type: string; payload: { mode?: string; scenario?: string } } | undefined;
  try {
    const result = await connection.query("SELECT * FROM nadi_claim_job($1,60)", [owner]);
    job = result.rows[0];
    if (!job) return null;
    if (job.type !== "ingestion" || job.payload.mode !== "synthetic") throw new Error("UNSUPPORTED_INGESTION_MODE");
    const sources = syntheticSources(job.payload.scenario ?? "");
    await connection.query("BEGIN");
    const ids: string[] = [];
    for (const source of sources) {
      const normalized = normalizeQuarterlyPayload(parseQuarterlyRaw(source.raw), { companySymbol: source.symbol,
        basis: "standalone_quarter", unit: "currency", currency: "IDR", expectedDates: ["2025-03-31", "2026-03-31"] });
      const snapshot = createSourceSnapshot({ mode: "synthetic", provider: "synthetic", requestPath: `/quarterly/${source.symbol}/`,
        sourceUrl: `https://example.test/quarterly/${source.symbol}/`, payload: source.raw, schemaVersion: "synthetic-v1",
        retrievedAt: "2026-09-14T00:00:00.000Z" });
      const stored = await connection.query("SELECT nadi_store_ingestion_source($1,$2,$3,$4,$5) AS id",
        [job.id, job.lease_token, "synthetic", snapshot, JSON.stringify(normalized.rejectedRows)]);
      for (const observation of normalized.observations) {
        const row = await connection.query("SELECT nadi_store_observation($1,$2,$3,$4,$5) AS id",
          [job.id, job.lease_token, stored.rows[0].id, source.symbol, observation]);
        ids.push(row.rows[0].id);
      }
    }
    const published = await connection.query("SELECT nadi_publish_dataset($1,$2,$3,$4) AS id", [job.id, job.lease_token, ids,
      { name: "Synthetic six-company development fixture", symbols: sources.map(s => s.symbol), periods: ["2025-03-31", "2026-03-31"] }]);
    await connection.query("COMMIT");
    return { jobId: job.id, datasetId: published.rows[0].id };
  } catch (error) {
    await connection.query("ROLLBACK");
    if (job) {
      // A revoked/expired lease cannot overwrite a new owner's state.
      try { await connection.query("SELECT nadi_finish_job($1,$2,'failed')", [job.id, job.lease_token]); }
      catch { /* Recovery or cancellation owns the final status. */ }
    }
    throw error;
  } finally { connection.release(); }
}
