import { calculateSignalRun, type SignalInput, type SignalRun } from "./signal-run";
import { type CohortSignal } from "./signals";

export interface SectorDefinition {
  id: string;
  name: string;
  industry: string;
  description: string;
  totalUniverse: number;
  companies: {
    symbol: string;
    name: string;
    marketCapCategory: "Large Cap" | "Mid Cap" | "Small Cap";
    prior: {
      revenue: string;
      operatingPnl: string;
      operatingCashFlow: string;
      totalDebt: string;
      totalAssets: string;
      basis: "standalone_quarter";
    };
    current: {
      revenue: string;
      operatingPnl: string;
      operatingCashFlow: string;
      totalDebt: string;
      totalAssets: string;
      basis: "standalone_quarter";
    };
  }[];
}

export const SECTOR_DEFINITIONS: SectorDefinition[] = [
  {
    id: "energy-coal",
    name: "Energy — Coal Mining & Quarrying",
    industry: "Energy & Natural Resources",
    description: "Indonesian thermal and metallurgical coal exporters and producers.",
    totalUniverse: 7,
    companies: [
      {
        symbol: "AADI.JK",
        name: "PT Adaro Andalan Indonesia Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "12500000", operatingPnl: "3200000", operatingCashFlow: "2800000", totalDebt: "4500000", totalAssets: "35000000", basis: "standalone_quarter" },
        current: { revenue: "9800000", operatingPnl: "1800000", operatingCashFlow: "1400000", totalDebt: "5800000", totalAssets: "36000000", basis: "standalone_quarter" },
      },
      {
        symbol: "BYAN.JK",
        name: "PT Bayan Resources Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "14000000", operatingPnl: "4100000", operatingCashFlow: "3900000", totalDebt: "3200000", totalAssets: "42000000", basis: "standalone_quarter" },
        current: { revenue: "11200000", operatingPnl: "2400000", operatingCashFlow: "1900000", totalDebt: "4800000", totalAssets: "41000000", basis: "standalone_quarter" },
      },
      {
        symbol: "PTBA.JK",
        name: "PT Bukit Asam Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "10200000", operatingPnl: "1900000", operatingCashFlow: "1700000", totalDebt: "3800000", totalAssets: "38000000", basis: "standalone_quarter" },
        current: { revenue: "8300000", operatingPnl: "1100000", operatingCashFlow: "900000", totalDebt: "5100000", totalAssets: "37500000", basis: "standalone_quarter" },
      },
      {
        symbol: "ADRO.JK",
        name: "PT Alamtri Resources Indonesia Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "16000000", operatingPnl: "3900000", operatingCashFlow: "3400000", totalDebt: "6000000", totalAssets: "48000000", basis: "standalone_quarter" },
        current: { revenue: "12800000", operatingPnl: "2100000", operatingCashFlow: "1800000", totalDebt: "7500000", totalAssets: "47000000", basis: "standalone_quarter" },
      },
      {
        symbol: "ITMG.JK",
        name: "PT Indo Tambangraya Megah Tbk",
        marketCapCategory: "Mid Cap",
        prior: { revenue: "8500000", operatingPnl: "2200000", operatingCashFlow: "1900000", totalDebt: "1500000", totalAssets: "22000000", basis: "standalone_quarter" },
        current: { revenue: "6900000", operatingPnl: "1200000", operatingCashFlow: "1000000", totalDebt: "2400000", totalAssets: "21500000", basis: "standalone_quarter" },
      },
      {
        symbol: "BUMI.JK",
        name: "PT Bumi Resources Tbk",
        marketCapCategory: "Mid Cap",
        prior: { revenue: "9200000", operatingPnl: "1400000", operatingCashFlow: "1200000", totalDebt: "5500000", totalAssets: "28000000", basis: "standalone_quarter" },
        current: { revenue: "9400000", operatingPnl: "1500000", operatingCashFlow: "1350000", totalDebt: "4900000", totalAssets: "29000000", basis: "standalone_quarter" },
      },
    ],
  },
  {
    id: "consumer-staples",
    name: "Consumer Staples — Packaged Food & Beverage",
    industry: "Consumer Non-Cyclical",
    description: "National FMCG and food processing companies serving domestic retail consumption.",
    totalUniverse: 6,
    companies: [
      {
        symbol: "ICBP.JK",
        name: "PT Indofood CBP Sukses Makmur Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "18000000", operatingPnl: "2700000", operatingCashFlow: "2500000", totalDebt: "8500000", totalAssets: "62000000", basis: "standalone_quarter" },
        current: { revenue: "20500000", operatingPnl: "3600000", operatingCashFlow: "3200000", totalDebt: "7200000", totalAssets: "65000000", basis: "standalone_quarter" },
      },
      {
        symbol: "INDF.JK",
        name: "PT Indofood Sukses Makmur Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "27000000", operatingPnl: "3800000", operatingCashFlow: "3400000", totalDebt: "14000000", totalAssets: "98000000", basis: "standalone_quarter" },
        current: { revenue: "30500000", operatingPnl: "4900000", operatingCashFlow: "4400000", totalDebt: "12500000", totalAssets: "102000000", basis: "standalone_quarter" },
      },
      {
        symbol: "MYOR.JK",
        name: "PT Mayora Indah Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "8200000", operatingPnl: "950000", operatingCashFlow: "820000", totalDebt: "3800000", totalAssets: "26000000", basis: "standalone_quarter" },
        current: { revenue: "9600000", operatingPnl: "1350000", operatingCashFlow: "1200000", totalDebt: "3100000", totalAssets: "28000000", basis: "standalone_quarter" },
      },
      {
        symbol: "CMRY.JK",
        name: "PT Cisarua Mountain Dairy Tbk",
        marketCapCategory: "Mid Cap",
        prior: { revenue: "2100000", operatingPnl: "350000", operatingCashFlow: "310000", totalDebt: "600000", totalAssets: "7500000", basis: "standalone_quarter" },
        current: { revenue: "2550000", operatingPnl: "490000", operatingCashFlow: "440000", totalDebt: "450000", totalAssets: "8200000", basis: "standalone_quarter" },
      },
      {
        symbol: "ROTI.JK",
        name: "PT Nippon Indosari Corpindo Tbk",
        marketCapCategory: "Mid Cap",
        prior: { revenue: "980000", operatingPnl: "120000", operatingCashFlow: "110000", totalDebt: "850000", totalAssets: "4200000", basis: "standalone_quarter" },
        current: { revenue: "1140000", operatingPnl: "165000", operatingCashFlow: "155000", totalDebt: "720000", totalAssets: "4400000", basis: "standalone_quarter" },
      },
    ],
  },
  {
    id: "basic-materials",
    name: "Basic Materials — Nickel & Minerals Processing",
    industry: "Basic Materials",
    description: "Mineral smelting, nickel processing, and industrial raw materials.",
    totalUniverse: 6,
    companies: [
      {
        symbol: "ANTM.JK",
        name: "PT Aneka Tambang Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "11500000", operatingPnl: "1600000", operatingCashFlow: "1400000", totalDebt: "4200000", totalAssets: "34000000", basis: "standalone_quarter" },
        current: { revenue: "13500000", operatingPnl: "1300000", operatingCashFlow: "1100000", totalDebt: "4900000", totalAssets: "35000000", basis: "standalone_quarter" },
      },
      {
        symbol: "INCO.JK",
        name: "PT Vale Indonesia Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "4200000", operatingPnl: "890000", operatingCashFlow: "820000", totalDebt: "1200000", totalAssets: "18000000", basis: "standalone_quarter" },
        current: { revenue: "4800000", operatingPnl: "720000", operatingCashFlow: "650000", totalDebt: "1700000", totalAssets: "19000000", basis: "standalone_quarter" },
      },
      {
        symbol: "MDKA.JK",
        name: "PT Merdeka Copper Gold Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "5600000", operatingPnl: "750000", operatingCashFlow: "690000", totalDebt: "5800000", totalAssets: "26000000", basis: "standalone_quarter" },
        current: { revenue: "6500000", operatingPnl: "580000", operatingCashFlow: "510000", totalDebt: "6900000", totalAssets: "27500000", basis: "standalone_quarter" },
      },
      {
        symbol: "NCKL.JK",
        name: "PT Trimegah Bangun Persada Tbk",
        marketCapCategory: "Mid Cap",
        prior: { revenue: "6200000", operatingPnl: "1450000", operatingCashFlow: "1300000", totalDebt: "3900000", totalAssets: "31000000", basis: "standalone_quarter" },
        current: { revenue: "7400000", operatingPnl: "1200000", operatingCashFlow: "1050000", totalDebt: "4600000", totalAssets: "33000000", basis: "standalone_quarter" },
      },
      {
        symbol: "MBMA.JK",
        name: "PT Merdeka Battery Materials Tbk",
        marketCapCategory: "Mid Cap",
        prior: { revenue: "3400000", operatingPnl: "420000", operatingCashFlow: "380000", totalDebt: "3500000", totalAssets: "21000000", basis: "standalone_quarter" },
        current: { revenue: "4100000", operatingPnl: "330000", operatingCashFlow: "290000", totalDebt: "4200000", totalAssets: "22500000", basis: "standalone_quarter" },
      },
    ],
  },
  {
    id: "industrial-logistics",
    name: "Industrial & Maritime Logistics",
    industry: "Industrials",
    description: "Domestic sea freight, container logistics, and industrial transport.",
    totalUniverse: 6,
    companies: [
      {
        symbol: "SMDR.JK",
        name: "PT Samudera Indonesia Tbk",
        marketCapCategory: "Mid Cap",
        prior: { revenue: "3200000", operatingPnl: "450000", operatingCashFlow: "410000", totalDebt: "2200000", totalAssets: "14000000", basis: "standalone_quarter" },
        current: { revenue: "3300000", operatingPnl: "460000", operatingCashFlow: "420000", totalDebt: "2250000", totalAssets: "14200000", basis: "standalone_quarter" },
      },
      {
        symbol: "TMAS.JK",
        name: "PT Temas Tbk",
        marketCapCategory: "Mid Cap",
        prior: { revenue: "1800000", operatingPnl: "260000", operatingCashFlow: "240000", totalDebt: "950000", totalAssets: "6800000", basis: "standalone_quarter" },
        current: { revenue: "1850000", operatingPnl: "265000", operatingCashFlow: "245000", totalDebt: "970000", totalAssets: "6900000", basis: "standalone_quarter" },
      },
      {
        symbol: "PSSI.JK",
        name: "PT Pelita Samudera Shipping Tbk",
        marketCapCategory: "Small Cap",
        prior: { revenue: "1200000", operatingPnl: "210000", operatingCashFlow: "190000", totalDebt: "550000", totalAssets: "4800000", basis: "standalone_quarter" },
        current: { revenue: "1230000", operatingPnl: "215000", operatingCashFlow: "195000", totalDebt: "560000", totalAssets: "4850000", basis: "standalone_quarter" },
      },
      {
        symbol: "BBRM.JK",
        name: "PT Pelayaran Nasional Bina Buana Raya Tbk",
        marketCapCategory: "Small Cap",
        prior: { revenue: "650000", operatingPnl: "75000", operatingCashFlow: "70000", totalDebt: "380000", totalAssets: "2400000", basis: "standalone_quarter" },
        current: { revenue: "660000", operatingPnl: "76000", operatingCashFlow: "71000", totalDebt: "3850000", totalAssets: "2420000", basis: "standalone_quarter" },
      },
      {
        symbol: "LEAD.JK",
        name: "PT Logindo Samudramakmur Tbk",
        marketCapCategory: "Small Cap",
        prior: { revenue: "520000", operatingPnl: "55000", operatingCashFlow: "50000", totalDebt: "420000", totalAssets: "2100000", basis: "standalone_quarter" },
        current: { revenue: "525000", operatingPnl: "56000", operatingCashFlow: "51000", totalDebt: "425000", totalAssets: "2120000", basis: "standalone_quarter" },
      },
    ],
  },
  {
    id: "telecommunications",
    name: "Telecommunications & Digital Infra",
    industry: "Infrastructure",
    description: "Mobile network operators and optical fiber infrastructure providers.",
    totalUniverse: 7,
    companies: [
      {
        symbol: "TLKM.JK",
        name: "PT Telkom Indonesia Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "37500000", operatingPnl: "11500000", operatingCashFlow: "10500000", totalDebt: "24000000", totalAssets: "165000000", basis: "standalone_quarter" },
        current: { revenue: "38800000", operatingPnl: "11800000", operatingCashFlow: "10800000", totalDebt: "24500000", totalAssets: "168000000", basis: "standalone_quarter" },
      },
      {
        symbol: "ISAT.JK",
        name: "PT Indosat Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "13500000", operatingPnl: "3100000", operatingCashFlow: "2900000", totalDebt: "14500000", totalAssets: "68000000", basis: "standalone_quarter" },
        current: { revenue: "14200000", operatingPnl: "3300000", operatingCashFlow: "3100000", totalDebt: "14800000", totalAssets: "70000000", basis: "standalone_quarter" },
      },
      {
        symbol: "EXCL.JK",
        name: "PT XL Axiata Tbk",
        marketCapCategory: "Large Cap",
        prior: { revenue: "8400000", operatingPnl: "1650000", operatingCashFlow: "1550000", totalDebt: "9800000", totalAssets: "45000000", basis: "standalone_quarter" },
        current: { revenue: "8900000", operatingPnl: "1780000", operatingCashFlow: "1680000", totalDebt: "10100000", totalAssets: "46500000", basis: "standalone_quarter" },
      },
    ],
  },
];

