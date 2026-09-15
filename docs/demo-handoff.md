# NADI synthetic demonstration

This handoff describes the capability that is verified in the public repository.
It uses explicitly synthetic data and must not be presented as a live economic
finding.

## Run locally

```sh
npm ci
npm run typecheck
npm run lint
npm run build
npm run dev -- --hostname 127.0.0.1
```

Open `http://127.0.0.1:3000/`. The verified synthetic routes are:

- `/evidence` — risk, opportunity, and missing-data examples.
- `/radar` — deterministic synthetic cohort radar.
- `/radar/synthetic-company-1` — signal detail and calculation lineage shape.

The persisted radar and evidence routes require `DATABASE_URL`, PostgreSQL
migrations, and a locally ingested synthetic dataset. They are not silently
replaced by page examples when the database is unavailable.

## What was observed

The production build generates the home, evidence, radar, and signal-detail
routes. Typecheck and lint pass in the declared Node 20 environment. The
synthetic examples expose risk, opportunity, and insufficient-data states with
method version `0.1` and decimal string calculations.

## Capability boundaries

- Synthetic values are illustrative and do not establish sector or national
  conditions.
- Live provider access, coverage, and currency comparability remain bounded by
  the persisted dataset contract.
- Public BPS context is displayed as `not_comparable` until a reviewed mapping
  says otherwise; the reviewed mapping currently remains not comparable.
- Investigation orchestration, tool scope, budgets, cancellation, fallback,
  and persistence contracts are implemented. A real model-backed investigation
  requires starting Ollama locally and selecting an installed model; this
  handoff does not claim that a model is installed or that a live run succeeded.
- Hosted authentication, adjacent-period persistence, and export remain future
  hardening work.

## Handoff checklist

1. Keep `.env.local` untracked and credentials out of screenshots/logs.
2. Label every synthetic screen and fixture as synthetic.
3. Record the commit, Node version, route tested, and database mode in any demo
   report.
4. Do not report latency, provider coverage, or model quality without measuring
   them in the declared environment.
