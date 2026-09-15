# NADI — SLC Completion Plan

> **Status:** Implementation directive  
> **Project:** NADI — National Discovery Intelligence  
> **Repository:** `SvaraNova/nadi`  
> **Date:** 15 September 2026  
> **Target:** Complete the product through five Simple, Lovable, Complete vertical slices  
> **Audience:** Codex, Antigravity, Claude, contributors, reviewers, and the NADI team

---

## 0. Instruction to the implementation agent

Continue the existing NADI project. Do not redesign its positioning, replace its methodology, or restart the repository.

Before changing code:

1. Read `AGENTS.md`, `README.md`, every document under `docs/`, migrations, domain modules, server modules, application routes, tests, and CI configuration.
2. Run the existing verification suite and record the baseline.
3. Inspect the current database schema and reuse compatible tables, repositories, workers, provider clients, signal logic, investigation contracts, and export logic.
4. Create a gap map from this document to the actual repository state.
5. Implement the slices in order. Do not build a later slice by bypassing an unfinished dependency in an earlier slice.

This document supersedes the previous milestone-oriented implementation sequence only where the sequence differs. The original product concept and fixed decisions remain binding.

Do not:

- Reopen the target-user or product-positioning decision.
- Turn NADI into a stock screener, trading terminal, portfolio tool, or investment-advice product.
- Replace deterministic signal calculations with LLM judgments.
- present synthetic data as live data.
- Invent Sectors API semantics, availability, quotas, timestamps, accounting basis, or coverage.
- Hide missing data, rejected records, weak coverage, incompatible periods, or counterevidence.
- Put raw provider payloads or restricted data into the public repository.
- Build disconnected pages merely to satisfy a checklist.
- postpone visual design, interaction states, responsive behavior, accessibility, or error handling until the end.

When provider facts are uncertain, validate them against the current Sectors Financial API v2 documentation and actual authorized responses. Preserve explicit `synthetic`, `snapshot`, and `live` modes throughout storage, UI, API responses, investigations, and exports.

---

## 1. Product truth

### 1.1 What NADI is

NADI stands for **National Discovery Intelligence**.

NADI is an evidence-first economic intelligence workspace for Indonesian government policy analysts and economic-planning researchers. It uses observable changes among Indonesian listed companies to discover sector-level risks and opportunities before those patterns may become visible in slower aggregate statistics.

NADI does not claim that listed companies perfectly represent the national economy. It provides an additional, timely corporate-evidence layer that analysts can compare with official indicators and investigate further.

### 1.2 Core user

The primary user is an Indonesian government or public-policy analyst who must answer:

> Which economic sectors deserve attention now, what changed, how broadly is the pattern shared, what evidence supports it, what contradicts it, and what should be investigated next?

Secondary beneficiaries may include economic researchers and public institutions, but the product must be designed around the primary user above.

### 1.3 Product promise

> Discover the signal. Follow the evidence. Understand the shift.

NADI converts corporate observations into:

1. reproducible sector signals;
2. inspectable evidence;
3. bounded AI-assisted investigation;
4. traceable decision briefs.

### 1.4 Product boundary

NADI is not:

- a national-crisis prediction engine;
- a causal-policy simulator;
- a real-time trading system;
- an investment recommendation service;
- a generic chat interface;
- a decorative dashboard;
- a replacement for BPS, BI, OJK, ministries, or other official sources.

Its signal score is an experimental, versioned heuristic describing observed patterns. It is not a calibrated probability of crisis or growth.

---

## 2. Completion strategy: SLC, not MVP

SLC means **Simple, Lovable, Complete**.

- **Simple:** each slice solves one clear analyst job with restrained scope.
- **Lovable:** the workflow is understandable, visually intentional, fast, trustworthy, and satisfying to use.
- **Complete:** the workflow works end to end, persists its results, handles non-happy paths, and can be demonstrated without explaining unfinished gaps.

NADI will be completed through five vertical slices:

| Slice | Analyst outcome | Entry point | Final output |
|---|---|---|---|
| SLC 1 | Understand what deserves attention | Overview | Selected sector signal |
| SLC 2 | Verify why the signal exists | Signal detail | Evidence-backed understanding |
| SLC 3 | Investigate the pattern with bounded AI | Investigation workspace | Persisted investigation |
| SLC 4 | Produce a usable deliverable | Investigation | Versioned decision brief |
| SLC 5 | Trust and operate the system | Any workflow | Demo-ready, resilient product |

