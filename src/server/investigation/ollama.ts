import type { LlmProvider, LlmRequest, LlmResponse } from "./llm";

export function createOllamaProvider(config: Readonly<{ model: string; endpoint?: string; timeoutMs?: number }>): LlmProvider {
  if (!config.model.trim()) throw new Error("LLM_PROVIDER_NOT_CONFIGURED");
  const endpoint = config.endpoint ?? "http://127.0.0.1:11434/api/chat";
  const url = new URL(endpoint);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("OLLAMA_ENDPOINT_INVALID");
  return {
    complete: async ({ system, user, signal }: LlmRequest): Promise<LlmResponse> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 120_000);
      const onAbort = () => controller.abort();
      signal?.addEventListener("abort", onAbort, { once: true });
      try {
        const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: config.model, stream: false, options: { temperature: 0 }, messages: [{ role: "system", content: system }, { role: "user", content: user }] }), signal: controller.signal });
        if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}`);
        const payload: unknown = await response.json();
        const text = (payload as { message?: { content?: unknown } })?.message?.content;
        if (typeof text !== "string" || !text.trim()) throw new Error("LLM_INVALID_RESPONSE");
        return { text, provider: "ollama", model: config.model };
      } finally { clearTimeout(timer); signal?.removeEventListener("abort", onAbort); }
    },
  };
}
