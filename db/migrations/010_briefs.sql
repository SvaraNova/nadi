-- SLC 4: Decision briefs and immutable brief versions
CREATE TABLE brief (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES investigation_run(id),
  cohort_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'reviewed', 'final')),
  current_version INTEGER NOT NULL DEFAULT 1 CHECK (current_version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE brief_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES brief(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  content JSONB NOT NULL,
  markdown_export TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brief_id, version_number)
);

CREATE INDEX brief_cohort_idx ON brief (cohort_id, status);
CREATE INDEX brief_version_lookup_idx ON brief_version (brief_id, version_number DESC);