Each slice includes data, domain logic, API, UI, UX states, persistence, accessibility, responsive behavior, tests, and documentation. A slice is not complete when only its backend or happy-path screen exists.

---

## 3. Experience architecture

### 3.1 Primary navigation

Use one consistent application shell:

1. **Overview**
2. **Radar**
3. **Investigations**
4. **Briefs**
5. **Data & Method**

Company records, source evidence, calculation details, dataset runs, and tool events are contextual objects. They should open inside the relevant journey through pages, panels, drawers, or dialogs rather than overcrowding the main navigation.

### 3.2 Primary journey

```text
Overview
  → Sector Radar
    → Signal Detail
      → Investigation Workspace
        → Decision Brief
          → Export / Revisit
```

Every forward step must preserve:

- active data mode;
- dataset ID;
- signal-run ID;
- method version;
- period;
- cohort;
- coverage;
- source references.

Refreshing the underlying provider data must never silently change an existing investigation or brief. Existing artifacts stay pinned to their original immutable dataset and signal run.

### 3.3 Information hierarchy

The central product object is a **sector-level economic shift**, not a company score.

```text
Economic shift
├── sector/cohort pattern
├── deterministic signal
├── company evidence
├── public-indicator context
├── bounded investigation
└── decision brief
```

Company results are evidence explaining a broader pattern. Avoid UI language that makes NADI appear to recommend buying or selling a company.

---

## 4. Design system and UI direction

### 4.1 Character

The interface should feel:

- institutional without looking bureaucratic;
- modern without resembling a crypto dashboard;
- evidence-dense without feeling cluttered;
- calm, precise, and trustworthy;
- Indonesia-first without relying on decorative national motifs.

Light mode is the default. Dark mode may be supported later but must not block completion.

### 4.2 Foundation tokens

Define centralized tokens for:

- background, surface, elevated surface, and borders;
- primary deep forest green;
- opportunity emerald;
- pressure muted terracotta;
- uncertainty amber;
- neutral slate;
- text hierarchy;
- spacing;
- radius;
- shadow;
- typography;
- chart palette;
- focus ring;
- motion duration and easing.

Use tabular numerals for metrics. Use a highly readable sans-serif for UI. A restrained display or serif face may be used for major headings and exported briefs.

### 4.3 Shared components

Build reusable components before duplicating patterns:

- `AppShell`
- `Sidebar` / responsive navigation
- `TopBar`
- `DataModeBadge`
- `PeriodSelector`
- `CoverageBadge`
- `FreshnessIndicator`
- `SignalDirectionBadge`
- `MetricCard`
- `InsightCard`
- `ChartFrame`
- `FilterBar`
- `DataTable`
- `EmptyState`
- `ErrorState`
- `Skeleton`
- `EvidenceReference`
- `EvidenceDrawer`
- `MethodologyDrawer`
- `ConfirmationDialog`
- `Toast`

Do not overuse cards. Use charts for patterns, tables for exact values, prose for findings, and drawers for supporting detail.

### 4.4 Global states

Every screen must intentionally handle:

- initial loading;
- background refresh;
- empty result;
- insufficient data;
- partial failure;
- full failure;
- stale data;
- synthetic data;
- snapshot data;
- live data;
- unauthorized access where applicable;
- mobile and narrow screens;
- keyboard navigation;
- reduced motion.

Never render zero when the value is unknown. Use explicit labels such as `Unknown`, `Unavailable`, `Not comparable`, or `Insufficient evidence`.

---

# SLC 1 — Discover a Shift

## 5. Outcome

An analyst opens NADI and can immediately identify which sectors show meaningful pressure, opportunity, mixed movement, or insufficient evidence for a selected period.

## 5.1 User story

> As a policy analyst, I want to see the most important sector changes in the current dataset so that I know where to begin an investigation.

## 5.2 Screens

### A. Overview / National Pulse

Replace the current development homepage with a working product overview.

Required sections:

