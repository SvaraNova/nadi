import { describe, expect, it, vi } from "vitest";
import { createHttpLlmProvider } from "../../src/server/investigation/llm";

describe("provider-neutral LLM adapter", () => {
  it("requires HTTPS and returns only validated text", async () => {
    expect(() => createHttpLlmProvider({ endpoint: "http://localhost", apiKey: "x", model: "m" })).toThrow(/HTTPS/);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "validated" } }] }), { status: 200 })));
    await expect(createHttpLlmProvider({ endpoint: "https://llm.example.test/v1/chat", apiKey: "x", model: "m", provider: "test" }).complete({ system: "s", user: "u" })).resolves.toMatchObject({ text: "validated", provider: "test", model: "m" });
    vi.unstubAllGlobals();
  });
});
