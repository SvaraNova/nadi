DO $$
DECLARE j UUID; claimed job; other_claim job; snapshot JSONB; s UUID; again UUID;
  raw_text TEXT := '[ {"date":"2026-03-31","revenue":123456789012345678.90} ]';
  rejects JSONB := '[{"index":0,"reason":"UNSAFE_NUMBER"}]';
  before_count INTEGER;
BEGIN
  j := nadi_enqueue_job('source:test', 'ingestion', '{"mode":"synthetic"}');
  SELECT * INTO claimed FROM nadi_claim_job('source-worker');
  IF claimed.id <> j THEN RAISE EXCEPTION 'Unexpected test job'; END IF;
  snapshot := jsonb_build_object('mode', 'synthetic', 'provider', 'synthetic',
    'requestPath', '/quarterly/SYNTHETIC-001/', 'redactedParams', '{"date":"2026-03-31"}'::jsonb,
    'retrievedAt', '2026-09-14T00:00:00Z', 'sourceUrl', 'https://example.test/quarterly/SYNTHETIC-001/',
    'schemaVersion', 'synthetic-v1', 'payload', raw_text,
    'payloadHash', encode(digest(convert_to(raw_text, 'UTF8'), 'sha256'), 'hex'));
  s := nadi_store_ingestion_source(j, claimed.lease_token, 'test-account', snapshot, rejects);
  again := nadi_store_ingestion_source(j, claimed.lease_token, 'test-account', snapshot, rejects);
  IF s <> again THEN RAISE EXCEPTION 'Duplicate snapshot'; END IF;
  IF (SELECT raw_payload FROM source_snapshot WHERE id = s) <> raw_text THEN RAISE EXCEPTION 'Lost raw bytes'; END IF;
  IF (SELECT payload->0->>'revenue' FROM source_snapshot WHERE id = s) <> '123456789012345678.90' THEN RAISE EXCEPTION 'Lost decimal precision'; END IF;
  IF (SELECT rejected_rows FROM job_source WHERE job_id = j AND source_snapshot_id = s) <> rejects THEN RAISE EXCEPTION 'Lost rejection reasons'; END IF;
  again := nadi_store_ingestion_source(j, claimed.lease_token, 'test-account', snapshot || '{"retrievedAt":"2026-09-15T00:00:00Z"}', rejects);
  IF again <> s OR (SELECT retrieved_at FROM source_snapshot WHERE id=s) <> '2026-09-14T00:00:00Z'::timestamptz THEN RAISE EXCEPTION 'Timestamp overwritten'; END IF;
  again := nadi_store_ingestion_source(j, claimed.lease_token, 'other-account', snapshot, rejects);
  IF again = s THEN RAISE EXCEPTION 'Account mixing'; END IF;
  again := nadi_store_ingestion_source(j, claimed.lease_token, 'test-account', snapshot || '{"redactedParams":{"date":"2026-06-30"}}', rejects);
  IF again = s THEN RAISE EXCEPTION 'Request mixing'; END IF;
  BEGIN
    PERFORM nadi_store_ingestion_source(j, claimed.lease_token, 'test-account', snapshot || '{"mode":"live"}', rejects);
    RAISE EXCEPTION 'Mode mismatch accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'MODE_MISMATCH' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM nadi_store_ingestion_source(j, claimed.lease_token, 'test-account', snapshot || '{"payloadHash":"bad"}', rejects);
    RAISE EXCEPTION 'Hash mismatch accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'PAYLOAD_HASH_MISMATCH' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM nadi_store_ingestion_source(j, claimed.lease_token, 'test-account', snapshot || '{"redactedParams":{"api_key":"synthetic-test-only"}}', rejects);
    RAISE EXCEPTION 'Secret accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'UNREDACTED_PARAMETER' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM nadi_store_ingestion_source(j, claimed.lease_token, 'test-account', snapshot, '[]');
    RAISE EXCEPTION 'Rejections changed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'REJECTION_CONFLICT' THEN RAISE; END IF;
  END;
  PERFORM nadi_finish_job(j, claimed.lease_token, 'succeeded');
  -- Synthetic bytes declared snapshot for a mode-isolation test only.
  j := nadi_enqueue_job('source:snapshot-mode', 'ingestion', '{"mode":"snapshot"}');
  SELECT * INTO other_claim FROM nadi_claim_job('snapshot-worker');
  again := nadi_store_ingestion_source(j, other_claim.lease_token, 'test-account', snapshot || '{"mode":"snapshot"}', rejects);
  IF again = s THEN RAISE EXCEPTION 'Snapshot/synthetic mixing'; END IF;
  PERFORM nadi_finish_job(j, other_claim.lease_token, 'succeeded');
  j := nadi_enqueue_job('source:rollback', 'ingestion', '{"mode":"synthetic"}');
  SELECT * INTO claimed FROM nadi_claim_job('stale-worker');
  SELECT count(*) INTO before_count FROM source_snapshot;
  BEGIN
    PERFORM nadi_store_ingestion_source(j, claimed.lease_token, 'rollback-account', snapshot, rejects);
    UPDATE job SET lease_expires_at = clock_timestamp() - interval '1 second' WHERE id = j;
    PERFORM nadi_finish_job(j, claimed.lease_token, 'succeeded');
    RAISE EXCEPTION 'Expired completion accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'STALE_LEASE' THEN RAISE; END IF;
  END;
  IF (SELECT count(*) FROM source_snapshot) <> before_count OR EXISTS(SELECT 1 FROM job_source WHERE job_id=j) THEN RAISE EXCEPTION 'Partial snapshot committed'; END IF;
  PERFORM nadi_cancel_job(j);
END;
$$;
