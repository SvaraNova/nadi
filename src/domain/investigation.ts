export type InvestigationStatus = "running" | "completed" | "partial" | "cancelled" | "failed_validation";
export type InvestigationEvent = Readonly<{ type: "started" | "tool_started" | "tool_completed" | "progress" | "cancelled" | "completed" | "failed"; at: string; tool?: string; message: string }>;
export type EvidenceClaim = Readonly<{ kind: "observation" | "interpretation" | "hypothesis" | "limitation"; text: string; evidenceIds: readonly string[]; numericFacts: readonly { evidenceId: string; fieldOrCalculation: string; value: string; unit: string }[] }>;
export type InvestigationBrief = Readonly<{
  title: string; runId: string; cohortId: string; dataMode: "live" | "snapshot" | "synthetic"; period: string; methodVersion: string;
  summary: string; claims: readonly EvidenceClaim[]; supportingEvidenceIds: readonly string[]; contradictingEvidenceIds: readonly string[];
  dataGaps: readonly string[]; publicComparison: string; investigationQuestions: readonly string[]; limitations: readonly string[];
}>;
export type ToolContext = Readonly<{ runId: string; cohortId: string }>;
export type InvestigationTool = Readonly<{ name: string; run: (context: ToolContext, input: unknown) => Promise<{ evidenceIds: readonly string[]; summary: string }> }>;
export type InvestigationBudget = Readonly<{ maxToolCalls: number; deadlineMs: number }>;

const DEFAULT_BUDGET: InvestigationBudget = { maxToolCalls: 12, deadlineMs: 120_000 };

export function validateBrief(brief: InvestigationBrief, availableEvidenceIds: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  for (const field of ["title", "runId", "cohortId", "period", "methodVersion", "summary", "publicComparison"] as const) if (!brief[field].trim()) errors.push(`missing_${field}`);
  if (brief.runId.length === 0 || brief.cohortId.length === 0) errors.push("missing_scope");
  for (const claim of brief.claims) {
    if (!claim.text.trim()) errors.push("empty_claim");
    for (const id of claim.evidenceIds) if (!availableEvidenceIds.has(id)) errors.push(`unknown_evidence:${id}`);
    for (const fact of claim.numericFacts) {
      if (!availableEvidenceIds.has(fact.evidenceId)) errors.push(`unknown_numeric_evidence:${fact.evidenceId}`);
      if (!fact.value.trim() || !fact.unit.trim()) errors.push("invalid_numeric_fact");
    }
  }
  if (brief.contradictingEvidenceIds.length === 0 && !brief.dataGaps.some(gap => /contradict|counter|not available/i.test(gap))) errors.push("missing_contradiction_explanation");
  return [...new Set(errors)];
}

export function templateFallback(context: Readonly<{ runId: string; cohortId: string; dataMode: "live" | "snapshot" | "synthetic"; period: string; methodVersion: string }>, reason: string): InvestigationBrief {
  return { title: "Deterministic evidence brief", ...context, summary: "No model-generated interpretation is available. Review the persisted signal and cited evidence directly.", claims: [{ kind: "limitation", text: "Investigation fallback was used; no unsupported interpretation was generated.", evidenceIds: [], numericFacts: [] }], supportingEvidenceIds: [], contradictingEvidenceIds: [], dataGaps: [`fallback: ${reason}`, "Counterevidence was not queried."], publicComparison: "not_comparable", investigationQuestions: ["Which additional evidence could confirm or challenge this signal?"], limitations: ["This is a deterministic template, not an AI investigation."] };
}

export async function runInvestigation(
  context: ToolContext,
  tools: readonly InvestigationTool[],
  buildBrief: (results: readonly { tool: string; evidenceIds: readonly string[]; summary: string }[]) => InvestigationBrief,
  options: { budget?: Partial<InvestigationBudget>; signalContext?: Omit<InvestigationBrief, "summary" | "claims" | "supportingEvidenceIds" | "contradictingEvidenceIds" | "dataGaps" | "publicComparison" | "investigationQuestions" | "limitations" | "title">; onEvent?: (event: InvestigationEvent) => void; abortSignal?: AbortSignal } = {},
): Promise<{ status: InvestigationStatus; brief: InvestigationBrief; events: readonly InvestigationEvent[]; toolCalls: number }> {
  const budget = { ...DEFAULT_BUDGET, ...options.budget };
  const events: InvestigationEvent[] = [];
  const emit = (event: InvestigationEvent) => { events.push(event); options.onEvent?.(event); };
  const started = Date.now(); emit({ type: "started", at: new Date().toISOString(), message: "Investigation started" });
  const results: { tool: string; evidenceIds: readonly string[]; summary: string }[] = [];
  let status: InvestigationStatus = "completed";
  if (options.abortSignal?.aborted) {
    status = "cancelled";
    emit({ type: "cancelled", at: new Date().toISOString(), message: "Investigation cancelled" });
  }
  for (const tool of tools) {
    if (status === "cancelled") break;
    if (options.abortSignal?.aborted) { status = "cancelled"; emit({ type: "cancelled", at: new Date().toISOString(), message: "Investigation cancelled" }); break; }
    if (results.length >= budget.maxToolCalls || Date.now() - started >= budget.deadlineMs) { status = "partial"; emit({ type: "progress", at: new Date().toISOString(), message: "Investigation budget exhausted" }); break; }
    emit({ type: "tool_started", at: new Date().toISOString(), tool: tool.name, message: `Running ${tool.name}` });
    try { const result = await tool.run(context, { runId: context.runId, cohortId: context.cohortId }); results.push({ tool: tool.name, ...result }); emit({ type: "tool_completed", at: new Date().toISOString(), tool: tool.name, message: result.summary }); }
    catch (error) { status = "partial"; emit({ type: "failed", at: new Date().toISOString(), tool: tool.name, message: error instanceof Error ? error.message : "Tool failed" }); }
  }
  let brief: InvestigationBrief;
  if (status === "cancelled" || results.length === 0) brief = templateFallback(options.signalContext ?? { ...context, dataMode: "synthetic", period: "unknown", methodVersion: "unknown" }, status === "cancelled" ? "cancelled" : "no_tool_result");
  else brief = buildBrief(results);
  emit({ type: status === "completed" ? "completed" : "progress", at: new Date().toISOString(), message: status === "completed" ? "Investigation completed" : `Investigation ${status}` });
  return { status, brief, events, toolCalls: results.length };
}
