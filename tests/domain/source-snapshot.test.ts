import { describe, expect, it } from "vitest";
import { createSourceSnapshot } from "../../src/domain/source-snapshot";

describe("source snapshots", () => {
  it("hashes exact payload bytes and redacts credential-like parameters", () => {
    const snapshot = createSourceSnapshot({ mode: "snapshot", provider: "sectors", requestPath: "/financials/quarterly/AADI.JK/", params: { report_date: "2026-06-30", Authorization: "secret" }, retrievedAt: "2026-09-14T00:00:00.000Z", sourceUrl: "https://api.sectors.app/v2/financials/quarterly/AADI.JK/", payload: '{"revenue":"1"}', schemaVersion: "sectors-v2" });
    expect(snapshot.redactedParams).toEqual({ Authorization: "[REDACTED]", report_date: "2026-06-30" });
    expect(snapshot.payloadHash).toBe("5c04394138a7d69c817a0116c09cc634363810898152162b56a471ffc02d402a");
  });

  it("rejects non-HTTPS source URLs and invalid paths", () => {
    expect(() => createSourceSnapshot({ mode: "synthetic", provider: "x", requestPath: "bad", sourceUrl: "http://example.test", payload: "{}", schemaVersion: "1" })).toThrow();
  });
});
