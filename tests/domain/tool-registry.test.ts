import { describe, expect, it } from "vitest";
import { createToolRegistry } from "../../src/server/investigation/tool-registry";

const context = { runId: "run-1", cohortId: "energy-coal" };
const tool = { name: "get_signal" as const, run: async () => ({ evidenceIds: ["e1"], summary: "signal loaded" }) };

describe("investigation tool registry", () => {
  it("allows only registered contract tools and preserves scope", async () => {
    const [registered] = createToolRegistry(context, [tool]);
    await expect(registered.run(context, context)).resolves.toEqual({ evidenceIds: ["e1"], summary: "signal loaded" });
    await expect(registered.run(context, { runId: "other", cohortId: context.cohortId })).rejects.toThrow("TOOL_SCOPE_MISMATCH");
  });
  it("rejects unknown and duplicate tools", () => {
    expect(() => createToolRegistry(context, [{ ...tool, name: "shell" as never }])).toThrow("TOOL_NOT_ALLOWED");
    expect(() => createToolRegistry(context, [tool, tool])).toThrow("DUPLICATE_TOOL");
  });
});