1. **Context header**
   - active period;
   - comparison period;
   - data mode;
   - latest successful dataset timestamp;
   - method version;
   - coverage summary.

2. **Priority summary**
   - strongest pressure signal;
   - strongest opportunity signal;
   - largest change from the adjacent comparable period;
   - number of sectors requiring attention;
   - number of sectors with insufficient evidence.

3. **Sector pulse visualization**
   - horizontal position: opportunity versus pressure;
   - bubble size: eligible companies or another explicitly labelled breadth measure;
   - color: signal state;
   - opacity or border treatment: coverage quality;
   - previous-position indicator when adjacent-period data exists;
   - accessible table alternative.

4. **What changed**
   - ranked sector shifts since the comparable period;
   - dominant driver;
   - breadth;
   - counter-signal;
   - direct link to signal detail.

5. **Recent work**
   - recent investigations;
   - recent briefs;
   - persisted status, not synthetic UI placeholders.

6. **Data-health strip**
   - freshness;
   - included and excluded companies;
   - rejected rows;
   - provider or ingestion warnings.

If adjacent-period comparison is unavailable, show a clear single-period overview and explain why change-over-time is unavailable.

### B. Sector Radar

Required controls:

- period selector;
- risk/opportunity/all toggle;
- sector and subsector filter;
- signal-state filter;
- minimum-coverage filter;
- search;
- sort by strength, breadth, change, freshness, or name;
- reset filters;
- shareable query parameters.

Required sector result:

- sector/cohort name;
- signal direction: pressure, opportunity, mixed, neutral, or insufficient;
- risk and opportunity score;
- breadth and eligible/total counts;
- dominant metrics;
- period;
- freshness;
- change from previous comparable run when available;
- warning state;
- `Open signal` action.

Support visual and table views using the same source data.

## 5.3 Data and domain work

- Add or verify a sector/cohort aggregation contract.
- Persist sector membership and classification from validated provider data.
- Never infer sector mapping from company names.
- Add adjacent-period comparison only when period and accounting basis are compatible.
- Preserve deterministic scoring and method versioning.
- Define explicit signal states.
- Ensure stable rounding and decimal arithmetic.
- Expose coverage, exclusions, and rejection reasons.
- Avoid one API request per company during page rendering.

## 5.4 Required application/API contract

Implement or consolidate typed endpoints/services equivalent to:

- overview summary;
- available periods;
- sector radar listing;
- sector signal detail reference;
- data-health summary.

Exact route names may follow repository conventions. Return metadata required to label data mode, dataset, period, method, freshness, and warnings.

## 5.5 Lovable details

- A short plain-language summary at the top: “What deserves attention?”
- Helpful tooltips explaining strength, breadth, coverage, and mixed signals.
- Smooth but restrained filtering without full-page reloads.
- URL-preserved filter state.
- Clear visual distinction between pressure and opportunity without relying only on color.
- One-click path from an interesting sector to its evidence.

## 5.6 Definition of done

SLC 1 is complete only when:

- the homepage is a real overview, not a development notice;
- at least one validated dataset produces sector-level results;
- synthetic mode can demonstrate all signal states without being confused with live mode;
- filtering and sorting work;
- all displayed scores are reconstructable;
- missing and low-coverage states are visible;
- responsive and keyboard workflows work;
- component, domain, API, and end-to-end tests pass;
- the user can select a sector signal and continue to SLC 2.

---

# SLC 2 — Follow the Evidence

## 6. Outcome

An analyst can understand exactly why a sector signal appeared, how widely it is shared, which companies support or contradict it, and which source observations produced each calculation.

## 6.1 User story

> As a policy analyst, I want to inspect the evidence behind a sector signal so that I can decide whether the pattern is credible enough to investigate.

## 6.2 Signal Detail screen

Required sections:

1. **Signal statement**
   - one factual headline;
   - selected sector and periods;
   - signal direction;
   - strength;
   - breadth;
   - coverage;
   - dataset and method references.

2. **Trend**
   - up to eight compatible quarters where available;
   - risk and opportunity trajectory;
   - eligible-company count per period;
   - visible gaps;
   - no interpolation that could be mistaken for reported data.

