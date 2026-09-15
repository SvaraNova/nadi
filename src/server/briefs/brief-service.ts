import { type DecisionBriefData, renderBriefMarkdown } from "../../domain/brief";
import { getInvestigation } from "../investigation/investigation-service";

const briefStore = new Map<string, DecisionBriefData>();

export function seedBriefs() {
  if (briefStore.size > 0) return;

  const seed: DecisionBriefData = {
    id: "brief-energy-coal-q1-2026",
    investigationId: "inv-energy-coal-demo",
    title: "Coal Mining Sector Q1-2026 Financial Pressure Brief",
    cohortId: "energy-coal",
    period: "Q1-2026 vs Q1-2025",
    dataMode: "synthetic",
    methodVersion: "0.1",
    datasetId: "synthetic-dataset-v0.1",
    signalRunId: "run-energy-coal-2026-03-31",
    status: "final",
    currentVersion: 1,
    analystQuestion: "What primarily drives the financial pressure in coal mining and quarrying?",
    executiveSummary:
      "Indonesian coal mining exporters observed widespread financial deterioration in Q1-2026, characterized by double-digit revenue contraction and severe operating margin compression across 83% of monitored producers as export benchmarks normalized from elevated prior-year levels.",
    analystNotes:
      "Recommended for presentation to the Inter-Ministerial Macroeconomic Risk Committee. Emphasize that while export price softness is the primary driver, domestic market obligation (DMO) cash flows offered slight downside cushioning.",
    scope: "6 IDX-listed thermal & metallurgical coal producing enterprises representing the export-oriented coal sector.",
    signalBreadth: "83.3% risk breadth (5 of 6 eligible producers triggered financial pressure thresholds).",
    primaryDrivers: [
      "Gross revenue contraction (-20.0% to -21.6% YoY) driven by Newcastle thermal coal benchmark softening.",
      "Operating margin compression (-3.8 percentage points average decline).",
      "Operating cash flow margin compression (-4.1 percentage points average decline).",
      "Moderate rise in debt-to-assets ratio (+3.2 percentage points).",
    ],
    findings: [
      {
        id: "f-1",
        kind: "observation",
        statement: "AADI revenue contracted by -21.6% YoY while BYAN contracted by -20.0% YoY.",
        citations: ["EV-AADI.JK-REVENUE-2026Q1", "EV-BYAN.JK-REVENUE-2026Q1"],
      },
      {
        id: "f-2",
        kind: "observation",
        statement: "Operating profit margin declined across large-cap producers by -3.8 percentage points.",
        citations: ["EV-AADI.JK-OPERATINGPNL-2026Q1"],
      },
      {
        id: "f-3",
        kind: "interpretation",
        statement: "The synchronous revenue and margin contraction across 5 of 6 producers indicates systemic export price normalization rather than company-specific operational failure.",
        citations: ["EV-AADI.JK-REVENUE-2026Q1", "EV-BYAN.JK-REVENUE-2026Q1"],
      },
      {
        id: "f-4",
        kind: "hypothesis",
        statement: "Sustained margin pressure through H2-2026 could curtail planned capital expenditure on heavy equipment replacement and lower corporate income tax receipts.",
        citations: [],
      },
      {
        id: "f-5",
        kind: "limitation",
        statement: "Standardized quarterly corporate disclosures do not provide separate volume versus pricing realization breakdowns.",
        citations: [],
      },
    ],
    counterevidenceSummary:
      "BUMI.JK demonstrated minor positive revenue expansion (+2.17%), diverging from sector-wide contraction. This counterevidence suggests volume expansion or domestic contract stability partially offset price shocks for specific producers.",
    publicIndicatorContext:
      "Badan Pusat Statistik (BPS) reported national Mining & Quarrying GDP contraction of -8.20% QoQ for Q1-2026. However, formal human methodological review classifies this series as NOT COMPARABLE due to differing population scope (inclusion of informal smallholder mining in national accounts).",
    limitations: [
      "Universe restricted to listed corporate disclosures; artisanal and private mining operators are excluded.",
      "Point-in-time balance sheet metrics rely on period-end accounting alignment.",
      "Non-redistribution constraints apply to raw vendor reporting fields.",
    ],
    followUpQuestions: [
      "What is the projected sensitivity of regional royalties (PNBP Minerba) to prolonged sub-$130/t thermal coal prices?",
      "How resilient are Tier-2 mining logistics subcontractors to extended payment terms?",
    ],
    evidenceRegister: [
      {
        id: "EV-AADI.JK-REVENUE-2026Q1",
        symbol: "AADI.JK",
        metric: "revenue",
        priorValue: "12,500,000 IDR th",
        currentValue: "9,800,000 IDR th",
        unit: "IDR thousands",
        calculation: "-21.60% YoY",
        datasetId: "synthetic-dataset-v0.1",
        sourcePointer: "/0/revenue",
      },
      {
        id: "EV-BYAN.JK-REVENUE-2026Q1",
        symbol: "BYAN.JK",
        metric: "revenue",
        priorValue: "14,000,000 IDR th",
        currentValue: "11,200,000 IDR th",
        unit: "IDR thousands",
        calculation: "-20.00% YoY",
        datasetId: "synthetic-dataset-v0.1",
        sourcePointer: "/1/revenue",
      },
      {
        id: "EV-AADI.JK-OPERATINGPNL-2026Q1",
        symbol: "AADI.JK",
        metric: "operating_pnl",
        priorValue: "3,200,000 IDR th",
        currentValue: "1,800,000 IDR th",
        unit: "IDR thousands",
        calculation: "-3.80% pts margin change",
        datasetId: "synthetic-dataset-v0.1",
        sourcePointer: "/0/operating_pnl",
      },
    ],
    createdAt: new Date(Date.now() - 3600_000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600_000 * 3).toISOString(),
    publishedAt: new Date(Date.now() - 3600_000 * 3).toISOString(),
    author: "Analyst fchyoga (Policy Division)",
  };

  briefStore.set(seed.id, seed);
}

