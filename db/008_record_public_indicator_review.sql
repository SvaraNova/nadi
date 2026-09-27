-- Record the completed human review as a new immutable mapping version.
INSERT INTO indicator_mapping (cohort_key, indicator_id, relation, rationale, reviewer, reviewed_at, version)
SELECT 'energy-coal', id, 'not_comparable',
  'Reviewed: corporate company signals and the national Mining and Quarrying GDP series differ in population, geography, definitions, and measurement; no directional comparison is shown.',
  'fchyoga', '2026-09-14T08:39:13Z', '0.2'
FROM public_indicator
WHERE source_url = 'https://www.bps.go.id/id/pressrelease/2026/05/05/2575/ekonomi-indonesia-triwulan-i-2026'
ON CONFLICT (cohort_key, indicator_id, version) DO NOTHING;