3. **Driver decomposition**
   - revenue growth;
   - operating-margin change;
   - operating-cash-flow-margin change;
   - debt-to-assets change;
   - contribution or trigger state according to deterministic method v0.1;
   - explanation of formulas and thresholds.

4. **Company distribution**
   - supporting companies;
   - contradicting companies;
   - neutral companies;
   - excluded companies;
   - sortable exact-value table;
   - distribution visualization that is not a stock-performance chart.

5. **Public context**
   - curated official indicator when reviewed and compatible;
   - definition, unit, geography, period, publication date, and source;
   - comparability status and reviewer information;
   - explicit `not comparable` state.

6. **Evidence lineage**
   - calculated feature;
   - formula;
   - normalized values;
   - source observations;
   - immutable snapshot metadata;
   - provider record reference subject to redistribution rules.

7. **Investigation entry**
   - suggested investigation questions;
   - analyst-authored question;
   - pinned context preview;
   - `Start investigation` action.

## 6.3 Evidence interaction

Clicking any evidence marker must open an evidence drawer or focused page showing:

- evidence ID;
- entity/company;
- metric;
- prior and current values;
- units and currency;
- accounting/reporting basis;
- source period;
- retrieval or snapshot timestamp;
- calculation formula and result;
- dataset ID;
- signal-run ID;
- warnings or transformation notes.

The drawer must provide a copyable stable reference. It must not expose credentials or restricted raw payloads.

## 6.4 Public-indicator governance

A public indicator is displayed as comparable only when a reviewed mapping confirms:

- semantic compatibility;
- unit compatibility;
- geographic scope;
- temporal alignment;
- publication/vintage handling;
- source attribution.

Comparison statuses:

- `comparable`;
- `context_only`;
- `not_comparable`;
- `pending_review`;
- `unavailable`.

The UI must not imply causation or validation merely because two lines move in the same direction.

## 6.5 Lovable details

- Start with a readable explanation, then allow progressive disclosure into calculations.
- Highlight counterevidence beside supporting evidence.
- Keep chart legends, units, periods, and bases visible.
- Allow the user to switch between distribution, company table, and lineage without losing context.
- Add “Why this signal?” and “What weakens this signal?” summaries generated from deterministic data, not unconstrained model output.

## 6.6 Definition of done

SLC 2 is complete only when:

- every material signal value can be traced to immutable observations;
- supporting, contradicting, neutral, missing, and excluded cases are distinguishable;
- up-to-eight-quarter history works where compatible data exists;
- public-indicator compatibility is explicit;
- no synthetic record resembles an actual company;
- all formulas, units, periods, and bases are visible;
- the selected signal can start a persisted investigation;
- accessibility, responsive, domain, integration, and end-to-end tests pass.

---

# SLC 3 — Investigate the Shift

## 7. Outcome

An analyst can ask a bounded AI investigator to examine a pinned sector signal, observe its actual tool activity, inspect cited evidence, see counterevidence and limitations, and return later to the persisted investigation.

## 7.1 User story

> As a policy analyst, I want AI assistance investigating a signal without losing evidence traceability or methodological control.

## 7.2 Investigation creation

Starting an investigation must pin:

- analyst question;
- cohort/sector;
- dataset ID;
- signal-run ID;
- periods;
- method version;
- data mode;
- allowed tools;
- model/provider configuration reference;
- budgets and limits.

Do not allow a later dataset refresh to mutate the investigation context.

## 7.3 Investigation Workspace

Use a responsive three-part layout:

### Context panel

- question;
- signal summary;
- dataset and method;
- coverage;
- current investigation status;
- budget/limit summary;
- cancellation control where valid.

### Investigation thread

Show structured events rather than fabricating a human-like chain of thought:

- investigation started;
- tool requested;
- tool result received;
- evidence inspected;
- counterevidence checked;
- public comparison checked;
- draft finding created;
- validation passed/failed;
- investigation completed/failed/cancelled.

Do not expose hidden reasoning. Show concise, useful action summaries and actual tool outcomes.

### Evidence drawer

- cited observations;
- calculations;
- company groups;
- public-indicator mappings;
- counterevidence;
- exclusions;
- gaps.

Every material claim uses stable evidence references such as `[E1]`, `[E2]`, and those references must resolve inside the workspace.

## 7.4 Suggested investigations

