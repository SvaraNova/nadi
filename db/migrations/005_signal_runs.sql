-- Gate 2 calculation outputs are immutable records tied to one dataset manifest.
CREATE TABLE signal_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES dataset(id),
  method_version TEXT NOT NULL,
  config_hash CHAR(64) NOT NULL CHECK (config_hash ~ '^[0-9a-f]{64}$'),
  status TEXT NOT NULL CHECK (status IN ('succeeded','insufficient_data','failed')),
  cohort_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dataset_id, method_version, config_hash)
);

CREATE TABLE company_signal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_run_id UUID NOT NULL REFERENCES signal_run(id),
  company_id UUID NOT NULL REFERENCES company(id),
  prior_observation_ids JSONB NOT NULL CHECK (jsonb_typeof(prior_observation_ids) = 'array'),
  current_observation_ids JSONB NOT NULL CHECK (jsonb_typeof(current_observation_ids) = 'array'),
  result JSONB NOT NULL,
  UNIQUE (signal_run_id, company_id)
);

CREATE TABLE signal_evidence (
  signal_run_id UUID NOT NULL REFERENCES signal_run(id),
  company_signal_id UUID REFERENCES company_signal(id),
  observation_id UUID NOT NULL REFERENCES observation(id),
  role TEXT NOT NULL CHECK (role IN ('prior','current')),
  PRIMARY KEY (signal_run_id, company_signal_id, observation_id, role)
);

CREATE FUNCTION nadi_immutable_signal_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'IMMUTABLE_SIGNAL_RESULT'; END;
$$;
CREATE TRIGGER immutable_signal_run BEFORE UPDATE OR DELETE ON signal_run FOR EACH ROW EXECUTE FUNCTION nadi_immutable_signal_result();
CREATE TRIGGER immutable_company_signal BEFORE UPDATE OR DELETE ON company_signal FOR EACH ROW EXECUTE FUNCTION nadi_immutable_signal_result();
CREATE TRIGGER immutable_signal_evidence BEFORE UPDATE OR DELETE ON signal_evidence FOR EACH ROW EXECUTE FUNCTION nadi_immutable_signal_result();
