import type { InvestigationBrief } from "./investigation";

function clean(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

function list(items: readonly string[], empty = "None recorded."): string {
  return items.length ? items.map(item => `- ${clean(item)}`).join("\n") : empty;
}

export function renderInvestigationMarkdown(
  brief: InvestigationBrief,
  generatedAt: string,
  lang: "en" | "id" = "en"
): string {
  const isId = lang === "id";
  const emptyText = isId ? "Tidak ada catatan." : "None recorded.";
  const claims = brief.claims.map(claim => {
    const evidence = claim.evidenceIds.length
      ? ` ${isId ? "Bukti" : "Evidence"}: ${claim.evidenceIds.map(id => `\`${clean(id)}\``).join(", ")}.`
      : "";
    return `- **${clean(claim.kind)}:** ${clean(claim.text)}${evidence}`;
  }).join("\n") || `- ${emptyText}`;
  const mode = clean(brief.dataMode).toUpperCase();

  if (isId) {
    const modeLabel = mode === "SYNTHETIC" ? "DEMO SINTETIS" : mode === "SNAPSHOT" ? "ARSIP DATA" : "DATA LANGSUNG";
    return `# ${clean(brief.title)}

> ${modeLabel} · investigasi ${clean(brief.runId)}

## Status dan Cakupan

- Mode data: **${modeLabel}**
- Dibuat: ${clean(generatedAt)}
- Periode: ${clean(brief.period)}
- Kohort: ${clean(brief.cohortId)}
- Versi metode: ${clean(brief.methodVersion)}

## Ringkasan Eksekutif

${clean(brief.summary)}

## Klaim Terverifikasi

${claims}

## Bukti-bukti

Bukti pendukung: ${brief.supportingEvidenceIds.length ? brief.supportingEvidenceIds.map(id => `\`${clean(id)}\``).join(", ") : emptyText}

Bukti sanggahan (counterevidence): ${list(brief.contradictingEvidenceIds, emptyText)}

## Kesenjangan Data dan Perbandingan Publik

${list(brief.dataGaps, emptyText)}

Perbandingan publik: **${clean(brief.publicComparison)}**

## Pertanyaan Investigasi Lanjutan

${list(brief.investigationQuestions, emptyText)}

## Batasan Metodologi

${list(brief.limitations, emptyText)}
`;
  }

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