Provide bounded prompts:

- What primarily drives this signal?
- How broadly is the pattern shared?
- Which companies contradict the pattern?
- Is the result dominated by a small number of companies?
- How does it differ from the previous compatible period?
- Is a reviewed public indicator consistent, inconsistent, or not comparable?
- What cannot be concluded from available evidence?
- What additional data should be investigated?

Allow a custom analyst question, but constrain the investigator to the pinned evidence scope. Politely reject trading advice, unrelated general questions, and requests requiring unavailable evidence.

## 7.5 Investigator output schema

The persisted result must separate:

- **Observation:** directly supported by evidence.
- **Interpretation:** a bounded reading of observations.
- **Hypothesis:** a possible explanation requiring more evidence.
- **Counterevidence:** facts weakening or complicating the interpretation.
- **Limitation:** coverage, data, method, or comparability constraint.
- **Follow-up question:** what should be examined next.

Each observation and material numerical statement requires evidence references. Hypotheses must never be worded as established causes.

## 7.6 Safety and control

Retain or complete:

- one bounded orchestrator;
- strict tool allowlist;
- typed tool inputs and outputs;
- maximum calls;
- token/time budget;
- cancellation;
- durable progress events;
- retry policy;
- idempotency;
- provider-neutral LLM adapter;
- local Ollama option;
- graceful provider failure;
- claim and numeric validation;
- audit log;
- no autonomous policy action.

If the model is unavailable, the system must retain the investigation request, show a useful failure state, and allow a safe retry. It must not substitute fabricated output.

## 7.7 Investigation index

The Investigations page must support:

- status;
- sector;
- period;
- question;
- created/updated date;
- model/provider label;
- data mode;
- search and filters;
- resume/open;
- retry when eligible;
- cancel when active;
- create brief from completed investigation.

## 7.8 Definition of done

SLC 3 is complete only when:

- a signal creates a persisted investigation;
- a real configured model can complete one measured run;
- actual tool events are visible without hidden chain-of-thought;
- claims and numerical facts are validated;
- citations resolve to pinned evidence;
- counterevidence and limitations are mandatory;
- refresh and reconnection preserve progress;
- failure, retry, cancellation, timeout, and budget exhaustion work;
- synthetic/model-unavailable states remain explicit;
- domain, integration, security, and end-to-end tests pass;
- a completed investigation can continue to SLC 4.

---

# SLC 4 — Deliver a Decision Brief

## 8. Outcome

An analyst can transform a completed investigation into an editable, versioned, cited brief and export it without triggering another model run.

## 8.1 User story

> As a policy analyst, I want a concise, traceable brief that I can review, revise, export, and use as an input to further policy analysis.

## 8.2 Brief structure

Every brief contains:

1. Title
2. Executive summary
3. Analyst question
4. Scope
5. Data and reporting periods
6. Key findings
7. Signal breadth
8. Primary drivers
9. Supporting evidence
10. Counterevidence
11. Public-indicator context
12. Limitations
13. Hypotheses requiring validation
14. Recommended follow-up questions
15. Evidence register
16. Dataset, run, method, model, and generation metadata

The brief must clearly distinguish fact, interpretation, and hypothesis.

## 8.3 Brief Builder

Required capabilities:

- create from a completed investigation;
- preview the generated structure;
- edit title and analyst-owned notes;
- include/exclude eligible investigation findings;
- preserve citations when sections are rearranged;
- regenerate one AI-authored section only through an explicit action;
- never regenerate silently during export;
- save a draft;
- create immutable versions;
- compare or inspect version metadata;
- return to source investigation and evidence.

Human edits must be visually or structurally distinguishable in history from model-generated content.

## 8.4 Export

Required export:

- Markdown.

Preferred if time allows after Markdown is reliable:

- print-quality PDF generated from the same validated brief snapshot.

Export rules:

- use an existing saved brief version;
- never start a new model call;
- include citation/evidence register;
- include data mode and generation timestamp;
- include method and dataset references;
- include limitations;
- remain reproducible;
- respect access control;
- use a safe, deterministic filename.

## 8.5 Brief index

The Briefs page must show:

- title;
- sector;
- period;
- current version;
- status: draft/reviewed/final;
- data mode;
- created and updated timestamps;
- source investigation;
- open, duplicate, and export actions as permitted.

