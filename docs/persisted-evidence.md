# Stored evidence

This local operator workflow uses PostgreSQL and the existing immutable dataset
schema. Configure DATABASE_URL in the process environment, then run:

```sh
npm ci
npm run worker -- migrate
npm run worker -- enqueue-synthetic baseline
npm run worker -- once
npm run worker -- signals <dataset-id-from-once> 2026-03-31
npm run dev -- --hostname 127.0.0.1
```

Open `/radar?run=<run-id-from-signals>`. Select a company to inspect the stored
result, decimal inputs, observation IDs, revisions, source pointers, snapshot
hashes, units, periods, and retrieval/publication metadata. Unknown IDs return
404. Database failures show a retry state, without falling back to examples.

The `signals` command publishes the run, company results and evidence links in
one transaction. Repeating a dataset/target/configuration returns the same run.
Source revisions create new datasets and runs; old evidence stays pinned.
Ambiguous revisions, incompatible units/currencies/basis and missing values do
not produce eligible company scores. Adjacent-period persistence is unavailable.

The existing `/evidence` examples remain explicitly synthetic. Stored pages are
for local use; hosted authentication is not implemented in this slice.

## Verification

`npm run test:ingestion` requires TEST_DATABASE_URL pointing at a dedicated test
database. It exercises actual PostgreSQL migrations, atomic ingestion, run replay,
revision isolation, immutable results, evidence resolution and missing values.

## Remaining issue #5 acceptance

Public comparison explicitly reports not comparable while a reviewed indicator
mapping is absent. Issue #5's review note requires a reviewed public indicator
mapping before closure. This implementation does not invent an indicator,
publisher value, source snapshot, or reviewer. That reviewed import/integration
remains pending; this slice alone must not close #5.
