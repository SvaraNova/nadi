CREATE TYPE nadi_investigation_status AS ENUM ('running','completed','partial','cancelled','failed_validation');

CREATE TABLE investigation_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_run_id UUID NOT NULL REFERENCES signal_run(id),
  status nadi_investigation_status NOT NULL DEFAULT 'running',
  budget JSONB NOT NULL,
  brief JSONB,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE investigation_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_run_id UUID NOT NULL REFERENCES investigation_run(id) ON DELETE RESTRICT,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  type TEXT NOT NULL,
  tool TEXT,
  message TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (investigation_run_id, sequence)
);

CREATE FUNCTION nadi_immutable_investigation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'IMMUTABLE_INVESTIGATION'; END;
$$;
CREATE TRIGGER immutable_investigation_event BEFORE UPDATE OR DELETE ON investigation_event FOR EACH ROW EXECUTE FUNCTION nadi_immutable_investigation();