Do not imply formal government approval. `Reviewed` means reviewed within NADI's workflow, not endorsed by an institution.

## 8.6 Definition of done

SLC 4 is complete only when:

- a completed investigation creates a persisted brief;
- citations survive editing and export;
- brief versions are immutable after creation;
- exports do not invoke the model;
- Markdown output is readable outside NADI;
- missing or invalid citations block finalization;
- limitations and provenance cannot be silently removed from a final brief;
- the brief index and reopening workflow work;
- authorization, accessibility, integration, and end-to-end tests pass.

---

# SLC 5 — Trust and Operate NADI

## 9. Outcome

NADI becomes a resilient, explainable, accessible, and reproducible system that the team can demonstrate and operate confidently.

## 9.1 Data & Method workspace

Provide five focused areas:

### Sources

- source name;
- enabled state;
- last successful retrieval;
- last error;
- data mode;
- verified scope;
- terms/redistribution note;
- configuration health without showing secrets.

### Dataset runs

- queued/running/completed/failed status;
- started/completed timestamps;
- source snapshot;
- included, excluded, rejected counts;
- error summary;
- retry eligibility;
- produced dataset ID.

### Coverage

- companies by sector;
- available periods;
- compatible period pairs;
- missing metrics;
- accounting-basis distribution;
- exclusions and reasons;
- cash-flow semantic warnings where applicable.

### Public indicators

- source;
- mapping status;
- reviewer;
- definition/unit/geography;
- period and vintage rules;
- reviewed date;
- compatible NADI signal;
- comparability notes.

### Methodology

- active signal version;
- formulas;
- thresholds;
- cohort rules;
- coverage rules;
- limitations;
- change log;
- link from every relevant screen.

## 9.2 Authentication and authorization

Replace loopback-only assumptions before shared hosting.

At minimum support:

- authenticated analyst access;
- authorized operational/admin access for ingestion and mappings;
- server-side authorization;
- protected investigation and export routes;
- audit events for material mutations;
- secure session handling;
- no secret or provider credential sent to the browser.

If full multi-role administration is outside the event deployment, implement the smallest complete secure model and document the boundary. Do not publicly expose operational mutation endpoints.

## 9.3 Reliability

Complete and verify:

- database migrations from a clean database;
- durable jobs;
- idempotent ingestion;
- deduplication;
- retry with bounded backoff;
- dead/failed-job visibility;
- graceful worker restart;
- transaction boundaries;
- immutable snapshots and datasets;
- application health endpoint;
- worker health/heartbeat;
- structured logs;
- correlation IDs;
- request and job timeouts;
- rate-limit and quota handling;
- backup and restore instructions;
- safe deployment and rollback procedure.

## 9.4 Performance

Set and measure realistic targets in the intended runtime:

- overview and radar should avoid request waterfalls;
- paginate large company/evidence tables;
- use server-side aggregation where appropriate;
- cache immutable datasets and brief versions safely;
- prevent duplicate investigation starts;
- lazy-load heavy visualizations;
- report measured, not invented, performance.

## 9.5 Accessibility

Meet a practical WCAG 2.1 AA baseline:

- semantic landmarks;
- keyboard-complete navigation;
- visible focus;
- accessible names;
- adequate contrast;
- chart alternatives;
- non-color state indicators;
- reduced-motion support;
- table captions and headers;
- announced async status changes;
- responsive layouts without lost functionality.

## 9.6 Security and privacy

- Keep API keys and secrets out of code, logs, browser bundles, exports, and screenshots.
- Validate all external inputs and model tool calls.
- Use parameterized database queries.
- Escape exported and rendered user/model text appropriately.
- Apply CSRF protection where required by the chosen auth model.
- Restrict provider/network access to server-side components.
- Rate-limit expensive operations.
- Record prompt/tool configuration references without recording prohibited sensitive content.
- Document third-party data restrictions and avoid redistributing restricted raw data.

## 9.7 Testing pyramid

### Domain

- calculations and thresholds;
- decimal precision;
- missing data;
- basis compatibility;
- aggregation;
- coverage;
- signal states;
- adjacent-period comparison;
- claim validation.

