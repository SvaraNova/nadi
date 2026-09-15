import { describe, it, expect } from "vitest";
import { validateBriefCitations, renderBriefMarkdown, type DecisionBriefData } from "../../src/domain/brief";

describe("Decision Brief Domain Contract", () => {
  const sampleBrief: DecisionBriefData = {
    id: "brief-test-1",
    investigationId: "inv-1",
    title: "Coal Sector Shift Analysis",
    cohortId: "energy-coal",
    period: "Q1-2026 vs Q1-2025",
    dataMode: "synthetic",
    methodVersion: "0.1",
    datasetId: "ds-test-1",
    signalRunId: "run-test-1",
    status: "final",
    currentVersion: 1,
    analystQuestion: "What drives the decline?",
    executiveSummary: "Thermal coal export realizations fell.",
    analystNotes: "Policy briefing note.",
    scope: "6 listed Indonesian coal exporters",
    signalBreadth: "83% risk breadth",
    primaryDrivers: ["Falling revenue", "Operating margin compression"],
    findings: [
      {
        id: "f1",
        kind: "observation",
        statement: "AADI revenue contracted by -21.6%.",
        citations: ["EV-AADI-REV"],
      },
    ],
    counterevidenceSummary: "BUMI expanded revenue.",
    publicIndicatorContext: "BPS Mining GDP fell -8.2% (not comparable).",
    limitations: ["Listed universe only."],
    followUpQuestions: ["Check royalty impact."],
    evidenceRegister: [
      {
        id: "EV-AADI-REV",
        symbol: "AADI.JK",
        metric: "revenue",
        priorValue: "12500000",
        currentValue: "9800000",
        unit: "IDR thousands",
        calculation: "-21.6%",
        datasetId: "ds-test-1",
        sourcePointer: "/0/revenue",
      },
    ],
    createdAt: "2026-09-15T00:00:00Z",
    updatedAt: "2026-09-15T00:00:00Z",
    author: "policy-analyst",
  };

  it("validates that all citations are registered in the evidence register", () => {
    const res = validateBriefCitations(sampleBrief);
    expect(res.valid).toBe(true);
    expect(res.missingCitations).toEqual([]);
  });

  it("detects missing citations in findings", () => {
    const invalidBrief: DecisionBriefData = {
      ...sampleBrief,
      findings: [
        {
          id: "f2",
          kind: "observation",
          statement: "Unregistered claim.",
          citations: ["EV-UNKNOWN-999"],
        },
      ],
    };
    const res = validateBriefCitations(invalidBrief);
    expect(res.valid).toBe(false);
    expect(res.missingCitations).toContain("EV-UNKNOWN-999");
  });

  it("renders deterministic Markdown output without external calls", () => {
    const md = renderBriefMarkdown(sampleBrief);
    expect(md).toContain("# Coal Sector Shift Analysis");
    expect(md).toContain("`[EV-AADI-REV]`");
    expect(md).toContain("| `EV-AADI-REV` | AADI.JK | revenue |");
    expect(md).toContain("BPS Mining GDP fell -8.2%");
  });
});
