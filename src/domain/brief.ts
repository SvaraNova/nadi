export interface EvidenceRegisterItem {
  id: string;
  symbol: string;
  metric: string;
  priorValue: string;
  currentValue: string;
  unit: string;
  calculation: string;
  datasetId: string;
  sourcePointer: string;
}

export interface BriefFinding {
  id: string;
  kind: "observation" | "interpretation" | "hypothesis" | "counterevidence" | "limitation";
  statement: string;
  citations: string[];
}

export interface DecisionBriefData {
  id: string;
  investigationId: string;
  title: string;
  cohortId: string;
  period: string;
  dataMode: "live" | "snapshot" | "synthetic";
  methodVersion: string;
  datasetId: string;
  signalRunId: string;
  status: "draft" | "reviewed" | "final";
  currentVersion: number;
  analystQuestion: string;
  executiveSummary: string;
  analystNotes: string;
  scope: string;
  signalBreadth: string;
  primaryDrivers: string[];
  findings: BriefFinding[];
  counterevidenceSummary: string;
  publicIndicatorContext: string;
  limitations: string[];
  followUpQuestions: string[];
  evidenceRegister: EvidenceRegisterItem[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
}

export function validateBriefCitations(brief: DecisionBriefData): { valid: boolean; missingCitations: string[] } {
  const registeredIds = new Set(brief.evidenceRegister.map((e) => e.id));
  const missingCitations: string[] = [];

  for (const finding of brief.findings) {
    for (const cite of finding.citations) {
      if (!registeredIds.has(cite)) {
        missingCitations.push(cite);
      }
    }
  }

  return {
    valid: missingCitations.length === 0,
    missingCitations,
  };
}

export function renderBriefMarkdown(brief: DecisionBriefData, lang: "en" | "id" = "en"): string {
  const { missingCitations } = validateBriefCitations(brief);
  const isId = lang === "id";

  if (isId) {
    const modeLabel = brief.dataMode === "synthetic" ? "DEMO SINTETIS" : brief.dataMode === "snapshot" ? "ARSIP DATA" : "DATA LANGSUNG";
    const statusLabel = brief.status === "final" ? "FINAL (TERKUNCI)" : brief.status === "reviewed" ? "DITELAAH" : "DRAF";
    return `# ${brief.title}

> **Status:** ${statusLabel} (Versi ${brief.currentVersion}.0)  
> **Kohort:** ${brief.cohortId}  
> **Periode Pelaporan:** ${brief.period}  
> **Mode Data:** ${modeLabel}  
> **ID Dataset:** \`${brief.datasetId}\`  
> **ID Putaran Sinyal:** \`${brief.signalRunId}\`  
> **Versi Metode:** ${brief.methodVersion}  
> **Penyusun / Analis:** ${brief.author}  
> **Waktu Pembuatan:** ${new Date().toISOString()}  

---

## 1. Ringkasan Eksekutif

${brief.executiveSummary}

---

## 2. Pertanyaan Analis & Cakupan Investigasi

- **Pertanyaan Analis:** "${brief.analystQuestion}"
- **Cakupan Populasi Target:** ${brief.scope}
- **Sebaran Sinyal (Risk/Opp Breadth):** ${brief.signalBreadth}

### Faktor Pendorong Utama
${brief.primaryDrivers.map((d) => `- ${d}`).join("\n")}

---

## 3. Temuan Kunci

${brief.findings
  .map(
    (f, i) => {
      const kindLabel =
        f.kind === "observation"
          ? "OBSERVASI"
          : f.kind === "interpretation"
          ? "INTERPRETASI"
          : f.kind === "hypothesis"
          ? "HIPOTESIS"
          : f.kind === "counterevidence"
          ? "SANGGAHAN"
          : "BATASAN";
      return `### 3.${i + 1} [${kindLabel}]  
${f.statement}  
*Sitasi Bukti:* ${f.citations.length > 0 ? f.citations.map((c) => `\`[${c}]\``).join(", ") : "Tidak memerlukan sitasi"}
`;
    }
  )
  .join("\n")}

---

## 4. Bukti Sanggahan & Kontradiksi (Counterevidence)

${brief.counterevidenceSummary}

---

## 5. Konteks Indikator Publik Resmi (BPS)

${brief.publicIndicatorContext}

---

## 6. Hipotesis & Pertanyaan Tindak Lanjut

${brief.followUpQuestions.map((q) => `- ${q}`).join("\n")}

---

## 7. Batasan Metodologi

${brief.limitations.map((l) => `- ${l}`).join("\n")}

---

## 8. Register Bukti Terdaftar

| ID Bukti | Simbol | Metrik | Nilai Basis | Nilai Target | Hasil Perhitungan | Penunjuk Sumber |
|---|---|---|---|---|---|---|
${brief.evidenceRegister
  .map(
    (e) =>
      `| \`${e.id}\` | ${e.symbol} | ${e.metric} | ${e.priorValue} | ${e.currentValue} | ${e.calculation} | \`${e.sourcePointer}\` |`
  )
  .join("\n")}

---

*Pemberitahuan: Dokumen ini diproduksi secara deterministik melalui NADI (National Discovery Intelligence) tanpa generasi teks waktu-nyata tanpa kendali selama ekspor. Semua bukti yang disitasi merujuk pada observasi data yang tidak dapat diubah.*
${missingCitations.length > 0 ? `\n\n> [!WARNING]\n> Sitasi tidak ditemukan dalam register: ${missingCitations.join(", ")}` : ""}
`;
  }

  return `# ${brief.title}

> **Status:** ${brief.status.toUpperCase()} (Version ${brief.currentVersion}.0)  
> **Cohort:** ${brief.cohortId}  
> **Reporting Period:** ${brief.period}  
> **Data Mode:** ${brief.dataMode.toUpperCase()}  
> **Dataset ID:** \`${brief.datasetId}\`  
> **Signal Run ID:** \`${brief.signalRunId}\`  
> **Method Version:** ${brief.methodVersion}  
> **Author / Analyst:** ${brief.author}  
> **Generated Timestamp:** ${new Date().toISOString()}  

---

## 1. Executive Summary

${brief.executiveSummary}

---

## 2. Analyst Inquiry & Investigation Scope

- **Analyst Question:** "${brief.analystQuestion}"
- **Target Population Scope:** ${brief.scope}
- **Signal Breadth:** ${brief.signalBreadth}

### Primary Drivers
${brief.primaryDrivers.map((d) => `- ${d}`).join("\n")}

---

## 3. Key Findings

${brief.findings
  .map(
    (f, i) =>
      `### 3.${i + 1} [${f.kind.toUpperCase()}]  
${f.statement}  
*Citations:* ${f.citations.length > 0 ? f.citations.map((c) => `\`[${c}]\``).join(", ") : "None required"}
`
  )
  .join("\n")}

---

## 4. Counterevidence & Contradictions

${brief.counterevidenceSummary}

---

## 5. Official Public Indicator Context

${brief.publicIndicatorContext}

---

## 6. Hypotheses & Follow-up Questions

${brief.followUpQuestions.map((q) => `- ${q}`).join("\n")}

---

## 7. Methodological Limitations

${brief.limitations.map((l) => `- ${l}`).join("\n")}

---

## 8. Evidence Register

| Evidence ID | Symbol | Metric | Prior | Current | Calculation Result | Source Pointer |
|---|---|---|---|---|---|---|
${brief.evidenceRegister
  .map(
    (e) =>
      `| \`${e.id}\` | ${e.symbol} | ${e.metric} | ${e.priorValue} | ${e.currentValue} | ${e.calculation} | \`${e.sourcePointer}\` |`
  )
  .join("\n")}

---

*Notice: This document was produced deterministically through NADI (National Discovery Intelligence) without unconstrained real-time generation during export. All cited evidence items reference immutable observations.*
${missingCitations.length > 0 ? `\n\n> [!WARNING]\n> Citations missing in registry: ${missingCitations.join(", ")}` : ""}
`;
}
