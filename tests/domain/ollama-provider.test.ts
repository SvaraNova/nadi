import { describe, expect, it, vi } from "vitest";
import { createOllamaProvider } from "../../src/server/investigation/ollama";

describe("local Ollama provider", () => {
  it("uses the local chat endpoint and deterministic settings", async () => {
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toMatchObject({ model: "qwen2.5:7b", stream: false, options: { temperature: 0 } });
      return new Response(JSON.stringify({ message: { content: "local response" } }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(createOllamaProvider({ model: "qwen2.5:7b" }).complete({ system: "system", user: "question" })).resolves.toEqual({ text: "local response", provider: "ollama", model: "qwen2.5:7b" });
    expect(fetchMock).toHaveBeenCalledWith(new URL("http://127.0.0.1:11434/api/chat"), expect.anything());
    vi.unstubAllGlobals();
  });
});
