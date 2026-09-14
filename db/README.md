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

## Persisting ingestion sources

Migration 003 adds `nadi_store_ingestion_source(job_id, lease_token, account_namespace, snapshot, rejected_rows)`. `snapshot` is the JSON form of `createSourceSnapshot`; `rejected_rows` retains normalization diagnostics. Use a stable opaque account namespace, never an API key. URLs must have no userinfo, query or fragment; request parameters belong in `redactedParams`.

Call this function and `nadi_finish_job` in one transaction. It locks the job, checks its active lease and declared mode, validates the raw UTF-8 payload hash, then persists raw JSON text alongside parsed JSONB and the rejection records. Failed completion rolls all output back. Identical content within one mode/account/request/schema reuses the snapshot and its original retrieval timestamp. Different modes, accounts or requests get separate identities. This is content deduplication, not a TTL cache or a fresh retrieval event.

Legacy snapshots keep their existing IDs and JSONB; their raw bytes/account/request hash are left unknown. They are never silently relabeled or deduplicated with new snapshots. Decimal values in JSONB remain PostgreSQL numeric values; raw text remains available for lossless normalization. A snapshot payload must be valid JSON, but its financial rows may be invalid and accompanied by rejection reasons.

The worker loop and observation/dataset writes are not yet implemented. The function trusts normalization diagnostics supplied by the internal caller; it does not establish financial validity or live provider provenance from a mode label alone.