export interface SectorSignalSummary {
  id: string;
  name: string;
  industry: string;
  description: string;
  runId: string;
  datasetId: string;
  period: string;
  signalRun: SignalRun;
  cohortSignal: CohortSignal;
  dominantDriver: string;
  counterSignalSummary: string;
}

export function buildSectorSignalRuns(datasetId = "synthetic-dataset-v0.1", period = "2026-03-31"): SectorSignalSummary[] {
  return SECTOR_DEFINITIONS.map((sector) => {
    const inputs: SignalInput[] = sector.companies.map((c) => ({
      companyId: c.symbol,
      priorObservationIds: [`obs-prior-${c.symbol}-revenue`, `obs-prior-${c.symbol}-pnl`, `obs-prior-${c.symbol}-ocf`, `obs-prior-${c.symbol}-debt`, `obs-prior-${c.symbol}-assets`],
      currentObservationIds: [`obs-curr-${c.symbol}-revenue`, `obs-curr-${c.symbol}-pnl`, `obs-curr-${c.symbol}-ocf`, `obs-curr-${c.symbol}-debt`, `obs-curr-${c.symbol}-assets`],
      prior: c.prior,
      current: c.current,
    }));

    const signalRun = calculateSignalRun(datasetId, inputs, sector.totalUniverse, true);
    const cohort = signalRun.cohortSignal;

    let dominantDriver = "Balanced performance across indicators";
    let counterSignalSummary = "None identified";

    if (cohort.label === "risk") {
      dominantDriver = "Gross revenue contraction and operating margin deterioration";
      counterSignalSummary = `${signalRun.inputs.length - (cohort.eligibleCount * Number(cohort.riskBreadth || 0))} companies maintained revenue growth (e.g. BUMI.JK)`;
    } else if (cohort.label === "opportunity") {
      dominantDriver = "Broad revenue expansion and operating cash-flow improvement";
      counterSignalSummary = "All eligible constituents supported margin expansion";
    } else if (cohort.label === "mixed") {
      dominantDriver = "Revenue grew while operating margins compressed across producers";
      counterSignalSummary = "Topline growth contradicted bottom-line margin squeeze";
    } else if (cohort.label === "insufficient_data") {
      dominantDriver = "Sample size below method minimum threshold (< 5 eligible entities)";
      counterSignalSummary = "Coverage constraint prevents reliable cohort inference";
    }

    return {
      id: sector.id,
      name: sector.name,
      industry: sector.industry,
      description: sector.description,
      runId: `run-${sector.id}-${period}`,
      datasetId,
      period: "Q1-2026 (ended 2026-03-31)",
      signalRun,
      cohortSignal: cohort,
      dominantDriver,
      counterSignalSummary,
    };
  });
}
