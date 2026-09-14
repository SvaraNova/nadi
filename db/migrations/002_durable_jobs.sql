-- Durable job primitives. Existing jobs without payloads remain unclaimable.
ALTER TABLE job ADD COLUMN payload JSONB;
ALTER TABLE job ADD COLUMN lease_token UUID;

CREATE FUNCTION nadi_enqueue_job(p_key TEXT, p_type TEXT, p_payload JSONB)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE existing job; new_id UUID; body_hash TEXT;
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 OR p_type IS NULL
     OR length(trim(p_type)) = 0 OR p_payload IS NULL
     OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'INVALID_JOB_INPUT';
  END IF;
  body_hash := encode(digest(p_payload::text, 'sha256'), 'hex');
  INSERT INTO job(type, payload_hash, idempotency_key, payload)
    VALUES (p_type, body_hash, p_key, p_payload)
    ON CONFLICT (idempotency_key) DO NOTHING RETURNING id INTO new_id;
  IF new_id IS NOT NULL THEN
    INSERT INTO job_event(job_id, sequence, type, message)
      VALUES (new_id, 1, 'queued', 'Job queued');
    RETURN new_id;
  END IF;
  SELECT * INTO STRICT existing FROM job WHERE idempotency_key = p_key;
  IF existing.type <> p_type OR existing.payload_hash <> body_hash
     OR existing.payload IS DISTINCT FROM p_payload THEN
    RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT';
  END IF;
  RETURN existing.id;
END;
$$;

CREATE FUNCTION nadi_claim_job(p_owner TEXT, p_lease_seconds INTEGER DEFAULT 60)
RETURNS SETOF job LANGUAGE plpgsql AS $$
DECLARE claimed job; event_sequence INTEGER;
BEGIN
  IF p_owner IS NULL OR length(trim(p_owner)) = 0
     OR p_lease_seconds IS NULL OR p_lease_seconds < 1 OR p_lease_seconds > 3600 THEN
    RAISE EXCEPTION 'INVALID_LEASE';
  END IF;
  SELECT * INTO claimed FROM job
    WHERE payload IS NOT NULL AND (status = 'queued'
      OR (status = 'running' AND lease_expires_at <= clock_timestamp()))
    ORDER BY created_at, id FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE job SET status = 'running', attempts = attempts + 1,
    lease_owner = p_owner, lease_token = gen_random_uuid(),
    lease_expires_at = clock_timestamp() + make_interval(secs => p_lease_seconds),
    heartbeat_at = clock_timestamp(), started_at = COALESCE(started_at, clock_timestamp())
    WHERE id = claimed.id RETURNING * INTO claimed;
  SELECT COALESCE(max(sequence), 0) + 1 INTO event_sequence FROM job_event WHERE job_id = claimed.id;
  INSERT INTO job_event(job_id, sequence, type, message)
    VALUES (claimed.id, event_sequence, 'claimed', 'Job claimed');
  RETURN NEXT claimed;
END;
$$;

CREATE FUNCTION nadi_heartbeat_job(p_id UUID, p_token UUID, p_lease_seconds INTEGER DEFAULT 60)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF p_lease_seconds IS NULL OR p_lease_seconds < 1 OR p_lease_seconds > 3600 THEN
    RAISE EXCEPTION 'INVALID_LEASE';
  END IF;
  UPDATE job SET heartbeat_at = clock_timestamp(),
    lease_expires_at = clock_timestamp() + make_interval(secs => p_lease_seconds)
    WHERE id = p_id AND lease_token = p_token AND status = 'running'
      AND lease_expires_at > clock_timestamp();
  IF NOT FOUND THEN RAISE EXCEPTION 'STALE_LEASE'; END IF;
END;
$$;

-- Call completion within the SAME transaction as ingestion output writes.
-- STALE_LEASE must roll back the entire transaction, including those writes.
CREATE FUNCTION nadi_finish_job(p_id UUID, p_token UUID, p_status nadi_job_status)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE event_sequence INTEGER;
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('succeeded', 'failed') THEN
    RAISE EXCEPTION 'INVALID_TERMINAL_STATUS';
  END IF;
  PERFORM 1 FROM job WHERE id = p_id FOR UPDATE;
  UPDATE job SET status = p_status, finished_at = clock_timestamp(),
    lease_owner = NULL, lease_token = NULL, lease_expires_at = NULL
    WHERE id = p_id AND lease_token = p_token AND status = 'running'
      AND lease_expires_at > clock_timestamp();
  IF NOT FOUND THEN RAISE EXCEPTION 'STALE_LEASE'; END IF;
  SELECT COALESCE(max(sequence), 0) + 1 INTO event_sequence FROM job_event WHERE job_id = p_id;
  INSERT INTO job_event(job_id, sequence, type, message)
    VALUES (p_id, event_sequence, p_status::text, 'Job finished');
END;
$$;

CREATE FUNCTION nadi_cancel_job(p_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE event_sequence INTEGER;
BEGIN
  PERFORM 1 FROM job WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JOB_NOT_FOUND'; END IF;
  UPDATE job SET status = 'cancelled', finished_at = clock_timestamp(),
    lease_owner = NULL, lease_token = NULL, lease_expires_at = NULL
    WHERE id = p_id AND status IN ('queued', 'running', 'paused');
  IF NOT FOUND THEN RETURN; END IF;
  SELECT COALESCE(max(sequence), 0) + 1 INTO event_sequence FROM job_event WHERE job_id = p_id;
  INSERT INTO job_event(job_id, sequence, type, message)
    VALUES (p_id, event_sequence, 'cancelled', 'Job cancelled');
END;
$$;
