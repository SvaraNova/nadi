DO $$
DECLARE j UUID; same UUID; first_claim job; second_claim job; event_count INTEGER;
BEGIN
  j := nadi_enqueue_job('synthetic:operator:ingestion:1', 'ingestion', '{"mode":"synthetic","symbols":["SYNTHETIC-001"]}');
  same := nadi_enqueue_job('synthetic:operator:ingestion:1', 'ingestion', '{"symbols":["SYNTHETIC-001"],"mode":"synthetic"}');
  IF j <> same OR (SELECT count(*) FROM job) <> 1 THEN RAISE EXCEPTION 'Duplicate enqueue'; END IF;
  BEGIN
    PERFORM nadi_enqueue_job('synthetic:operator:ingestion:1', 'ingestion', '{"mode":"snapshot"}');
    RAISE EXCEPTION 'Conflict was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'IDEMPOTENCY_CONFLICT' THEN RAISE; END IF;
  END;
  SELECT * INTO first_claim FROM nadi_claim_job('worker-1');
  IF first_claim.id <> j OR first_claim.attempts <> 1 THEN RAISE EXCEPTION 'Invalid claim'; END IF;
  IF EXISTS(SELECT 1 FROM nadi_claim_job('worker-2')) THEN RAISE EXCEPTION 'Active lease stolen'; END IF;
  PERFORM nadi_heartbeat_job(j, first_claim.lease_token);
  UPDATE job SET lease_expires_at = clock_timestamp() - interval '1 second' WHERE id = j;
  SELECT * INTO second_claim FROM nadi_claim_job('worker-2');
  IF second_claim.id <> j OR second_claim.attempts <> 2 OR second_claim.lease_token = first_claim.lease_token THEN
    RAISE EXCEPTION 'Expired lease not recovered';
  END IF;
  BEGIN
    INSERT INTO company(provider, provider_symbol, canonical_symbol, name)
      VALUES ('synthetic', 'ROLLBACK-ONLY', 'ROLLBACK-ONLY', 'Synthetic rollback');
    PERFORM nadi_finish_job(j, first_claim.lease_token, 'succeeded');
    RAISE EXCEPTION 'Stale completion accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'STALE_LEASE' THEN RAISE; END IF;
  END;
  IF EXISTS(SELECT 1 FROM company WHERE provider_symbol = 'ROLLBACK-ONLY') THEN RAISE EXCEPTION 'Partial output committed'; END IF;
  BEGIN
    PERFORM nadi_heartbeat_job(j, first_claim.lease_token);
    RAISE EXCEPTION 'Stale heartbeat accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'STALE_LEASE' THEN RAISE; END IF;
  END;
  PERFORM nadi_finish_job(j, second_claim.lease_token, 'succeeded');
  IF EXISTS(SELECT 1 FROM nadi_claim_job('worker-3')) THEN RAISE EXCEPTION 'Terminal job reclaimed'; END IF;
  IF nadi_enqueue_job('synthetic:operator:ingestion:1', 'ingestion', first_claim.payload) <> j THEN RAISE EXCEPTION 'Terminal duplicate'; END IF;
  SELECT count(*) INTO event_count FROM job_event WHERE job_id = j;
  IF event_count <> 4 OR (SELECT max(sequence) FROM job_event WHERE job_id = j) <> 4 THEN RAISE EXCEPTION 'Event ordering'; END IF;
  j := nadi_enqueue_job('synthetic:cancel', 'ingestion', '{"mode":"synthetic"}');
  SELECT * INTO first_claim FROM nadi_claim_job('worker-1');
  PERFORM nadi_cancel_job(j);
  PERFORM nadi_cancel_job(j);
  BEGIN
    PERFORM nadi_finish_job(j, first_claim.lease_token, 'succeeded');
    RAISE EXCEPTION 'Cancelled completion accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'STALE_LEASE' THEN RAISE; END IF;
  END;
  IF (SELECT count(*) FROM job_event WHERE job_id = j) <> 3 THEN RAISE EXCEPTION 'Duplicate cancellation'; END IF;
  BEGIN
    PERFORM nadi_claim_job('worker', 0);
    RAISE EXCEPTION 'Zero lease accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'INVALID_LEASE' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM nadi_enqueue_job('', 'ingestion', '{}');
    RAISE EXCEPTION 'Empty key accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'INVALID_JOB_INPUT' THEN RAISE; END IF;
  END;
  j := nadi_enqueue_job('synthetic:failure', 'ingestion', '{"mode":"synthetic"}');
  SELECT * INTO first_claim FROM nadi_claim_job('worker-1');
  PERFORM nadi_finish_job(j, first_claim.lease_token, 'failed');
  IF EXISTS(SELECT 1 FROM nadi_claim_job('worker-1')) THEN RAISE EXCEPTION 'Failed job reclaimed'; END IF;
END;
$$;
