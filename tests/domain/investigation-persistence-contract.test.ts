import { describe, expect, it } from "vitest";
import { appendInvestigationEvent } from "../../src/server/repositories/investigations";

describe("investigation persistence contract", () => {
  it("rejects invalid event sequence before writing", async () => {
    const pool = { query: async () => { throw new Error("should not write"); } } as never;
    await expect(appendInvestigationEvent(pool, "run", { type: "started", at: new Date().toISOString(), message: "started" }, 0)).rejects.toThrow("INVALID_EVENT_SEQUENCE");
  });
});
