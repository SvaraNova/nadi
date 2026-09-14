-- Existing runs have unknown reconstruction context; never infer it retroactively.
ALTER TABLE signal_run ADD COLUMN config_json JSONB;
