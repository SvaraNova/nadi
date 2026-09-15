import { runInvestigation, type InvestigationBrief, type InvestigationEvent, type InvestigationStatus, type ToolContext } from "../../domain/investigation";
import { allowedInvestigationTools, type RegisteredTool } from "./tool-registry";
import { buildSectorSignalRuns, SECTOR_DEFINITIONS } from "../../domain/sectors-dataset";

export interface StoredInvestigationRecord {
  id: string;
  cohortId: string;
  signalRunId: string;
  question: string;
  status: InvestigationStatus;
  dataMode: "live" | "snapshot" | "synthetic";
  period: string;
  methodVersion: string;
  model: string;
  createdAt: string;
  finishedAt?: string;
  events: InvestigationEvent[];
  brief: InvestigationBrief | null;
  failureReason?: string;
}

// In-memory store for demonstrations and synthetic runs
const investigationStore = new Map<string, StoredInvestigationRecord>();

// Pre-populate with initial completed runs for demo richness
export function seedInvestigations() {
  if (investigationStore.size > 0) return;

  const energyCoal = buildSectorSignalRuns().find((s) => s.id === "energy-coal")!;
  const staples = buildSectorSignalRuns().find((s) => s.id === "consumer-staples")!;

  const seed1: StoredInvestigationRecord = {
    id: "inv-energy-coal-demo",
    cohortId: "energy-coal",
    signalRunId: energyCoal.runId,
    question: "What primarily drives the financial pressure in coal mining and quarrying?",
    status: "completed",
    dataMode: "synthetic",
    period: "Q1-2026 vs Q1-2025",
    methodVersion: "0.1",
    model: "Ollama (qwen2.5:7b-instruct)",
    createdAt: new Date(Date.now() - 3600_000 * 2).toISOString(),
    finishedAt: new Date(Date.now() - 3600_000 * 2 + 14000).toISOString(),
    events: [
      { type: "started", at: "2026-09-15T06:00:00Z", message: "Investigation initialized with pinned context energy-coal / Q1-2026." },
      { type: "tool_started", at: "2026-09-15T06:00:01Z", tool: "get_signal", message: "Inspecting cohort deterministic score and breadth." },
      { type: "tool_completed", at: "2026-09-15T06:00:02Z", tool: "get_signal", message: "Retrieved cohort signal: RISK (score: 75/100, risk breadth: 83%)." },
      { type: "tool_started", at: "2026-09-15T06:00:03Z", tool: "list_company_signals", message: "Retrieving constituent company results." },
      { type: "tool_completed", at: "2026-09-15T06:00:04Z", tool: "list_company_signals", message: "Retrieved 6 company signals: 5 showing revenue and margin decline." },
      { type: "tool_started", at: "2026-09-15T06:00:05Z", tool: "get_counterevidence", message: "Checking for contradicting companies or anomalous outperformers." },
      { type: "tool_completed", at: "2026-09-15T06:00:06Z", tool: "get_counterevidence", message: "Identified BUMI.JK with positive revenue growth (+2.17%) contradicting sector trend." },
      { type: "tool_started", at: "2026-09-15T06:00:07Z", tool: "compare_public_indicator", message: "Querying BPS Mining & Quarrying GDP series." },
      { type: "tool_completed", at: "2026-09-15T06:00:08Z", tool: "compare_public_indicator", message: "BPS Mining & Quarrying GDP recorded -8.20% QoQ (reviewed status: NOT COMPARABLE)." },
      { type: "progress", at: "2026-09-15T06:00:09Z", message: "Validating claims and numerical citations against immutable evidence IDs." },
      { type: "completed", at: "2026-09-15T06:00:10Z", message: "Investigation completed. Decision brief draft synthesized." },
    ],
    brief: {
      title: "Energy Coal Sector Financial Pressure Analysis (Q1-2026)",
      runId: energyCoal.runId,
      cohortId: "energy-coal",
      dataMode: "synthetic",
      period: "Q1-2026 vs Q1-2025",
      methodVersion: "0.1",
      summary:
        "The Indonesian coal mining sector exhibits pronounced financial pressure in Q1-2026 compared to Q1-2025, driven by falling export realization prices that contracted gross revenues and compressed operating margins across 83% of eligible constituents.",
      claims: [
        {
          kind: "observation",
          text: "Five out of six eligible coal producers experienced double-digit revenue contraction, led by AADI (-21.6%) and BYAN (-20.0%).",
          evidenceIds: ["EV-AADI.JK-REVENUE-2026Q1", "EV-BYAN.JK-REVENUE-2026Q1"],
          numericFacts: [
            { evidenceId: "EV-AADI.JK-REVENUE-2026Q1", fieldOrCalculation: "revenueGrowth", value: "-21.6", unit: "percent" },
            { evidenceId: "EV-BYAN.JK-REVENUE-2026Q1", fieldOrCalculation: "revenueGrowth", value: "-20.0", unit: "percent" },
          ],
        },
        {
          kind: "observation",
          text: "Operating profit margins deteriorated by an average of -3.8 percentage points across large-cap producers.",
          evidenceIds: ["EV-AADI.JK-OPERATINGPNL-2026Q1", "EV-ADRO.JK-OPERATINGPNL-2026Q1"],
          numericFacts: [
            { evidenceId: "EV-AADI.JK-OPERATINGPNL-2026Q1", fieldOrCalculation: "operatingMarginChange", value: "-3.8", unit: "percentage_points" },
          ],
        },
        {
          kind: "interpretation",
          text: "The synchronous margin compression points to global thermal coal benchmark normalization following 2024–2025 commodity peaks.",
          evidenceIds: ["EV-AADI.JK-REVENUE-2026Q1"],
          numericFacts: [],
        },
        {
          kind: "hypothesis",
          text: "Producers with higher strip ratios or reliance on sub-bituminous grades may face debt service pressure if cash generation does not rebound by H2-2026.",
          evidenceIds: ["EV-AADI.JK-TOTALDEBT-2026Q1"],
          numericFacts: [],
        },
        {
          kind: "limitation",
          text: "Analysis relies strictly on listed entity disclosures. Informal and domestic-oriented smallholder mines are not captured in IDX reporting.",
          evidenceIds: [],
          numericFacts: [],
        },
      ],
      supportingEvidenceIds: ["EV-AADI.JK-REVENUE-2026Q1", "EV-BYAN.JK-REVENUE-2026Q1", "EV-PTBA.JK-REVENUE-2026Q1", "EV-ADRO.JK-REVENUE-2026Q1", "EV-ITMG.JK-REVENUE-2026Q1"],
      contradictingEvidenceIds: ["EV-BUMI.JK-REVENUE-2026Q1"],
      dataGaps: ["Volume vs realization price split not separated in standardized provider feed."],
      publicComparison: "BPS Mining & Quarrying GDP contracted -8.20% QoQ, but remains classified as NOT COMPARABLE due to artisanal mine inclusion.",
      investigationQuestions: [
        "What portion of gross margin compression stems from royalties vs cash operating costs?",
        "Will domestic market obligation (DMO) quota compliance soften export price shocks?",
      ],
      limitations: [
        "Quarterly standalone figures derived via accounting date alignment.",
        "Listed company cohort represents export-oriented segment, not entire national mineral economy.",
      ],
    },
  };

  investigationStore.set(seed1.id, seed1);
}

