import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { Pool } from "pg";

export async function migrate(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(7391041)");
    await client.query("CREATE TABLE IF NOT EXISTS nadi_migration(name TEXT PRIMARY KEY, hash TEXT NOT NULL)");
    for (const name of (await readdir("db/migrations")).filter(n => /^\d+.*\.sql$/.test(n)).sort()) {
      const sql = await readFile(`db/migrations/${name}`, "utf8");
      const hash = createHash("sha256").update(sql).digest("hex");
      const applied = await client.query("SELECT hash FROM nadi_migration WHERE name=$1", [name]);
      if (applied.rowCount) {
        if (applied.rows[0].hash !== hash) throw new Error("MIGRATION_CHANGED");
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO nadi_migration VALUES($1,$2)", [name, hash]);
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
