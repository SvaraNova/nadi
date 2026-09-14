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
  if (!input.provider.trim() || !input.requestPath.startsWith("/")) throw new Error("Invalid source snapshot identity");
  if (!input.sourceUrl.startsWith("https://")) throw new Error("Source URL must use HTTPS");
  const retrievedAt = input.retrievedAt ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(retrievedAt))) throw new Error("Invalid retrieval timestamp");
  const redactedParams = Object.fromEntries(Object.entries(input.params ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, secretKey.test(key) ? "[REDACTED]" : value]));
  return { mode: input.mode, provider: input.provider, requestPath: input.requestPath, redactedParams, retrievedAt, sourceUrl: input.sourceUrl, payloadHash: createHash("sha256").update(input.payload).digest("hex"), payload: input.payload, schemaVersion: input.schemaVersion };
}
