CREATE TABLE public_indicator (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, definition TEXT NOT NULL,
  source_url TEXT NOT NULL CHECK (source_url ~ '^https://'), publisher TEXT NOT NULL,
  value NUMERIC, unit TEXT NOT NULL, geography TEXT NOT NULL, period_start DATE NOT NULL,
  period_end DATE NOT NULL, published_at TIMESTAMPTZ NOT NULL, retrieved_at TIMESTAMPTZ NOT NULL,
  snapshot_id UUID REFERENCES source_snapshot(id), revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  UNIQUE (source_url, period_start, period_end, revision)
);
CREATE TABLE indicator_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cohort_key TEXT NOT NULL,
  indicator_id UUID NOT NULL REFERENCES public_indicator(id),
  relation TEXT NOT NULL CHECK (relation IN ('aligned_direction','divergent_direction','not_comparable','unavailable')),
  rationale TEXT NOT NULL, reviewer TEXT, reviewed_at TIMESTAMPTZ, version TEXT NOT NULL,
  UNIQUE (cohort_key, indicator_id, version)
);
CREATE INDEX indicator_mapping_cohort_idx ON indicator_mapping (cohort_key, reviewed_at);
CREATE FUNCTION nadi_immutable_public_indicator() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'IMMUTABLE_PUBLIC_INDICATOR'; END; $$;
CREATE TRIGGER immutable_public_indicator BEFORE UPDATE OR DELETE ON public_indicator FOR EACH ROW EXECUTE FUNCTION nadi_immutable_public_indicator();
CREATE TRIGGER immutable_indicator_mapping BEFORE UPDATE OR DELETE ON indicator_mapping FOR EACH ROW EXECUTE FUNCTION nadi_immutable_public_indicator();
INSERT INTO public_indicator (name,definition,source_url,publisher,value,unit,geography,period_start,period_end,published_at,retrieved_at,revision)
VALUES ('Quarterly GDP growth — Mining and Quarrying','Quarter-on-quarter growth of GDP by production industry at national level.','https://www.bps.go.id/id/pressrelease/2026/05/05/2575/ekonomi-indonesia-triwulan-i-2026','Badan Pusat Statistik (BPS - Statistics Indonesia)',-8.20,'percent_qoq','Indonesia','2026-01-01','2026-03-31','2026-05-05T00:00:00Z',now(),1);
INSERT INTO indicator_mapping (cohort_key,indicator_id,relation,rationale,version)
SELECT 'energy-coal',id,'not_comparable','Corporate company signals and the national Mining and Quarrying GDP series differ in population, geography, definitions, and measurement; reviewer confirmation is required before a directional comparison is shown.','0.1'
FROM public_indicator WHERE source_url='https://www.bps.go.id/id/pressrelease/2026/05/05/2575/ekonomi-indonesia-triwulan-i-2026';
