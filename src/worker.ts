import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { migrate } from "./server/ingestion/migrate";
import { runOne } from "./server/ingestion/worker";
import { persistSignalRun } from "./server/repositories/signal-runs";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 5000 });
  try {
    const [command, argument, target] = process.argv.slice(2);
    if (command === "migrate") { await migrate(pool); console.log("Migrations applied"); }
    else if (command === "signals" && argument && target) {
      console.log(JSON.stringify({ runId: await persistSignalRun(pool, argument, target) }));
    }
    else if (command === "enqueue-synthetic") {
      const scenario = argument ?? "baseline";
      if (!["baseline","revision","missing"].includes(scenario)) throw new Error("INVALID_SCENARIO");
      const result = await pool.query("SELECT nadi_enqueue_job($1,'ingestion',$2) AS id",
        [`local:synthetic:${scenario}`, { mode: "synthetic", scenario }]);
      console.log(JSON.stringify({ mode: "synthetic", jobId: result.rows[0].id }));
    } else if (command === "once") { console.log(JSON.stringify(await runOne(pool, randomUUID()))); }
    else if (command === "status") {
      const result = await pool.query("SELECT j.id,j.status,j.attempts,d.dataset_id FROM job j LEFT JOIN job_dataset d ON d.job_id=j.id ORDER BY j.created_at DESC LIMIT 20");
      console.log(JSON.stringify(result.rows));
    } else if (command === "cancel" && argument) {
      await pool.query("SELECT nadi_cancel_job($1)", [argument]); console.log("Cancellation recorded");
    } else throw new Error("Use migrate, enqueue-synthetic [baseline|revision|missing], once, status, or cancel <id>");
  } finally { await pool.end(); }
}
main().catch(() => { console.error("Worker command failed; inspect job status and configuration. No provider data was logged."); process.exitCode = 1; });
