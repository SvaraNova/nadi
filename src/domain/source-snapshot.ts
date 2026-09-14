import { createHash } from "node:crypto";
import type { DataMode } from "./persistence-contract";

export type SourceSnapshot = Readonly<{
  mode: DataMode;
  provider: string;
  requestPath: string;
  redactedParams: Readonly<Record<string, string>>;
  retrievedAt: string;
  sourceUrl: string;
  payloadHash: string;
  payload: string;
  schemaVersion: string;
}>;

type Input = Readonly<{
  mode: DataMode;
  provider: string;
  requestPath: string;
  params?: Readonly<Record<string, string>>;
  retrievedAt?: string;
  sourceUrl: string;
  payload: string;
  schemaVersion: string;
}>;

const secretKey = /authorization|api[-_]?key|token|secret|password/i;

export function createSourceSnapshot(input: Input): SourceSnapshot {
  if (!input.provider.trim() || !/^\/[^?#]*$/.test(input.requestPath) || !input.schemaVersion.trim()) {
    throw new Error("Invalid source snapshot identity");
  }
  const url = new URL(input.sourceUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("Source URL must use HTTPS without credentials, query or fragment");
  }
  const retrievedAt = input.retrievedAt ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(retrievedAt))) throw new Error("Invalid retrieval timestamp");
  const redactedParams = Object.fromEntries(Object.entries(input.params ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, secretKey.test(key) ? "[REDACTED]" : value]));
  return { mode: input.mode, provider: input.provider, requestPath: input.requestPath, redactedParams, retrievedAt, sourceUrl: input.sourceUrl, payloadHash: createHash("sha256").update(input.payload).digest("hex"), payload: input.payload, schemaVersion: input.schemaVersion };
}
