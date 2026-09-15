import type { InvestigationBrief } from "./investigation";

function clean(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

function list(items: readonly string[], empty = "None recorded."): string {
  return items.length ? items.map(item => `- ${clean(item)}`).join("\n") : empty;
}

export function renderInvestigationMarkdown(brief: InvestigationBrief, generatedAt: string): string {
  const claims = brief.claims.map(claim => {
    const evidence = claim.evidenceIds.length ? ` Evidence: ${claim.evidenceIds.map(id => `\`${clean(id)}\``).join(", ")}.` : "";
    return `- **${clean(claim.kind)}:** ${clean(claim.text)}${evidence}`;
  }).join("\n") || "- None recorded.";
  const mode = clean(brief.dataMode).toUpperCase();
  return `# ${clean(brief.title)}

> ${mode} · investigation ${clean(brief.runId)}

## Status and scope

- Data mode: **${mode}**
- Generated: ${clean(generatedAt)}
- Period: ${clean(brief.period)}
- Cohort: ${clean(brief.cohortId)}
- Method version: ${clean(brief.methodVersion)}

## Summary

${clean(brief.summary)}

## Validated claims

${claims}

## Evidence

Supporting evidence: ${brief.supportingEvidenceIds.length ? brief.supportingEvidenceIds.map(id => `\`${clean(id)}\``).join(", ") : "None recorded."}

Counterevidence: ${list(brief.contradictingEvidenceIds)}

## Missing data and public comparison

${list(brief.dataGaps)}

Public comparison: **${clean(brief.publicComparison)}**

## Investigation questions

${list(brief.investigationQuestions)}

## Limitations

${list(brief.limitations)}
`;
}

export function investigationFilename(investigationId: string): string {
  return `nadi-brief-${investigationId.replace(/[^a-zA-Z0-9_-]/g, "")}.md`;
}