export function listInvestigations(): StoredInvestigationRecord[] {
  seedInvestigations();
  return Array.from(investigationStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getInvestigation(id: string): StoredInvestigationRecord | null {
  seedInvestigations();
  return investigationStore.get(id) || null;
}

export function createInvestigation(cohortId: string, signalRunId: string, question: string): StoredInvestigationRecord {
  seedInvestigations();
  const id = `inv-${cohortId}-${Date.now().toString(36)}`;
  const record: StoredInvestigationRecord = {
    id,
    cohortId,
    signalRunId,
    question,
    status: "running",
    dataMode: "synthetic",
    period: "Q1-2026 vs Q1-2025",
    methodVersion: "0.1",
    model: "NADI Bounded Orchestrator (v0.1)",
    createdAt: new Date().toISOString(),
    events: [
      { type: "started", at: new Date().toISOString(), message: `Investigation initiated for cohort ${cohortId}. Question: "${question}"` },
    ],
    brief: null,
  };
  investigationStore.set(id, record);
  return record;
}

export async function executeInvestigation(id: string): Promise<StoredInvestigationRecord> {
  const inv = investigationStore.get(id);
  if (!inv) throw new Error("INVESTIGATION_NOT_FOUND");
  if (inv.status !== "running") return inv;

  const sector = buildSectorSignalRuns().find((s) => s.id === inv.cohortId) || buildSectorSignalRuns()[0];
  const sectorDef = SECTOR_DEFINITIONS.find((s) => s.id === sector.id) || SECTOR_DEFINITIONS[0];

  const tools: RegisteredTool[] = [
    {
      name: "get_signal",
      run: async (ctx) => ({
        evidenceIds: [`sig-${ctx.cohortId}`],
        summary: `Retrieved deterministic signal for ${sector.name}: ${sector.cohortSignal.label.toUpperCase()} (Coverage: ${sector.cohortSignal.coverage}).`,
      }),
    },
    {
      name: "list_company_signals",
      run: async () => ({
        evidenceIds: sectorDef.companies.map((c) => `EV-${c.symbol}-REVENUE-2026Q1`),
        summary: `Inspected ${sectorDef.companies.length} constituent companies. Dominant driver: ${sector.dominantDriver}.`,
      }),
    },
    {
      name: "get_counterevidence",
      run: async () => ({
        evidenceIds: [`EV-${sectorDef.companies[sectorDef.companies.length - 1].symbol}-REVENUE-2026Q1`],
        summary: `Evaluated counter-signal: ${sector.counterSignalSummary}.`,
      }),
    },
    {
      name: "compare_public_indicator",
      run: async () => ({
        evidenceIds: ["BPS-GDP-MINING-2026Q1"],
        summary: "Public BPS comparison checked. Status: NOT COMPARABLE per methodological governance.",
      }),
    },
  ];

  const toolContext: ToolContext = {
    runId: inv.signalRunId,
    cohortId: inv.cohortId,
  };

  const res = await runInvestigation(
    toolContext,
    tools,
    () => ({
      title: `Economic Shift Investigation: ${sector.name}`,
      runId: inv.signalRunId,
      cohortId: inv.cohortId,
      dataMode: "synthetic",
      period: "Q1-2026 vs Q1-2025",
      methodVersion: "0.1",
      summary: `Investigation completed for analyst inquiry: "${inv.question}". Analysis indicates the cohort exhibits a ${sector.cohortSignal.label} signal with ${Math.round(Number(sector.cohortSignal.riskBreadth || sector.cohortSignal.opportunityBreadth || 0) * 100)}% breadth.`,
      claims: [
        {
          kind: "observation",
          text: `Constituent disclosures verify ${sector.dominantDriver.toLowerCase()}.`,
          evidenceIds: [`EV-${sectorDef.companies[0].symbol}-REVENUE-2026Q1`],
          numericFacts: [
            { evidenceId: `EV-${sectorDef.companies[0].symbol}-REVENUE-2026Q1`, fieldOrCalculation: "revenueGrowth", value: "-21.6", unit: "percent" },
          ],
        },
        {
          kind: "interpretation",
          text: `The pattern indicates a structural shift across the industry cohort rather than an isolated firm-specific anomaly.`,
          evidenceIds: [`EV-${sectorDef.companies[0].symbol}-REVENUE-2026Q1`],
          numericFacts: [],
        },
        {
          kind: "hypothesis",
          text: `Persisting price adjustments may influence capital expenditure and corporate tax contributions across upcoming quarters.`,
          evidenceIds: [],
          numericFacts: [],
        },
        {
          kind: "limitation",
          text: `Public BPS indicator cannot be used for direct verification due to differing constituent populations and measurement definitions.`,
          evidenceIds: [],
          numericFacts: [],
        },
      ],
      supportingEvidenceIds: sectorDef.companies.slice(0, 4).map((c) => `EV-${c.symbol}-REVENUE-2026Q1`),
      contradictingEvidenceIds: [`EV-${sectorDef.companies[sectorDef.companies.length - 1].symbol}-REVENUE-2026Q1`],
      dataGaps: ["Operating cost disaggregation not available in standardized quarterly reporting feed."],
      publicComparison: "BPS Mining & Quarrying GDP: NOT COMPARABLE.",
      investigationQuestions: ["What are the implications for regional employment and domestic market obligations?"],
      limitations: ["Deterministic sample of IDX-listed entities."],
    }),
    {
      onEvent: (ev) => {
        inv.events.push(ev);
      },
    }
  );

  inv.status = res.status;
  inv.brief = res.brief;
  inv.finishedAt = new Date().toISOString();
  return inv;
}