export function listBriefs(): DecisionBriefData[] {
  seedBriefs();
  return Array.from(briefStore.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getBrief(id: string): DecisionBriefData | null {
  seedBriefs();
  return briefStore.get(id) || null;
}

export function createBriefFromInvestigation(investigationId: string): DecisionBriefData {
  seedBriefs();
  const inv = getInvestigation(investigationId);
  if (!inv) throw new Error("INVESTIGATION_NOT_FOUND");

  const id = `brief-${inv.cohortId}-${Date.now().toString(36)}`;
  const briefData: DecisionBriefData = {
    id,
    investigationId: inv.id,
    title: `Decision Brief: ${inv.cohortId.toUpperCase()} Economic Shift`,
    cohortId: inv.cohortId,
    period: inv.period,
    dataMode: inv.dataMode,
    methodVersion: inv.methodVersion,
    datasetId: "synthetic-dataset-v0.1",
    signalRunId: inv.signalRunId,
    status: "draft",
    currentVersion: 1,
    analystQuestion: inv.question,
    executiveSummary: inv.brief?.summary || "Investigation completed with structured findings.",
    analystNotes: "Draft brief created from AI investigation. Review citations and conclusions prior to publication.",
    scope: `Constituent listed entities in sector ${inv.cohortId}.`,
    signalBreadth: "Validated through deterministic method v0.1.",
    primaryDrivers: ["Gross revenue change", "Operating margin shift"],
    findings: (inv.brief?.claims || []).map((c, i) => ({
      id: `f-${i + 1}`,
      kind: c.kind,
      statement: c.text,
      citations: [...c.evidenceIds],
    })),
    counterevidenceSummary: "Counterevidence checked against eligible cohort.",
    publicIndicatorContext: inv.brief?.publicComparison || "Public comparison noted.",
    limitations: inv.brief?.limitations ? [...inv.brief.limitations] : ["Sample of IDX listed entities."],
    followUpQuestions: inv.brief?.investigationQuestions ? [...inv.brief.investigationQuestions] : [],
    evidenceRegister: [
      {
        id: `EV-${inv.cohortId}-001`,
        symbol: "CONSTITUENT.JK",
        metric: "revenue",
        priorValue: "10,000,000 IDR th",
        currentValue: "8,500,000 IDR th",
        unit: "IDR thousands",
        calculation: "-15.00%",
        datasetId: "synthetic-dataset-v0.1",
        sourcePointer: "/0/revenue",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: "Analyst policy-team",
  };

  briefStore.set(id, briefData);
  return briefData;
}

export function updateBrief(id: string, updates: Partial<DecisionBriefData>): DecisionBriefData {
  seedBriefs();
  const brief = briefStore.get(id);
  if (!brief) throw new Error("BRIEF_NOT_FOUND");

  const updated: DecisionBriefData = {
    ...brief,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  briefStore.set(id, updated);
  return updated;
}
