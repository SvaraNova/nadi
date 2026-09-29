import { Pool } from "pg";
import { NextResponse } from "next/server";
import { SECTOR_DEFINITIONS, type SectorSignalSummary } from "../../../../domain/sectors-dataset";
import type { CohortSignal } from "../../../../domain/signals";

export const dynamic = "force-dynamic";

interface RunRow {
  id: string;
  dataset_id: string;
  cohort_result: CohortSignal;
  config_json: { target?: string; name?: string } | null;
  method_version: string;
  manifest: { scope?: { symbols?: string[] } } | null;
}

function identifySector(symbols: string[]): (typeof SECTOR_DEFINITIONS)[number] | undefined {
  const set = new Set(symbols);
  let bestSector: (typeof SECTOR_DEFINITIONS)[number] | undefined;
  let maxMatches = 0;
  for (const s of SECTOR_DEFINITIONS) {
    const matches = s.companies.filter((c: { symbol: string }) => set.has(c.symbol)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestSector = s;
    }
  }
  return maxMatches >= 2 ? bestSector : undefined;
}

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ sectors: [] }, { status: 503 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const runs = await pool.query<RunRow>(`
      SELECT DISTINCT ON (sr.dataset_id)
        sr.id,
        sr.dataset_id,
        sr.cohort_result,
        sr.config_json,
        sr.method_version,
        d.manifest
      FROM signal_run sr
      JOIN dataset d ON d.id = sr.dataset_id
      WHERE d.mode = 'live'
      ORDER BY sr.dataset_id, sr.created_at DESC
    `);

    const seenCohortIds = new Set<string>();
    const matchedSectors: SectorSignalSummary[] = [];

    for (const row of runs.rows) {
      const rawSymbols = row.manifest?.scope?.symbols;
      const symbols = Array.isArray(rawSymbols)
        ? rawSymbols.filter((item): item is string => typeof item === "string")
        : [];
      const sectorDef = identifySector(symbols);
      const cohortId = sectorDef?.id ?? row.id;
      if (seenCohortIds.has(cohortId)) continue;
      seenCohortIds.add(cohortId);

      const target = String(row.config_json?.target ?? "2026-03-31");
      const name = sectorDef?.name ?? "Sektor Live Terpantau";
      const industry = sectorDef?.industry ?? "Sektor Finansial IDX";
      const description = sectorDef?.description ?? "Data sinyal keuangan terverifikasi dari keterbukaan Sectors API.";

      matchedSectors.push({
        id: cohortId,
        name,
        industry,
        description,
        runId: row.id,
        datasetId: row.dataset_id,
        period: target,
        signalRun: { datasetId: row.dataset_id, methodVersion: row.method_version, configHash: "", inputs: [], companySignals: {}, cohortSignal: row.cohort_result },
        cohortSignal: row.cohort_result,
        dominantDriver: row.cohort_result.label === "risk"
          ? "Tekanan pada marjin laba dan penurunan kas operasional"
          : row.cohort_result.label === "opportunity"
          ? "Ekspansi laba bersih dan penguatan arus kas"
          : row.cohort_result.label === "insufficient_data"
          ? "Sebagian emiten belum merilis laporan keuangan periode target"
          : "Kinerja seimbang di seluruh konstituen sektor",
        counterSignalSummary: "Tersedia data pembuktian di level emiten",
      });

      if (matchedSectors.length >= 5) break;
    }

    return NextResponse.json({ sectors: matchedSectors });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, sectors: [] }, { status: 500 });
  } finally {
    await pool.end();
  }
}
