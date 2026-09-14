-- NADI Gate 1 persistence foundation, schema v0.1.
-- PostgreSQL only. Financial values remain NUMERIC; raw provider payloads are JSONB.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE nadi_mode AS ENUM ('live', 'snapshot', 'synthetic');
CREATE TYPE nadi_basis AS ENUM ('standalone_quarter', 'year_to_date', 'annual', 'point_in_time', 'unknown');
CREATE TYPE nadi_quality_status AS ENUM ('valid', 'missing', 'ambiguous_basis', 'invalid_unit', 'invalid_period', 'quarantined');
CREATE TYPE nadi_job_status AS ENUM ('queued', 'running', 'paused', 'succeeded', 'failed', 'cancelled');

CREATE TABLE company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_symbol TEXT NOT NULL,
  canonical_symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_symbol)
);

CREATE TABLE source_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode nadi_mode NOT NULL,
  provider TEXT NOT NULL,
  request_path TEXT NOT NULL,
  redacted_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  retrieved_at TIMESTAMPTZ NOT NULL,
  source_url TEXT NOT NULL,
  payload_hash CHAR(64) NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  payload JSONB NOT NULL,
  schema_version TEXT NOT NULL,
  UNIQUE (provider, request_path, payload_hash)
);

CREATE TABLE observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company(id),
  metric TEXT NOT NULL,
  decimal_value NUMERIC,
  unit TEXT,
  currency TEXT,
  period_start DATE,
  period_end DATE NOT NULL,
  basis nadi_basis NOT NULL,
  source_snapshot_id UUID NOT NULL REFERENCES source_snapshot(id),
  source_pointer TEXT NOT NULL,
  available_at TIMESTAMPTZ,
  quality_status nadi_quality_status NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, metric, period_end, basis, revision)
);

CREATE TABLE dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode nadi_mode NOT NULL,
  manifest_hash CHAR(64) NOT NULL CHECK (manifest_hash ~ '^[0-9a-f]{64}$'),
  observation_ids JSONB NOT NULL CHECK (jsonb_typeof(observation_ids) = 'array'),
  membership_snapshot_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_cutoff TIMESTAMPTZ,
  completeness JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (manifest_hash)
);

CREATE TABLE job (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status nadi_job_status NOT NULL DEFAULT 'queued',
  payload_hash CHAR(64) NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  idempotency_key TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  lease_owner TEXT,
  lease_expires_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_code TEXT,
  error_detail TEXT
);

CREATE TABLE job_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job(id) ON DELETE RESTRICT,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  safe_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (job_id, sequence)
);

CREATE INDEX observation_company_metric_period_idx ON observation (company_id, metric, period_end);
CREATE INDEX source_snapshot_retrieved_idx ON source_snapshot (retrieved_at);
CREATE INDEX job_claim_idx ON job (status, lease_expires_at, created_at);
CREATE INDEX job_event_job_sequence_idx ON job_event (job_id, sequence);

-- Source records and observations are provenance anchors. Retire them in a later
-- migration; deleting them must never break a published dataset or brief.
