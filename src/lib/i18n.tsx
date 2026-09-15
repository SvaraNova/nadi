"use client";

import React, { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

export type Language = "id" | "en";

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const translations: Record<Language, Record<string, string>> = {
  id: {
    // Brand & Tagline
    "brand.name": "NADI",
    "brand.fullName": "National Discovery Intelligence",
    "brand.tagline": "Temukan sinyal ekonomi sebelum menjadi statistik.",
    "brand.status": "TAHAP PENGEMBANGAN",

    // Navigation
    "nav.discovery": "Penemuan & Sinyal",
    "nav.overview": "Ringkasan Eksekutif",
    "nav.radar": "Radar Sektor",
    "nav.deepAnalysis": "Analisis Mendalam",
    "nav.investigations": "Investigasi AI",
    "nav.briefs": "Laporan Keputusan",
    "nav.governance": "Tata Kelola & Audit",
    "nav.dataMethod": "Data & Metodologi",
    "nav.quickSearch": "Cari sektor, kode emiten...",
    "nav.skipToContent": "Loncat ke konten utama",

    // Session & Engine
    "session.label": "Peran:",
    "session.analyst": "Analis Kebijakan",
    "session.operator": "Operator Data",
    "session.admin": "Administrator",
    "engine.title": "Mesin: Metodologi v0.1 (100% Deterministik)",
    "engine.subtitle": "Cakupan Emiten IDX · Konteks Makro BPS",

    // Statuses & Signals
    "status.risk": "Risiko",
    "status.opportunity": "Peluang",
    "status.mixed": "Sinyal Campuran",
    "status.noBroadSignal": "Tidak Ada Sinyal Meluas",
    "status.insufficientData": "Data Tidak Memadai",
    "status.stable": "Stabil",
    "status.pending": "Menunggu",
    "status.inProgress": "Sedang Berjalan",
    "status.completed": "Selesai",
    "status.failed": "Gagal",

    // Plain Language Concepts & Tooltips
    "concept.riskBreadth": "Sebaran Risiko",
    "concept.riskBreadth.desc": "Proporsi emiten dalam sektor yang mengalami tekanan fundamental finansial (skor risiko ≥ 50). Ambang batas risiko meluas adalah minimal 60% emiten.",
    "concept.opportunityBreadth": "Sebaran Peluang",
    "concept.opportunityBreadth.desc": "Proporsi emiten dalam sektor yang mengalami penguatan fundamental finansial (skor peluang ≥ 50). Ambang batas peluang meluas adalah minimal 60% emiten.",
    "concept.coverage": "Cakupan Sampel",
    "concept.coverage.desc": "Persentase emiten yang memiliki 4 indikator laporan keuangan kuartalan lengkap (YoY). Diperlukan cakupan minimal 60% dan minimal 5 emiten agar sinyal valid.",
    "concept.percentagePoints": "Poin Persentase (pp)",
    "concept.percentagePoints.desc": "Selisih mutlak antar margin persentase (contoh: margin turun dari 10% menjadi 7% adalah penurunan 3 poin persentase, bukan 3 persen).",
    "concept.revenueYoY": "Pertumbuhan Pendapatan (YoY)",
    "concept.revenueYoY.desc": "Perbandingan pendapatan kuartal berjalan terhadap kuartal yang sama tahun sebelumnya.",
    "concept.operatingMargin": "Perubahan Margin Operasional",
    "concept.operatingMargin.desc": "Selisih rasio laba usaha terhadap pendapatan (dalam poin persentase).",
    "concept.ocfMargin": "Perubahan Margin Arus Kas (OCF)",
    "concept.ocfMargin.desc": "Selisih rasio arus kas operasi terhadap pendapatan (dalam poin persentase).",
    "concept.debtToAssets": "Perubahan Utang terhadap Aset",
    "concept.debtToAssets.desc": "Selisih rasio total liabilitas berbunga terhadap total aset (dalam poin persentase).",
    "concept.counterevidence": "Bukti Sanggahan / Emiten Tangguh",
    "concept.counterevidence.desc": "Emiten berkinerja sehat yang menentang narasi pelemahan sektor, atau emiten tertekan di sektor yang sedang tumbuh.",

    // Data Modes
    "mode.synthetic": "Simulasi Sintetis",
    "mode.synthetic.desc": "Data dummy untuk pengujian sistem dan demonstrasi. Bukan temuan ekonomi riil.",
    "mode.snapshot": "Arsip Data",
    "mode.snapshot.desc": "Data emiten IDX historis yang dibekukan pada saat penarikan.",
    "mode.live": "Data Pasar Langsung",
    "mode.live.desc": "Data emiten terkini langsung dari Sectors API v2.",

    // Actions & Buttons
    "action.investigate": "Investigasi dengan AI",
    "action.viewEvidence": "Lihat Bukti",
    "action.exportMarkdown": "Ekspor Laporan (Markdown)",
    "action.copyBrief": "Salin Laporan",
    "action.retry": "Coba Lagi",
    "action.filter": "Saring",
    "action.sortBy": "Urutkan Berdasarkan",
    "action.close": "Tutup",
    "action.details": "Rincian",
    "action.switchLanguage": "Ganti Bahasa",
    "action.viewMethod": "Spesifikasi Metode",

    // Common Phrases
    "common.companies": "emiten",
    "common.eligible": "layak",
    "common.excluded": "dikecualikan",
    "common.period": "Periode",
    "common.rawExact": "Nilai pasti tersimpan: {val}",
    "common.accessibleTable": "Tabel Data Alternatif (Ramah Aksesibilitas)",
    "common.loading": "Memuat data...",
    "common.noData": "Tidak ada data tersedia.",
    "common.citations": "Referensi Bukti",
    "common.limitations": "Batasan Analisis",
    "common.methodVersion": "Versi Metode",
    "common.bpsComparison": "Konteks Makro BPS",
    "common.notComparable": "Definisi atau periode belum dapat diperbandingkan secara langsung dengan indikator makro.",
    "common.riskScore": "Skor Risiko",
    "common.opportunityScore": "Skor Peluang",
    "common.companyCount": "{count} emiten",
    "common.ratio": "{part} dari {total} emiten ({percent}%)",
  },
  en: {
    // Brand & Tagline
    "brand.name": "NADI",
    "brand.fullName": "National Discovery Intelligence",
    "brand.tagline": "Discover economic signals before they become statistics.",
    "brand.status": "ON DEVELOPMENT",

    // Navigation
    "nav.discovery": "Discovery & Signals",
    "nav.overview": "Overview Pulse",
    "nav.radar": "Sector Radar",
    "nav.deepAnalysis": "Deep Analysis",
    "nav.investigations": "Investigations",
    "nav.briefs": "Decision Briefs",
    "nav.governance": "Governance & Audit",
    "nav.dataMethod": "Data & Method",
    "nav.quickSearch": "Quick search sectors, tickers...",
    "nav.skipToContent": "Skip to main content",

    // Session & Engine
    "session.label": "Session:",
    "session.analyst": "Policy Analyst",
    "session.operator": "Data Operator",
    "session.admin": "System Admin",
    "engine.title": "Engine: Method v0.1 (100% Deterministic)",
    "engine.subtitle": "IDX Listed Coverage · BPS Macro Context",

    // Statuses & Signals
    "status.risk": "Risk",
    "status.opportunity": "Opportunity",
    "status.mixed": "Mixed Signals",
    "status.noBroadSignal": "No Broad Signal",
    "status.insufficientData": "Insufficient Data",
    "status.stable": "Stable",
    "status.pending": "Pending",
    "status.inProgress": "In Progress",
    "status.completed": "Completed",
    "status.failed": "Failed",

    // Plain Language Concepts & Tooltips
    "concept.riskBreadth": "Risk Breadth",
    "concept.riskBreadth.desc": "Proportion of companies in the sector showing fundamental pressure (risk score ≥ 50). Broad risk threshold requires at least 60% of companies.",
    "concept.opportunityBreadth": "Opportunity Breadth",
    "concept.opportunityBreadth.desc": "Proportion of companies in the sector showing strengthening fundamentals (opportunity score ≥ 50). Broad opportunity threshold requires at least 60% of companies.",
    "concept.coverage": "Sample Coverage",
    "concept.coverage.desc": "Proportion of companies with complete 4 quarterly YoY financial indicators. Requires at least 60% coverage and at least 5 companies for a valid signal.",
    "concept.percentagePoints": "Percentage Points (pp)",
    "concept.percentagePoints.desc": "Absolute difference in percentage margins (e.g., margin dropping from 10% to 7% is a 3 percentage point drop, not 3 percent).",
    "concept.revenueYoY": "Revenue Growth (YoY)",
    "concept.revenueYoY.desc": "Comparison of current quarter revenue against the same fiscal quarter last year.",
    "concept.operatingMargin": "Operating Margin Change",
    "concept.operatingMargin.desc": "Change in operating profit relative to revenue (in percentage points).",
    "concept.ocfMargin": "Operating Cash Flow Margin Change",
    "concept.ocfMargin.desc": "Change in operating cash flow relative to revenue (in percentage points).",
    "concept.debtToAssets": "Debt-to-Assets Change",
    "concept.debtToAssets.desc": "Change in total interest-bearing debt relative to total assets (in percentage points).",
    "concept.counterevidence": "Counterevidence / Resilient Companies",
    "concept.counterevidence.desc": "Resilient companies that contradict a sector risk pattern, or pressured companies in a growing sector.",

    // Data Modes
    "mode.synthetic": "Synthetic Demo",
    "mode.synthetic.desc": "Simulated data for system testing and demonstration. Not a real economic finding.",
    "mode.snapshot": "Snapshot Archive",
    "mode.snapshot.desc": "Historical IDX listed company records frozen at retrieval time.",
    "mode.live": "Live Market Data",
    "mode.live.desc": "Current listed company disclosures directly from Sectors API v2.",

    // Actions & Buttons
    "action.investigate": "Investigate with AI",
    "action.viewEvidence": "Inspect Evidence",
    "action.exportMarkdown": "Export Brief (Markdown)",
    "action.copyBrief": "Copy Brief",
    "action.retry": "Retry",
    "action.filter": "Filter",
    "action.sortBy": "Sort By",
    "action.close": "Close",
    "action.details": "Details",
    "action.switchLanguage": "Switch Language",
    "action.viewMethod": "Method Spec",

    // Common Phrases
    "common.companies": "companies",
    "common.eligible": "eligible",
    "common.excluded": "excluded",
    "common.period": "Period",
    "common.rawExact": "Exact stored value: {val}",
    "common.accessibleTable": "Accessible Data Table Equivalent",
    "common.loading": "Loading data...",
    "common.noData": "No data available.",
    "common.citations": "Evidence Citations",
    "common.limitations": "Analysis Limitations",
    "common.methodVersion": "Method Version",
    "common.bpsComparison": "BPS Macro Context",
    "common.notComparable": "Definitions or periods are not directly comparable with official macro indicators.",
    "common.riskScore": "Risk Score",
    "common.opportunityScore": "Opportunity Score",
    "common.companyCount": "{count} companies",
    "common.ratio": "{part} of {total} companies ({percent}%)",
  },
};

const I18nContext = createContext<I18nContextType>({
  language: "id",
  setLanguage: () => {},
  t: (key) => key,
});

const STORAGE_KEY = "nadi_lang_preference";
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function getClientLanguageSnapshot(): Language {
  if (typeof window === "undefined") return "id";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === "id" || saved === "en") {
      return saved;
    }
  } catch {
    // Ignore localStorage access errors
  }
  return "id";
}

function getServerLanguageSnapshot(): Language {
  return "id";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = React.useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      if (typeof window !== "undefined") {
        window.addEventListener("storage", callback);
      }
      return () => {
        listeners.delete(callback);
        if (typeof window !== "undefined") {
          window.removeEventListener("storage", callback);
        }
      };
    },
    getClientLanguageSnapshot,
    getServerLanguageSnapshot
  );

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore localStorage error
    }
    notifyListeners();
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.id;
    let text = dict[key] || translations.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLanguage() {
  return useContext(I18nContext);
}
