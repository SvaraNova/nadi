import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { aggregateCohortSignal, calculateCompanySignal, METHOD_VERSION, type CompanyPeriod, type CompanySignal } from "../../domain/signals";

const metrics = { revenue: "revenue", operatingPnl: "operating_pnl", operatingCashFlow: "operating_cash_flow", totalDebt: "total_debt", totalAssets: "total_assets" } as const;
type Observation = { id: string; company_id: string; symbol: string; metric: string; value: string | null; period: string; start: string | null; basis: string; quality_status: string; unit: string | null; currency: string | null; mode: string };

export async function persistSignalRun(pool: Pool, datasetId: string, target: string): Promise<string> {
  if (!/^\d{4}-(03-31|06-30|09-30|12-31)$/.test(target)) throw new Error("INVALID_TARGET_QUARTER");
  const prior = `${Number(target.slice(0, 4)) - 1}${target.slice(4)}`;
  const config = { methodVersion: METHOD_VERSION, target, prior, riskThresholds: [-10, -2, -3, 5], opportunityThresholds: [10, 2, 3, -5], companyWeight: 25, minimumCompanies: 5, minimumCoverage: "0.60", minimumBreadth: "0.60", inputPolicy: "standalone-quarter-same-currency-v1", persistence: "unavailable" };
  const hash = createHash("sha256").update(JSON.stringify(config)).digest("hex");
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    // Serialize publication so a repeated request observes a complete existing run.
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [`${datasetId}:${hash}`]);
    const dataset = (await db.query("SELECT mode,manifest,observation_ids FROM dataset WHERE id=$1", [datasetId])).rows[0];
    if (!dataset) throw new Error("DATASET_NOT_FOUND");
    const previous = (await db.query("SELECT id FROM signal_run WHERE dataset_id=$1 AND method_version=$2 AND config_hash=$3", [datasetId, METHOD_VERSION, hash])).rows[0];
    if (previous) { await db.query("COMMIT"); return previous.id; }
    const symbols: unknown = dataset.manifest?.scope?.symbols;
    if (!Array.isArray(symbols) || !symbols.length || symbols.some(s => typeof s !== "string") || new Set(symbols).size !== symbols.length) throw new Error("INVALID_DATASET_MEMBERSHIP");
    const observations = (await db.query<Observation>(`SELECT o.id,o.company_id,c.provider_symbol AS symbol,o.metric,o.decimal_value::text AS value,
      o.period_end::text AS period,o.period_start::text AS start,o.basis,o.quality_status,o.unit,o.currency,s.mode
      FROM observation o JOIN company c ON c.id=o.company_id JOIN source_snapshot s ON s.id=o.source_snapshot_id
      WHERE o.id=ANY($1::uuid[]) ORDER BY o.id`, [dataset.observation_ids])).rows;
    if (observations.length !== dataset.observation_ids.length || observations.some(o => o.mode !== dataset.mode || !symbols.includes(o.symbol))) throw new Error("DATASET_LINEAGE_MISMATCH");
    const results: { companyId: string; rows: Observation[]; result: CompanySignal }[] = [];
    for (const symbol of symbols) {
      const all = observations.filter(o => o.symbol === symbol);
      if (!all.length || new Set(all.map(o => o.company_id)).size !== 1) throw new Error("UNRESOLVED_COMPANY_MEMBERSHIP");
      const selected = all.filter(o => o.period === prior || o.period === target);
      const reasons: string[] = [];
      const makePeriod = (date: string): CompanyPeriod => {
        const period: CompanyPeriod = { revenue: null, operatingPnl: null, operatingCashFlow: null, totalDebt: null, totalAssets: null, basis: "standalone_quarter" };
        const values = { ...period };
        for (const [key, metric] of Object.entries(metrics) as [keyof typeof metrics, string][]) {
          const matches = selected.filter(o => o.period === date && o.metric === metric);
          if (matches.length !== 1) { reasons.push(`${date}_${metric}_${matches.length ? "ambiguous_revision" : "missing"}`); continue; }
          const row = matches[0];
          const stock = key === "totalDebt" || key === "totalAssets";
          const startMonth = String(Number(date.slice(5, 7)) - 2).padStart(2, "0");
          if (row.quality_status !== "valid" || row.basis !== (stock ? "point_in_time" : "standalone_quarter") || row.unit !== "currency" || !row.currency || (!stock && row.start !== `${date.slice(0, 4)}-${startMonth}-01`)) reasons.push(`${date}_${metric}_not_comparable`);
          values[key] = row.value;
        }
        return values;
      };
      const priorPeriod = makePeriod(prior), currentPeriod = makePeriod(target);
      if (new Set(selected.map(o => o.currency)).size !== 1) reasons.push("currency_mismatch");
      const calculated = calculateCompanySignal(currentPeriod, priorPeriod);
      const result: CompanySignal = reasons.length ? { eligible: false, features: null, riskScore: null, opportunityScore: null, riskVotes: 0, opportunityVotes: 0, exclusionReasons: [...new Set([...reasons, ...calculated.exclusionReasons])] } : calculated;
      results.push({ companyId: all[0].company_id, rows: selected, result });
    }
    const cohort = aggregateCohortSignal(results.map(r => r.result), symbols.length);
    const run = (await db.query("INSERT INTO signal_run(dataset_id,method_version,config_hash,status,cohort_result,config_json) VALUES($1,$2,$3,$4,$5,$6) RETURNING id", [datasetId, METHOD_VERSION, hash, cohort.label === "insufficient_data" ? "insufficient_data" : "succeeded", cohort, config])).rows[0];
    for (const company of results) {
      const id = (await db.query("INSERT INTO company_signal(signal_run_id,company_id,prior_observation_ids,current_observation_ids,result) VALUES($1,$2,$3,$4,$5) RETURNING id", [run.id, company.companyId, JSON.stringify(company.rows.filter(o => o.period === prior).map(o => o.id)), JSON.stringify(company.rows.filter(o => o.period === target).map(o => o.id)), company.result])).rows[0].id;
      for (const row of company.rows) await db.query("INSERT INTO signal_evidence(signal_run_id,company_signal_id,observation_id,role) VALUES($1,$2,$3,$4)", [run.id, id, row.id, row.period === prior ? "prior" : "current"]);
    }
    await db.query("COMMIT");
    return run.id;
  } catch (error) { await db.query("ROLLBACK"); throw error; }
  finally { db.release(); }
}
