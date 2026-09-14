import { describe, expect, it } from "vitest";
import { SectorsClient, SectorsError } from "../../src/server/providers/sectors/client";

function response(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

describe("Sectors client", () => {
  it("uses the raw Authorization key, exact dates and a bounded credit ledger", async () => {
    const requests: { url: string; authorization: string }[] = [];
    const client = new SectorsClient({ apiKey: "secret-test-key", creditCap: 3, fetchImpl: async (input, init) => {
      requests.push({ url: String(input), authorization: String(new Headers(init?.headers).get("authorization")) });
      if (requests.length === 1) return response(200, { results: [{ symbol: "SYNT" }], pagination: { has_next: false } });
      if (requests.length === 2) return response(200, { "2026": [["2026-03-31", "q1"]] });
      return response(200, [{ symbol: "SYNT", date: "2026-03-31", revenue: 1 }]);
    }});
    const companies = await client.listCompanies({ where: "sector = 'Energy'", limit: 1 });
    await client.listFinancialDates("SYNT");
    const quarter = await client.getQuarterlyFinancials("SYNT", "2026-03-31");
    expect(companies.data).toHaveLength(1);
    expect(quarter.data[0].date).toBe("2026-03-31");
    expect(requests[0].authorization).toBe("secret-test-key");
    expect(requests[2].url).toContain("approx=false");
    expect(client.usage.creditsUsed).toBe(3);
    await expect(client.getQuarterlyFinancials("SYNT", "2026-06-30")).rejects.toMatchObject({ code: "CREDIT_CAP_EXCEEDED" });
  });

  it("paginates structured discovery and rejects repeated cursors", async () => {
    let calls = 0;
    const client = new SectorsClient({ apiKey: "x", creditCap: 3, fetchImpl: async () => {
      calls += 1;
      return response(200, { results: [{ symbol: `SYN${calls}` }], pagination: { has_next: calls < 2, next_offset: 1 } });
    }});
    expect((await client.listCompanies({ limit: 1 })).data).toHaveLength(2);
    const repeated = new SectorsClient({ apiKey: "x", creditCap: 3, fetchImpl: async () => response(200, { results: [], pagination: { has_next: true, next_offset: 0 } }) });
    await expect(repeated.listCompanies()).rejects.toMatchObject({ code: "REPEATED_CURSOR" });
  });

  it("retries 429/5xx, but stops authentication and malformed requests", async () => {
    let calls = 0;
    const client = new SectorsClient({ apiKey: "x", creditCap: 3, sleep: async () => undefined, fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? response(429, { error: "RATE_LIMIT_EXCEEDED" }) : response(200, { "2026": [] });
    }});
    await client.listFinancialDates("SYNT");
    expect(calls).toBe(2);
    const unauthorized = new SectorsClient({ apiKey: "x", fetchImpl: async () => response(403, { error: "blocked" }) });
    await expect(unauthorized.listFinancialDates("SYNT")).rejects.toMatchObject({ code: "AUTHENTICATION_ERROR", status: 403 });
    const invalid = new SectorsClient({ apiKey: "x", fetchImpl: async () => response(400, { error: "bad" }) });
    expect(() => invalid.getQuarterlyFinancials("SYNT", "2026-02-30")).toThrow(SectorsError);
  });

  it("caches identical requests without spending another credit", async () => {
    let calls = 0;
    const client = new SectorsClient({ apiKey: "x", creditCap: 1, fetchImpl: async () => { calls += 1; return response(200, { "2026": [] }); } });
    const first = await client.listFinancialDates("SYNT");
    const second = await client.listFinancialDates("synt");
    expect(calls).toBe(1);
    expect(second.cached).toBe(true);
    expect(second.payloadHash).toBe(first.payloadHash);
  });
});


describe("quarterly credit reservations", () => {
  it("rejects a multi-quarter request before transport when it cannot fit", async () => {
    let calls = 0;
    const client = new SectorsClient({ apiKey: "synthetic-test", creditCap: 5, fetchImpl: async () => {
      calls += 1;
      return response(200, []);
    }});
    await expect(client.getQuarterlyFinancials("SYNT", "2026-03-31", 6)).rejects.toMatchObject({ code: "CREDIT_CAP_EXCEEDED" });
    expect(calls).toBe(0);
    expect(client.usage.creditsUsed).toBe(0);
  });

  it("reserves requested quarters on every attempt and never exceeds the cap", async () => {
    let calls = 0;
    const client = new SectorsClient({ apiKey: "synthetic-test", creditCap: 5, sleep: async () => undefined, fetchImpl: async () => {
      calls += 1;
      return response(503, {});
    }});
    await expect(client.getQuarterlyFinancials("SYNT", "2026-03-31", 3)).rejects.toMatchObject({ code: "CREDIT_CAP_EXCEEDED" });
    expect(calls).toBe(1);
    expect(client.usage.creditsUsed).toBe(3);
  });

  it("keeps conservative reservations for partial results and charges no cache credits", async () => {
    let calls = 0;
    const client = new SectorsClient({ apiKey: "synthetic-test", creditCap: 6, fetchImpl: async () => {
      calls += 1;
      return response(200, [{ date: "2026-03-31" }]);
    }});
    await client.getQuarterlyFinancials("SYNT", "2026-03-31", 6);
    expect((await client.getQuarterlyFinancials("SYNT", "2026-03-31", 6)).cached).toBe(true);
    expect(calls).toBe(1);
    expect(client.usage.creditsUsed).toBe(6);
  });
});