### Provider contract

- validated Sectors API v2 fixtures;
- authentication and error mapping;
- pagination;
- rate limit;
- unexpected/missing fields;
- response version drift;
- lossless numeric handling.

### Persistence and jobs

- clean migration;
- idempotency;
- immutability;
- retry;
- cancellation;
- worker restart;
- concurrent job protection.

### API and authorization

- response contracts;
- invalid inputs;
- access control;
- export safety;
- sensitive-field exclusion.

### Component and accessibility

- global states;
- keyboard interaction;
- focus management;
- chart/table parity;
- responsive behavior.

### End to end

Test at least:

1. open overview;
2. filter radar;
3. select a sector signal;
4. inspect supporting and contradicting evidence;
5. start an investigation;
6. observe completion;
7. open cited evidence;
8. create a brief;
9. finalize a valid version;
10. export Markdown;
11. reopen the same artifacts and verify pinned provenance.

Also test synthetic demo, model unavailable, provider unavailable, low coverage, not-comparable indicator, failed job, cancellation, and unauthorized access.

## 9.8 Demo readiness

Prepare two explicitly separated paths:

### Live or snapshot demonstration

Use only validated authorized data. Record:

- commit SHA;
- dataset ID;
- signal-run ID;
- method version;
- provider/data mode;
- reporting periods;
- coverage;
- retrieval timestamp;
- model/provider;
- measured runtime.

### Synthetic fallback demonstration

Use clearly fictional companies and values. Show all important product states. Display a persistent synthetic-data banner and include the label in exports.

Never switch from live failure to synthetic data silently.

## 9.9 Definition of done

SLC 5 is complete only when:

- a clean environment can run migrations, app, and worker using documented steps;
- hosted/shared routes have real authorization;
- operational health and failures are visible;
- the full journey works without database manipulation or hidden developer actions;
- a reviewer can distinguish live, snapshot, and synthetic data everywhere;
- accessibility and security checks pass;
- CI covers typecheck, lint, tests, build, and public-content checks;
- backup, restore, deployment, rollback, and demo handoff are documented;
- the final release limitations are honest and specific.

---

## 10. Cross-slice data contracts

At minimum, preserve or implement clear typed entities for:

- provider source;
- source snapshot;
- ingestion run;
- normalized observation;
- rejected observation;
- immutable dataset;
- dataset membership;
- cohort/sector;
- company;
- signal method version;
- signal run;
- company signal;
- sector/cohort signal;
- public indicator;
- public-indicator observation;
- reviewed indicator mapping;
- investigation;
- investigation event;
- tool call and result reference;
- evidence reference;
- validated finding;
- brief;
- brief version;
- audit event.

Every derived object must retain enough provenance to reconstruct its inputs without querying “the latest” dataset.

---

## 11. Route map

The exact paths can follow existing Next.js conventions, but the final product should provide an equivalent map:

| Experience | Suggested route |
|---|---|
| Overview | `/` |
| Radar | `/radar` |
| Signal detail | `/radar/[signalRunId]/[cohortId]` |
| Evidence | `/evidence/[runId]/[signalId]` or contextual drawer |
| Investigations | `/investigations` |
| New investigation | created from signal detail |
| Investigation workspace | `/investigations/[id]` |
| Briefs | `/briefs` |
| Brief builder | `/briefs/[id]` |
| Data & Method | `/data` and/or nested sections |

Redirect or preserve existing useful routes where reasonable. Avoid breaking evidence deep links.

---

## 12. Implementation sequence

### Phase 0 — Reconcile

- Run baseline verification.
- Map current features and migrations.
- Identify missing original specification files without deleting current docs.
- Produce a concise internal gap checklist.
- Confirm actual Sectors v2 endpoint behavior using authorized access.
- Freeze a reusable UI and domain vocabulary.

### Phase 1 — SLC 1

- Application shell and design tokens.
- Sector aggregation and overview query.
- National Pulse overview.
- Complete radar.
- Tests and states.

### Phase 2 — SLC 2

- Signal-detail query and route.
- Trend and driver visualizations.
- Company distribution.
- Evidence drawer and lineage.
- Public-indicator context.
- Tests and states.

### Phase 3 — SLC 3

