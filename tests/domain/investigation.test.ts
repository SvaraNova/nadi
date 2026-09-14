import { describe, expect, it } from "vitest";
import { runInvestigation, templateFallback, validateBrief, type InvestigationBrief } from "../../src/domain/investigation";

const signal = { runId: "run-1", cohortId: "energy-coal", dataMode: "synthetic" as const, period: "2026-Q1", methodVersion: "0.1" };
const brief = (extra = {}) => ({ title: "Brief", ...signal, summary: "Summary", claims: [], supportingEvidenceIds: [], contradictingEvidenceIds: [], dataGaps: ["Counterevidence not available"], publicComparison: "not_comparable", investigationQuestions: ["What should be checked next?"], limitations: [], ...extra }) satisfies InvestigationBrief;

describe("bounded investigation contract", () => {
  it("rejects uncited evidence and requires a contradiction explanation", () => {
    expect(validateBrief(brief({ claims: [{ kind: "observation", text: "x", evidenceIds: ["missing"], numericFacts: [] }], dataGaps: [] }), new Set())).toEqual(["unknown_evidence:missing", "missing_contradiction_explanation"]);
  });
  it("emits progress and stops at the tool-call budget", async () => {
    const result = await runInvestigation({ runId: "run-1", cohortId: "energy-coal" }, [{ name: "get_signal", run: async () => ({ evidenceIds: [], summary: "loaded" }) }, { name: "get_counterevidence", run: async () => ({ evidenceIds: [], summary: "checked" }) }], () => brief(), { budget: { maxToolCalls: 1 }, signalContext: signal });
    expect(result.status).toBe("partial"); expect(result.toolCalls).toBe(1); expect(result.events.some(e => e.type === "tool_completed")).toBe(true);
  });
  it("returns deterministic fallback on cancellation", async () => {
    const controller = new AbortController(); controller.abort();
    const result = await runInvestigation({ runId: "run-1", cohortId: "energy-coal" }, [], () => brief(), { abortSignal: controller.signal, signalContext: signal });
    expect(result.status).toBe("cancelled"); expect(result.brief.limitations[0]).toMatch(/deterministic template/);
  });
  it("labels fallback output explicitly", () => expect(templateFallback(signal, "timeout").publicComparison).toBe("not_comparable"));
});
