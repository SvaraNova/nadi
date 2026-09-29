import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { runOne } from "../src/server/ingestion/worker";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1)];
}));
Object.assign(process.env, env);

async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 2, connectionTimeoutMillis: 5000 });
  try {
    for (let i = 0; i < 5; i += 1) {
      const result = await runOne(pool, randomUUID());
      console.log(JSON.stringify({ processed: i + 1, result: result ? { datasetId: result.datasetId } : null }));
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "live job processing failed");
  process.exitCode = 1;
});
