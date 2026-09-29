import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { persistSignalRun } from "../src/server/repositories/signal-runs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1)];
}));
const datasets = [
  "3c6303af-b560-45f1-80eb-b1bc58909dc5",
  "06dd2356-cc2f-4afe-8894-777df4c33c60",
  "65853b27-7b01-42df-a132-04b38ccfaad0",
  "ec69a822-2fd8-4699-9235-8a425dfc2498",
  "e86773ca-8519-48cb-8760-d215f919e45f",
] as const;

async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    for (const datasetId of datasets) {
      const runId = await persistSignalRun(pool, datasetId, "2026-03-31");
      console.log(`${datasetId}: ${runId}`);
    }
  } finally {
    await pool.end();
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "live signal publication failed"); process.exitCode = 1; });
