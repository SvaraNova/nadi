import { describe, expect, it } from "vitest";
import { investigationFilename, renderInvestigationMarkdown } from "../../src/domain/investigation-export";
import type { InvestigationBrief } from "../../src/domain/investigation";

const brief: InvestigationBrief = { title: "Synthetic <brief>", runId: "run-1", cohortId: "cohort-1", dataMode: "synthetic", period: "2026-Q1", methodVersion: "0.1", summary: "A bounded result", claims: [{ kind: "limitation", text: "No live <finding>", evidenceIds: ["e1"], numericFacts: [] }], supportingEvidenceIds: ["e1"], contradictingEvidenceIds: [], dataGaps: ["Counterevidence not available"], publicComparison: "not_comparable", investigationQuestions: ["What next?"], limitations: ["Synthetic only"] };

describe("investigation export", () => {
  it("includes required scope and evidence sections without control characters", () => {
    const markdown = renderInvestigationMarkdown(brief, "2026-09-15T00:00:00Z\u0000");
    expect(markdown).toContain("Data mode: **SYNTHETIC**");
    expect(markdown).toContain("Supporting evidence: `e1`");
    expect(markdown).toContain("Counterevidence: None recorded.");
    expect(markdown).not.toContain("\u0000");
  });
  it("creates a safe contract filename", () => expect(investigationFilename("abc/../../def")).toBe("nadi-brief-abcdef.md"));
});
