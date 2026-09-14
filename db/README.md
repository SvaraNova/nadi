# Database development

The migrations target PostgreSQL 14 or later. Apply numbered migrations in order to a fresh application database using `psql -X -v ON_ERROR_STOP=1 --single-transaction -f <migration>`. Configure the connection through PostgreSQL environment variables. There is no automatic migration runner yet; track applied migrations and do not reapply them.

The job functions support durable payloads, idempotent submission, exclusive claims, lease renewal, terminal completion and cancellation. They are internal database primitives; HTTP endpoints and an ingestion worker loop remain follow-up work.

- `nadi_enqueue_job(key, type, payload)` returns the existing job for an identical type and JSON payload; conflicting reuse raises `IDEMPOTENCY_CONFLICT`. Callers must scope keys by principal and operation. Payloads must contain task inputs only; never include credentials or raw provider records.
- `nadi_claim_job(owner, lease_seconds)` claims one queued or expired job with `FOR UPDATE SKIP LOCKED` and returns a fresh lease token. Commit the claim before doing external work. Existing legacy rows without payloads cannot be claimed.
- `nadi_heartbeat_job(id, token, lease_seconds)` extends only a current, unexpired lease. Durations must be 1–3600 seconds.
- `nadi_finish_job(id, token, status)` accepts `succeeded` or `failed`. Output writes and completion must occur in the **same transaction**. On any completion error, roll back that whole transaction. Never swallow a stale-lease error and commit output.
- `nadi_cancel_job(id)` revokes active ownership and adds one cancellation event. Repeated cancellation is harmless; terminal jobs are unchanged. Already-issued provider requests cannot be undone.

These functions use the existing database status enum; they do not define a new public status API. Direct SQL access can bypass these rules. An application DB role and hosted authorization still need implementation.

## Integration tests

Install `psql` and Python 3, and set `TEST_DATABASE_URL` to a dedicated PostgreSQL test database. Run:

```sh
python3 scripts/test-database.py
```

The test creates a unique schema, applies all migrations, uses synthetic jobs, and removes only that schema afterward. It covers idempotency, body conflicts, lease recovery, stale completion rollback, cancellation, ordered events, concurrent claims and replacement-worker recovery across connections. The CI `database` job runs the same command against a PostgreSQL service. Routine tests use no provider credentials or credits.

This does not yet demonstrate persisted financial ingestion or completion of the data-foundation roadmap issue.