- Connect existing investigation backend to product UI.
- Persist creation, events, and results.
- Evidence-linked structured findings.
- Index, retry, cancel, failure paths.
- Execute and measure at least one real configured model run.

### Phase 4 — SLC 4

- Brief persistence and versioning.
- Brief Builder.
- Citation validation.
- Markdown export.
- PDF only after Markdown is complete.

### Phase 5 — SLC 5

- Data & Method workspace.
- Hosted authentication/authorization.
- reliability, security, accessibility, and performance hardening;
- end-to-end verification;
- deployment and demo handoff.

Do not call a phase complete until its definition of done passes.

---

## 13. Pull-request discipline

Use small, reviewable PRs that each deliver visible vertical value.

Every PR must state:

- analyst outcome;
- slice and acceptance criterion;
- data mode tested;
- screenshots for UI changes;
- tests added or changed;
- migrations;
- API/contract changes;
- accessibility impact;
- security/privacy impact;
- known limitations;
- verification commands and results.

Do not mix unrelated refactors with feature delivery. Preserve backward compatibility or document and migrate deliberate contract changes.

---

## 14. Final product acceptance test

NADI is considered complete for the target release when a new authorized analyst can:

1. Sign in and understand the active data context.
2. Identify a sector requiring attention from the Overview.
3. Filter and compare signals in Radar.
4. Open a signal and understand strength, breadth, drivers, history, coverage, and uncertainty.
5. Inspect exact calculations and immutable sources.
6. See supporting and contradicting companies.
7. Understand whether public context is comparable.
8. Start a bounded investigation.
9. Observe real tool progress and recover from ordinary failures.
10. Read findings separated into observations, interpretations, hypotheses, counterevidence, limitations, and next questions.
11. Resolve every material citation.
12. Create, edit, version, and export a brief.
13. Reopen the investigation and brief without their evidence changing.
14. Distinguish synthetic, snapshot, and live data on every relevant surface.
15. Complete the journey on desktop and a practical mobile viewport using keyboard-accessible controls.

The journey must work using documented application controls. Database consoles, manual fixture edits, fabricated screenshots, hidden scripts, and verbal explanations cannot substitute for missing product behavior.

---

## 15. Release completion checklist

### Product

- [ ] Overview answers “what deserves attention?”
- [ ] Radar supports useful exploration.
- [ ] Signal detail explains the pattern.
- [ ] Investigation workspace is operational.
- [ ] Brief workflow is operational.
- [ ] Data & Method establishes trust.

### Data

- [ ] Sectors v2 facts are validated.
- [ ] Provider access and quota behavior are documented.
- [ ] Cohort coverage is measured.
- [ ] Accounting and cash-flow semantics are resolved or visibly limited.
- [ ] Snapshot/vintage limitations are explicit.
- [ ] Public-indicator mapping is reviewed.

### Engineering

- [ ] Clean migrations pass.
- [ ] App and worker start reliably.
- [ ] Jobs are durable and recoverable.
- [ ] Deterministic calculations remain versioned.
- [ ] Investigations are bounded and pinned.
- [ ] Brief versions and exports are reproducible.
- [ ] Authentication and authorization protect shared deployment.

### Quality

- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Unit and integration tests pass.
- [ ] End-to-end tests pass.
- [ ] Production build passes.
- [ ] Accessibility checks pass.
- [ ] Security review passes.
- [ ] Public-content/synthetic-label checks pass.

### Demonstration

- [ ] Demo dataset and mode are explicit.
- [ ] One complete journey is rehearsed.
- [ ] Evidence links work.
- [ ] Model/provider failure has a safe fallback state.
- [ ] Export works without a model call.
- [ ] Limitations are visible.
- [ ] Commit and runtime metadata are recorded.

---

## 16. Closing directive

The repository already contains important foundations. Preserve and integrate them.

The objective is not to maximize the number of endpoints, agents, charts, or metrics. The objective is to make one coherent product journey feel finished:

> A policy analyst discovers an economic shift, verifies its evidence, investigates it with bounded AI, and produces a traceable brief.

Implement the five SLCs sequentially, maintain evidence integrity throughout, and treat UI quality, uncertainty, provenance, failure states, and accessibility as part of functionality—not as post-release polish.
