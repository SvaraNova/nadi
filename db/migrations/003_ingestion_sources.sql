-- Preserve original UTF-8 JSON and segregate source identity by mode/account/request.
-- Legacy rows retain NULL raw_payload; original bytes cannot be reconstructed.
ALTER TABLE source_snapshot
  DROP CONSTRAINT source_snapshot_provider_request_path_payload_hash_key,
  ADD COLUMN raw_payload TEXT,
  ADD COLUMN account_namespace TEXT,
  ADD COLUMN request_hash CHAR(64);
CREATE UNIQUE INDEX source_snapshot_request_content_idx ON source_snapshot
  (mode, provider, account_namespace, request_hash, schema_version, payload_hash);

CREATE TABLE job_source (
  job_id UUID NOT NULL REFERENCES job(id),
  source_snapshot_id UUID NOT NULL REFERENCES source_snapshot(id),
  rejected_rows JSONB NOT NULL CHECK (jsonb_typeof(rejected_rows) = 'array'),
  PRIMARY KEY (job_id, source_snapshot_id)
);

CREATE FUNCTION nadi_store_ingestion_source(
  p_job UUID, p_token UUID, p_namespace TEXT, p_snapshot JSONB,
  p_rejected_rows JSONB DEFAULT '[]'::jsonb
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE active_job job; source_id UUID; source_mode nadi_mode;
  raw_text TEXT; computed_hash TEXT; request_hash_value TEXT; previous_rejections JSONB;
BEGIN
  -- Lock ownership until transaction commit. Cancellation/reclaim cannot race output writes.
  SELECT * INTO active_job FROM job WHERE id = p_job FOR UPDATE;
  IF NOT FOUND OR active_job.status <> 'running'
     OR active_job.lease_token IS DISTINCT FROM p_token
     OR p_token IS NULL OR active_job.lease_expires_at IS NULL OR active_job.lease_expires_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'STALE_LEASE';
  END IF;
  IF p_namespace IS NULL OR length(trim(p_namespace)) = 0
     OR jsonb_typeof(p_snapshot) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_rejected_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'INVALID_SOURCE_INPUT';
  END IF;
  source_mode := (p_snapshot->>'mode')::nadi_mode;
  IF source_mode IS NULL OR active_job.payload->>'mode' IS DISTINCT FROM source_mode::text THEN
    RAISE EXCEPTION 'MODE_MISMATCH';
  END IF;
  IF jsonb_typeof(p_snapshot->'payload') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_snapshot->'redactedParams') IS DISTINCT FROM 'object'
     OR COALESCE(p_snapshot->>'provider', '') = ''
     OR COALESCE(p_snapshot->>'schemaVersion', '') = ''
     OR COALESCE(p_snapshot->>'requestPath', '') !~ '^/[^?#]*$'
     OR COALESCE(p_snapshot->>'sourceUrl', '') !~ '^https://[^/@?#]+/[^?#]*$'
     OR COALESCE(p_snapshot->>'retrievedAt', '') = '' THEN
    RAISE EXCEPTION 'INVALID_SOURCE_INPUT';
  END IF;
  -- Never accept credential parameters as stored request identity.
  IF EXISTS(SELECT 1 FROM jsonb_each_text(p_snapshot->'redactedParams')
    WHERE key ~* '(authorization|api[-_]?key|token|secret|password)'
      AND value IS DISTINCT FROM '[REDACTED]') THEN
    RAISE EXCEPTION 'UNREDACTED_PARAMETER';
  END IF;
  raw_text := p_snapshot->>'payload';
  computed_hash := encode(digest(convert_to(raw_text, 'UTF8'), 'sha256'), 'hex');
  IF computed_hash IS DISTINCT FROM p_snapshot->>'payloadHash' THEN
    RAISE EXCEPTION 'PAYLOAD_HASH_MISMATCH';
  END IF;
  request_hash_value := encode(digest(jsonb_build_object(
    'path', p_snapshot->>'requestPath', 'params', p_snapshot->'redactedParams',
    'url', p_snapshot->>'sourceUrl')::text, 'sha256'), 'hex');
  INSERT INTO source_snapshot(mode, provider, request_path, redacted_params,
      retrieved_at, source_url, payload_hash, payload, schema_version,
      raw_payload, account_namespace, request_hash)
    VALUES(source_mode, p_snapshot->>'provider', p_snapshot->>'requestPath',
      p_snapshot->'redactedParams', (p_snapshot->>'retrievedAt')::timestamptz,
      p_snapshot->>'sourceUrl', computed_hash, raw_text::jsonb,
      p_snapshot->>'schemaVersion', raw_text, p_namespace, request_hash_value)
    ON CONFLICT (mode, provider, account_namespace, request_hash, schema_version, payload_hash)
      DO NOTHING RETURNING id INTO source_id;
  IF source_id IS NULL THEN
    SELECT id INTO STRICT source_id FROM source_snapshot
      WHERE mode = source_mode AND provider = p_snapshot->>'provider'
        AND account_namespace = p_namespace AND request_hash = request_hash_value
        AND schema_version = p_snapshot->>'schemaVersion' AND payload_hash = computed_hash;
  END IF;
  INSERT INTO job_source(job_id, source_snapshot_id, rejected_rows)
    VALUES(p_job, source_id, p_rejected_rows) ON CONFLICT DO NOTHING;
  SELECT rejected_rows INTO previous_rejections FROM job_source
    WHERE job_id = p_job AND source_snapshot_id = source_id;
  IF previous_rejections IS DISTINCT FROM p_rejected_rows THEN
    RAISE EXCEPTION 'REJECTION_CONFLICT';
  END IF;
  RETURN source_id;
END;
$$;
