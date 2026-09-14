ALTER TABLE observation ADD COLUMN content_hash CHAR(64);
CREATE UNIQUE INDEX observation_content_idx ON observation(content_hash);
ALTER TABLE dataset ADD COLUMN manifest JSONB;
CREATE TABLE job_dataset (
  job_id UUID PRIMARY KEY REFERENCES job(id),
  dataset_id UUID NOT NULL REFERENCES dataset(id)
);

-- Called by the trusted ingestion worker, in the source-write/completion transaction.
CREATE FUNCTION nadi_store_observation(p_job UUID, p_token UUID, p_source UUID, p_symbol TEXT, p_row JSONB)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE snapshot source_snapshot; company_id_value UUID; obs_id UUID;
  content_hash_value TEXT; revision_value INTEGER; raw_value JSONB;
BEGIN
  PERFORM 1 FROM job WHERE id = p_job AND status = 'running' AND lease_token = p_token
    AND lease_expires_at > clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STALE_LEASE'; END IF;
  SELECT s.* INTO STRICT snapshot FROM source_snapshot s JOIN job_source js ON js.source_snapshot_id = s.id
    WHERE s.id = p_source AND js.job_id = p_job;
  IF p_symbol IS NULL OR p_symbol = '' OR jsonb_typeof(p_row) IS DISTINCT FROM 'object'
    OR p_row->>'metric' IS NULL OR p_row->>'metric' NOT IN
    ('revenue','operating_pnl','operating_cash_flow','total_debt','total_assets')
    OR COALESCE(p_row->>'sourcePointer','') !~ '^/[0-9]+/(revenue|operating_pnl|operating_cash_flow|total_debt|total_assets)$' THEN
    RAISE EXCEPTION 'INVALID_OBSERVATION';
  END IF;
  IF split_part(p_row->>'sourcePointer','/',3) IS DISTINCT FROM p_row->>'metric' THEN
    RAISE EXCEPTION 'SOURCE_METRIC_MISMATCH';
  END IF;
  IF p_row->>'metric' IN ('total_debt','total_assets') AND p_row->>'basis' IS DISTINCT FROM 'point_in_time' THEN
    RAISE EXCEPTION 'INVALID_STOCK_BASIS';
  END IF;
  IF p_row->>'qualityStatus' = 'valid' AND (p_row->>'value' IS NULL OR p_row->>'unit' IS NULL OR p_row->>'currency' IS NULL
    OR p_row->>'basis' IS NULL OR p_row->>'basis' = 'unknown') THEN RAISE EXCEPTION 'INVALID_VALID_OBSERVATION'; END IF;
  raw_value := snapshot.payload #> string_to_array(substr(p_row->>'sourcePointer',2), '/');
  IF p_row->>'value' IS NOT NULL AND (raw_value IS NULL OR raw_value = 'null'::jsonb
    OR (raw_value #>> '{}')::numeric IS DISTINCT FROM (p_row->>'value')::numeric) THEN
    RAISE EXCEPTION 'SOURCE_VALUE_MISMATCH';
  END IF;
  IF snapshot.payload #>> ARRAY[split_part(p_row->>'sourcePointer','/',2),'date']
    IS DISTINCT FROM p_row->>'periodEnd' THEN RAISE EXCEPTION 'SOURCE_PERIOD_MISMATCH'; END IF;
  IF snapshot.payload #>> ARRAY[split_part(p_row->>'sourcePointer','/',2),'symbol']
    IS DISTINCT FROM p_symbol THEN RAISE EXCEPTION 'SOURCE_SYMBOL_MISMATCH'; END IF;
  INSERT INTO company(provider,provider_symbol,canonical_symbol,name)
    VALUES(snapshot.provider,p_symbol,upper(p_symbol),p_symbol) ON CONFLICT DO NOTHING;
  -- Serializes revision allocation for the same company.
  SELECT id INTO STRICT company_id_value FROM company WHERE provider=snapshot.provider
    AND provider_symbol=p_symbol FOR UPDATE;
  content_hash_value := encode(digest(jsonb_build_object('source',p_source,'company',company_id_value,'row',p_row)::text,'sha256'),'hex');
  SELECT id INTO obs_id FROM observation WHERE content_hash=content_hash_value;
  IF obs_id IS NOT NULL THEN RETURN obs_id; END IF;
  SELECT COALESCE(max(revision),0)+1 INTO revision_value FROM observation
    WHERE company_id=company_id_value AND metric=p_row->>'metric'
      AND period_end=(p_row->>'periodEnd')::date AND basis=(p_row->>'basis')::nadi_basis;
  INSERT INTO observation(company_id,metric,decimal_value,unit,currency,period_start,period_end,basis,
    source_snapshot_id,source_pointer,quality_status,revision,content_hash)
    VALUES(company_id_value,p_row->>'metric',(p_row->>'value')::numeric,p_row->>'unit',p_row->>'currency',
      (p_row->>'periodStart')::date,(p_row->>'periodEnd')::date,(p_row->>'basis')::nadi_basis,
      p_source,p_row->>'sourcePointer',(p_row->>'qualityStatus')::nadi_quality_status,revision_value,content_hash_value)
    RETURNING id INTO obs_id;
  RETURN obs_id;
END;
$$;

CREATE FUNCTION nadi_publish_dataset(p_job UUID,p_token UUID,p_ids UUID[],p_scope JSONB)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE active job; sorted_ids UUID[]; manifest_value JSONB; hash_value TEXT; dataset_id_value UUID;
BEGIN
  SELECT * INTO active FROM job WHERE id=p_job AND status='running' AND lease_token=p_token
    AND lease_expires_at>clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STALE_LEASE'; END IF;
  SELECT array_agg(DISTINCT id ORDER BY id) INTO sorted_ids FROM unnest(p_ids) id;
  IF sorted_ids IS NULL OR array_position(sorted_ids,NULL) IS NOT NULL
    OR jsonb_typeof(p_scope) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'INVALID_MANIFEST'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(sorted_ids) i LEFT JOIN observation o ON o.id=i
    LEFT JOIN source_snapshot s ON s.id=o.source_snapshot_id
    LEFT JOIN job_source js ON js.source_snapshot_id=s.id AND js.job_id=p_job
    WHERE o.id IS NULL OR js.job_id IS NULL OR s.mode::text IS DISTINCT FROM active.payload->>'mode') THEN
    RAISE EXCEPTION 'MANIFEST_LINEAGE_MISMATCH';
  END IF;
  manifest_value := jsonb_build_object('version','1','mode',active.payload->>'mode',
    'observationIds',to_jsonb(sorted_ids),'scope',p_scope);
  hash_value := encode(digest(manifest_value::text,'sha256'),'hex');
  INSERT INTO dataset(mode,manifest_hash,observation_ids,manifest,data_cutoff,completeness)
    SELECT (active.payload->>'mode')::nadi_mode,hash_value,to_jsonb(sorted_ids),manifest_value,
      max(s.retrieved_at),jsonb_build_object('observations',count(*),'valid',count(*) FILTER(WHERE o.quality_status='valid'))
      FROM observation o JOIN source_snapshot s ON s.id=o.source_snapshot_id WHERE o.id=ANY(sorted_ids)
    ON CONFLICT DO NOTHING RETURNING id INTO dataset_id_value;
  IF dataset_id_value IS NULL THEN SELECT id INTO STRICT dataset_id_value FROM dataset WHERE manifest_hash=hash_value; END IF;
  INSERT INTO job_dataset VALUES(p_job,dataset_id_value);
  PERFORM nadi_finish_job(p_job,p_token,'succeeded');
  RETURN dataset_id_value;
END;
$$;

CREATE FUNCTION nadi_immutable_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'IMMUTABLE_PROVENANCE'; END;
$$;
CREATE TRIGGER immutable_source BEFORE UPDATE OR DELETE ON source_snapshot FOR EACH ROW EXECUTE FUNCTION nadi_immutable_record();
CREATE TRIGGER immutable_observation BEFORE UPDATE OR DELETE ON observation FOR EACH ROW EXECUTE FUNCTION nadi_immutable_record();
CREATE TRIGGER immutable_dataset BEFORE UPDATE OR DELETE ON dataset FOR EACH ROW EXECUTE FUNCTION nadi_immutable_record();
