import type { Pool } from "pg";
import { normalizeQuarterlyPayload, parseQuarterlyRaw } from "../../domain/normalize-quarterly";
import { createSourceSnapshot } from "../../domain/source-snapshot";
import { syntheticSources } from "./synthetic";
import { fetchLiveSources, parseLiveSymbols } from "./live";
export async function runOne(pool: Pool, owner: string): Promise<{ jobId: string; datasetId: string } | null> {
  const connection = await pool.connect();
  let job: { id: string; lease_token: string; type: string; payload: { mode?: string; scenario?: string; symbols?: string; reportDate?: string; quarters?: number } } | undefined;
  try {
    const result = await connection.query("SELECT * FROM nadi_claim_job($1,60)", [owner]);
    job = result.rows[0];
    if (!job) return null;
    if (job.type !== "ingestion") throw new Error("UNSUPPORTED_JOB_TYPE");
    const mode = job.payload.mode;
    let sources: readonly { symbol: string; raw: string; requestPath: string; sourceUrl: string; retrievedAt: string }[];
    if (mode === "synthetic") {
      sources = syntheticSources(job.payload.scenario ?? "").map((source) => ({
        ...source,
        requestPath: `/quarterly/${source.symbol}/`,
        sourceUrl: `https://example.test/quarterly/${source.symbol}/`,
        retrievedAt: "2026-09-14T00:00:00.000Z",
      }));
    } else if (mode === "live") {
      const live = await fetchLiveSources({
        apiKey: process.env.SECTORS_API_KEY ?? "",
        symbols: parseLiveSymbols(job.payload.symbols),
        reportDate: job.payload.reportDate ?? "",
        quarters: Number(job.payload.quarters ?? 2),
      });
      sources = live.sources;
    } else {
      throw new Error("UNSUPPORTED_INGESTION_MODE");
    }
    await connection.query("BEGIN");
    const ids: string[] = [];
    for (const source of sources) {
      const normalized = normalizeQuarterlyPayload(parseQuarterlyRaw(source.raw), {
        companySymbol: source.symbol,
        basis: "standalone_quarter",
        unit: "currency",
        currency: "IDR",
      });
      const snapshot = createSourceSnapshot({
        mode: mode as "live" | "synthetic",
        provider: mode === "live" ? "sectors" : "synthetic",
        requestPath: source.requestPath,
        sourceUrl: source.sourceUrl,
        payload: source.raw,
        schemaVersion: mode === "live" ? "sectors-v2-quarterly-v1" : "synthetic-v1",
        retrievedAt: source.retrievedAt,
      });
      const stored = await connection.query("SELECT nadi_store_ingestion_source($1,$2,$3,$4,$5) AS id", [job.id, job.lease_token, mode === "live" ? "sectors" : "synthetic", snapshot, JSON.stringify(normalized.rejectedRows)]);
      for (const observation of normalized.observations) {
        const row = await connection.query("SELECT nadi_store_observation($1,$2,$3,$4,$5) AS id", [job.id, job.lease_token, stored.rows[0].id, source.symbol, observation]);
        ids.push(row.rows[0].id);
      }
    }
    const published = await connection.query("SELECT nadi_publish_dataset($1,$2,$3,$4) AS id", [job.id, job.lease_token, ids, { name: mode === "live" ? "Live bounded Sectors cohort" : "Synthetic development fixture", symbols: sources.map((source) => source.symbol), periods: [job.payload.reportDate ?? "2026-03-31"] }]);
    await connection.query("COMMIT");
    return { jobId: job.id, datasetId: published.rows[0].id };
  } catch (error) {
    await connection.query("ROLLBACK");
    if (job) {
      try { await connection.query("SELECT nadi_finish_job($1,$2,'failed')", [job.id, job.lease_token]); }
      catch { /* Recovery or cancellation owns the final state. */ }
    }
    throw error;
  } finally {
    connection.release();
  }
}
