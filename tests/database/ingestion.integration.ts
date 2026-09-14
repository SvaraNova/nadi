import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { migrate } from "../../src/server/ingestion/migrate";
import { runOne } from "../../src/server/ingestion/worker";

test("persist/replay/revise/recover a complete synthetic ingestion", async () => {
  assert.ok(process.env.TEST_DATABASE_URL, "TEST_DATABASE_URL is required");
  const schema = `nadi_integration_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  let pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
  try {
    await migrate(pool); await migrate(pool);
    const enqueue = async (key: string, scenario: string) => (await pool.query(
      "SELECT nadi_enqueue_job($1,'ingestion',$2) AS id", [key, { mode: "synthetic", scenario }])).rows[0].id;
    // Fault after some writes proves that neither snapshots nor observations leak.
    await pool.query(`CREATE FUNCTION fail_source() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.request_path LIKE '%SYNTHETIC-3%' THEN RAISE EXCEPTION 'INJECTED_FAILURE'; END IF;
      RETURN NEW; END $$;
      CREATE TRIGGER fail_source BEFORE INSERT ON source_snapshot FOR EACH ROW EXECUTE FUNCTION fail_source()`);
    const failedJob = await enqueue("fault", "baseline");
    await assert.rejects(runOne(pool, "fault-worker"), /INJECTED_FAILURE/);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM source_snapshot")).rows[0].n, 0);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM observation")).rows[0].n, 0);
    assert.equal((await pool.query("SELECT status FROM job WHERE id=$1", [failedJob])).rows[0].status, "failed");
    await pool.query("DROP TRIGGER fail_source ON source_snapshot; DROP FUNCTION fail_source()");
    const job = await enqueue("test-baseline", "baseline");
    assert.equal(await enqueue("test-baseline", "baseline"), job);
    const first = await runOne(pool, "worker-first");
    assert.equal(first?.jobId, job);
    assert.ok(first?.datasetId);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM observation")).rows[0].n, 60);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM source_snapshot")).rows[0].n, 6);
    const before = (await pool.query("SELECT manifest,completeness FROM dataset WHERE id=$1", [first.datasetId])).rows[0];
    assert.equal(before.completeness.valid, 60);
    await pool.end();
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
    assert.deepEqual((await pool.query("SELECT manifest,completeness FROM dataset WHERE id=$1", [first.datasetId])).rows[0], before);
    await enqueue("replay", "baseline");
    assert.equal((await runOne(pool, "worker-replay"))?.datasetId, first.datasetId);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM observation")).rows[0].n, 60);
    await enqueue("revision", "revision");
    const revised = await runOne(pool, "worker-revision");
    assert.notEqual(revised?.datasetId, first.datasetId);
    assert.deepEqual((await pool.query("SELECT manifest,completeness FROM dataset WHERE id=$1", [first.datasetId])).rows[0], before);
    assert.equal((await pool.query("SELECT max(revision) AS n FROM observation")).rows[0].n, 2);
    await assert.rejects(pool.query("UPDATE dataset SET completeness='{}' WHERE id=$1", [first.datasetId]), /IMMUTABLE_PROVENANCE/);
    const recoveryId = await enqueue("recovery", "missing");
    await pool.query("SELECT * FROM nadi_claim_job('crashed-worker',60)");
    await pool.query("UPDATE job SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE id=$1", [recoveryId]);
    await pool.end();
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
    const recovered = await runOne(pool, "replacement-worker");
    assert.equal(recovered?.jobId, recoveryId);
    assert.equal((await pool.query("SELECT attempts FROM job WHERE id=$1", [recoveryId])).rows[0].attempts, 2);
    assert.equal((await pool.query("SELECT completeness FROM dataset WHERE id=$1", [recovered?.datasetId])).rows[0].completeness.valid, 59);
    assert.equal(await runOne(pool, "idle"), null);
  } finally {
    await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end();
  }
});
