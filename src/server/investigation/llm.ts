export type LlmRequest = Readonly<{ system: string; user: string; signal?: AbortSignal }>;
export type LlmResponse = Readonly<{ text: string; provider: string; model: string }>;
export type LlmProvider = Readonly<{ complete(request: LlmRequest): Promise<LlmResponse> }>;

export function createHttpLlmProvider(config: Readonly<{ endpoint: string; apiKey: string; model: string; provider?: string; timeoutMs?: number }>): LlmProvider {
  const endpoint = new URL(config.endpoint);
  if (endpoint.protocol !== "https:") throw new Error("LLM_ENDPOINT_MUST_USE_HTTPS");
  if (!config.apiKey || !config.model) throw new Error("LLM_PROVIDER_NOT_CONFIGURED");
  return {
    complete: async ({ system, user, signal }) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 30_000);
      const onAbort = () => controller.abort();
      signal?.addEventListener("abort", onAbort, { once: true });
      try {
        const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify({ model: config.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0 }), signal: controller.signal });
        if (!response.ok) throw new Error(`LLM_PROVIDER_HTTP_${response.status}`);
        const payload: unknown = await response.json();
        const text = (payload as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
        if (typeof text !== "string" || !text.trim()) throw new Error("LLM_INVALID_RESPONSE");
        return { text, provider: config.provider ?? endpoint.hostname, model: config.model };
      } finally { clearTimeout(timeout); signal?.removeEventListener("abort", onAbort); }
    },
  };
}
