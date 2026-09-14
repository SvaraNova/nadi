import { createHash } from "node:crypto";

const BASE_URL = "https://api.sectors.app/v2";
const SYMBOL_PATTERN = /^[A-Za-z]{4}(?:\.[Jj][Kk])?$/;

export type CompanyQuery = Readonly<{
  where?: string;
  orderBy?: string;
  limit?: number;
  offset?: number;
  includeQueryValues?: boolean;
}>;

export type CompanyPage = Readonly<{
  results: readonly Record<string, unknown>[];
  pagination?: Readonly<{
    has_next?: boolean;
    next_offset?: number | null;
    total_count?: number;
  }>;
}>;

export type ProviderResponse<T> = Readonly<{
  data: T;
  raw: string;
  payloadHash: string;
  status: number;
  path: string;
  params: Readonly<Record<string, string>>;
  cached: boolean;
}>;

export class SectorsError extends Error {
  constructor(readonly code: string, readonly status?: number, message = code) {
    super(message);
    this.name = "SectorsError";
  }
}

type ClientOptions = Readonly<{
  apiKey: string;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  timeoutMs?: number;
  retries?: number;
  creditCap?: number;
  cacheTtlMs?: number;
  maxPages?: number;
}>;

function normalizeSymbol(symbol: string): string {
  if (!SYMBOL_PATTERN.test(symbol)) throw new SectorsError("INVALID_SYMBOL", 400, "Expected a four-letter IDX symbol");
  return symbol.toUpperCase();
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function stableParams(params: Readonly<Record<string, string>>): string {
  return Object.entries(params).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}

function retryDelay(headers: Headers): number {
  const value = headers.get("retry-after");
  if (!value) return 0;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? Math.max(0, Math.min(seconds * 1000, 20_000)) : 0;
}

export class SectorsClient {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly creditCap: number;
  private readonly cacheTtlMs: number;
  private readonly maxPages: number;
  private readonly cache = new Map<string, { expiresAt: number; response: ProviderResponse<unknown> }>();
  private creditsUsed = 0;

  constructor(private readonly options: ClientOptions) {
    if (!options.apiKey.trim()) throw new SectorsError("MISSING_API_KEY", 401);
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.retries = options.retries ?? 2;
    this.creditCap = options.creditCap ?? 20;
    this.cacheTtlMs = options.cacheTtlMs ?? 24 * 60 * 60 * 1000;
    this.maxPages = options.maxPages ?? 100;
    if (!Number.isInteger(this.retries) || this.retries < 0) throw new SectorsError("INVALID_RETRY_CONFIG");
    if (!Number.isSafeInteger(this.creditCap) || this.creditCap < 1) throw new SectorsError("INVALID_CREDIT_CAP");
  }

  get usage(): Readonly<{ creditsUsed: number; creditCap: number }> {
    return { creditsUsed: this.creditsUsed, creditCap: this.creditCap };
  }

  async listCompanies(query: CompanyQuery = {}): Promise<ProviderResponse<CompanyPage["results"]>> {
    let offset = query.offset ?? 0;
    const results: Record<string, unknown>[] = [];
    let lastResponse: ProviderResponse<CompanyPage> | undefined;
    const seenOffsets = new Set<number>();
    for (let page = 0; page < this.maxPages; page += 1) {
      if (seenOffsets.has(offset)) throw new SectorsError("REPEATED_CURSOR");
      seenOffsets.add(offset);
      lastResponse = await this.request<CompanyPage>("/companies/", {
        where: query.where ?? "",
        order_by: query.orderBy ?? "symbol",
        limit: String(query.limit ?? 100),
        offset: String(offset),
        include_query_values: String(query.includeQueryValues ?? true),
      });
      if (!Array.isArray(lastResponse.data.results)) throw new SectorsError("INVALID_COMPANIES_RESPONSE");
      results.push(...lastResponse.data.results);
      const pagination = lastResponse.data.pagination;
      if (!pagination?.has_next) break;
      if (!Number.isInteger(pagination.next_offset)) throw new SectorsError("MISSING_NEXT_CURSOR");
      offset = pagination.next_offset as number;
    }
    if (!lastResponse) throw new SectorsError("EMPTY_COMPANIES_RESPONSE");
    if (lastResponse.data.pagination?.has_next) throw new SectorsError("PAGE_LIMIT_EXCEEDED");
    return { ...lastResponse, data: results };
  }

  listFinancialDates(symbol: string): Promise<ProviderResponse<unknown>> {
    return this.request(`/company/get_quarterly_financial_dates/${normalizeSymbol(symbol)}/`, {});
  }

  getQuarterlyFinancials(symbol: string, reportDate: string, nQuarters = 1): Promise<ProviderResponse<readonly Record<string, unknown>[]>> {
    if (!validDate(reportDate)) throw new SectorsError("INVALID_REPORT_DATE", 400);
    if (!Number.isSafeInteger(nQuarters) || nQuarters < 1) throw new SectorsError("INVALID_QUARTER_COUNT", 400);
    return this.request(`/financials/quarterly/${normalizeSymbol(symbol)}/`, { report_date: reportDate, approx: "false", n_quarters: String(nQuarters) }, nQuarters);
  }

  private async request<T>(path: string, params: Readonly<Record<string, string>>, creditCost = 1): Promise<ProviderResponse<T>> {
    const key = `${path}?${stableParams(params)}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return { ...cached.response, cached: true } as ProviderResponse<T>;
    if (cached) this.cache.delete(key);
    if (creditCost > this.creditCap - this.creditsUsed) throw new SectorsError("CREDIT_CAP_EXCEEDED");
    const url = `${BASE_URL}${path}?${stableParams(params)}`;
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      if (creditCost > this.creditCap - this.creditsUsed) throw new SectorsError("CREDIT_CAP_EXCEEDED");
      this.creditsUsed += creditCost;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, { headers: { Authorization: this.options.apiKey, Accept: "application/json" }, signal: controller.signal });
        const raw = await response.text();
        if (response.status === 200) {
          let data: T;
          try { data = JSON.parse(raw) as T; } catch { throw new SectorsError("INVALID_JSON", response.status); }
          const result: ProviderResponse<T> = { data, raw, payloadHash: createHash("sha256").update(raw).digest("hex"), status: response.status, path, params, cached: false };
          this.cache.set(key, { expiresAt: Date.now() + this.cacheTtlMs, response: result });
          return result;
        }
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === this.retries) {
          const code = response.status === 401 || response.status === 403 ? "AUTHENTICATION_ERROR" : response.status === 404 ? "NOT_FOUND" : response.status === 400 ? "INVALID_REQUEST" : "PROVIDER_HTTP_ERROR";
          throw new SectorsError(code, response.status);
        }
        await this.sleep(retryDelay(response.headers));
      } catch (error) {
        lastError = error;
        if (error instanceof SectorsError && error.code !== "INVALID_JSON") {
          if (error.code === "AUTHENTICATION_ERROR" || error.code === "NOT_FOUND" || error.code === "INVALID_REQUEST" || error.code === "PROVIDER_HTTP_ERROR") throw error;
        }
        if (attempt === this.retries) throw error;
        await this.sleep(0);
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError instanceof Error ? lastError : new SectorsError("REQUEST_FAILED");
  }
}
