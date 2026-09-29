import { SectorsClient } from "../providers/sectors/client";

export type LiveIngestionConfig = Readonly<{
  apiKey: string;
  symbols: readonly string[];
  reportDate: string;
  quarters: number;
  creditCap?: number;
}>;

export type LiveSource = Readonly<{
  symbol: string;
  raw: string;
  requestPath: string;
  sourceUrl: string;
  retrievedAt: string;
}>;

export async function fetchLiveSources(config: LiveIngestionConfig): Promise<{ sources: readonly LiveSource[]; usage: Readonly<{ creditsUsed: number; creditCap: number }> }> {
  if (!config.apiKey.trim()) throw new Error("SECTORS_API_KEY_MISSING");
  if (config.symbols.length === 0 || config.symbols.length > 15) throw new Error("LIVE_SYMBOL_COUNT_MUST_BE_1_TO_15");
  if (!Number.isInteger(config.quarters) || config.quarters < 2 || config.quarters > 8) throw new Error("LIVE_QUARTER_COUNT_MUST_BE_2_TO_8");
  const client = new SectorsClient({ apiKey: config.apiKey, creditCap: config.creditCap ?? config.symbols.length * config.quarters, retries: 1 });
  const retrievedAt = new Date().toISOString();
  const sources: LiveSource[] = [];
  for (const symbol of config.symbols) {
    const response = await client.getQuarterlyFinancials(symbol, config.reportDate, config.quarters);
    const rows = response.data;
    const resolvedSymbol = rows[0]?.symbol;
    if (typeof resolvedSymbol !== "string" || rows.some((row) => row.symbol !== resolvedSymbol)) throw new Error("LIVE_SYMBOL_MISMATCH");
    const path = `/financials/quarterly/${resolvedSymbol}/`;
    sources.push({
      symbol: resolvedSymbol,
      raw: JSON.stringify(rows),
      requestPath: path,
      sourceUrl: `https://api.sectors.app/v2${path}`,
      retrievedAt,
    });
  }
  return { sources, usage: client.usage };
}

export function parseLiveSymbols(value: string | undefined): string[] {
  return [...new Set((value ?? "").split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))];
}
