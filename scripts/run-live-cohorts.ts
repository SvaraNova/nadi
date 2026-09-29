import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { SECTOR_DEFINITIONS } from "../src/domain/sectors-dataset";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1)];
}));

async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    for (const sector of SECTOR_DEFINITIONS) {
      const symbols = sector.companies.map((company) => company.symbol).slice(0, 15);
      await pool.query("select nadi_enqueue_job($1,$2,$3) as id", [
        `local:live:v2:${sector.id}:2026-03-31`,
        "ingestion",
        { mode: "live", symbols: symbols.join(","), reportDate: "2026-03-31", quarters: 6 },
      ]);
      console.log(`${sector.id}: queued`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "live cohort enqueue failed");
  process.exitCode = 1;
});
