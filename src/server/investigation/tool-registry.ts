import type { InvestigationTool, ToolContext } from "../../domain/investigation";

export const allowedInvestigationTools = ["get_signal", "list_company_signals", "get_company_evidence", "get_counterevidence", "compare_public_indicator", "get_evidence"] as const;
export type InvestigationToolName = (typeof allowedInvestigationTools)[number];
export type RegisteredTool = InvestigationTool & Readonly<{ name: InvestigationToolName }>;

function assertScope(context: ToolContext, input: unknown): asserts input is { runId: string; cohortId: string } {
  if (!input || typeof input !== "object") throw new Error("INVALID_TOOL_INPUT");
  const value = input as Record<string, unknown>;
  if (value.runId !== context.runId || value.cohortId !== context.cohortId) throw new Error("TOOL_SCOPE_MISMATCH");
}

export function createToolRegistry(context: ToolContext, tools: readonly RegisteredTool[]): readonly InvestigationTool[] {
  const names = new Set<string>();
  return tools.map((tool) => {
    if (!allowedInvestigationTools.includes(tool.name)) throw new Error("TOOL_NOT_ALLOWED");
    if (names.has(tool.name)) throw new Error("DUPLICATE_TOOL");
    names.add(tool.name);
    return { name: tool.name, run: async (_context: ToolContext, input: unknown) => { assertScope(context, input); return tool.run(context, input); } };
  });
}
