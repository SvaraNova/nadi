/**
 * Human-Friendly Number & Unit Formatters for NADI
 * 
 * Strict Principle:
 * Never round in a way that mutates stored calculations or evidence lineage.
 * All functions return display-friendly rounded strings while preserving
 * the exact, unrounded decimal string for tooltips and inspectable detail views.
 */

import type { Language } from "./i18n";

export interface FormattedValue {
  formatted: string;
  raw: string;
  title: string;
  unit?: string;
}

/**
 * Format score (0 to 100) to 1 decimal place.
 * Returns null representation if value is missing/insufficient data.
 */
export function formatScore(
  value: number | string | null | undefined,
  locale: Language = "id"
): FormattedValue {
  if (value === null || value === undefined || value === "") {
    return {
      formatted: "—",
      raw: "null",
      title: locale === "id" ? "Data tidak tersedia" : "Data unavailable",
    };
  }

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return { formatted: "—", raw: String(value), title: String(value) };
  }

  const decimalSeparator = locale === "id" ? "," : ".";
  const fixed = roundToDecimals(num, 1).replace(".", decimalSeparator);
  const rawStr = String(value);

  return {
    formatted: fixed,
    raw: rawStr,
    title: locale === "id" ? `Nilai pasti: ${rawStr}` : `Exact value: ${rawStr}`,
  };
}

function roundToDecimals(num: number, decimals: number): string {
  return Number(Math.round(Number(num + "e" + decimals)) + "e-" + decimals).toFixed(decimals);
}

/**
 * Format percentage (e.g. Revenue YoY growth).
 * Includes explicit `%` and optional sign (`+` / `-`).
 */
export function formatPercent(
  value: number | string | null | undefined,
  locale: Language = "id",
  options?: { showSign?: boolean; decimals?: number }
): FormattedValue {
  if (value === null || value === undefined || value === "") {
    return {
      formatted: "—",
      raw: "null",
      title: locale === "id" ? "Data tidak tersedia" : "Data unavailable",
    };
  }

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return { formatted: "—", raw: String(value), title: String(value) };
  }

  const decimals = options?.decimals ?? 1;
  const decimalSeparator = locale === "id" ? "," : ".";
  const absFormatted = roundToDecimals(Math.abs(num), decimals).replace(".", decimalSeparator);
  
  let sign = "";
  if (options?.showSign !== false) {
    if (num > 0) sign = "+";
    else if (num < 0) sign = "−";
  } else if (num < 0) {
    sign = "−";
  }

  const formatted = `${sign}${absFormatted}%`;
  const rawStr = String(value);

  return {
    formatted,
    raw: rawStr,
    title: locale === "id" ? `Nilai pasti: ${rawStr}%` : `Exact value: ${rawStr}%`,
    unit: "%",
  };
}

/**
 * Format percentage points (e.g. margin changes, debt/asset ratio shifts).
 * EXPLICITLY distinguishes `pp` from `%` so policy analysts don't confuse
 * margin changes with relative percentage growth.
 */
export function formatPercentagePoints(
  value: number | string | null | undefined,
  locale: Language = "id",
  options?: { showSign?: boolean; decimals?: number; fullUnit?: boolean }
): FormattedValue {
  if (value === null || value === undefined || value === "") {
    return {
      formatted: "—",
      raw: "null",
      title: locale === "id" ? "Data tidak tersedia" : "Data unavailable",
    };
  }

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return { formatted: "—", raw: String(value), title: String(value) };
  }

  const decimals = options?.decimals ?? 1;
  const decimalSeparator = locale === "id" ? "," : ".";
  const absFormatted = roundToDecimals(Math.abs(num), decimals).replace(".", decimalSeparator);
  
  let sign = "";
  if (options?.showSign !== false) {
    if (num > 0) sign = "+";
    else if (num < 0) sign = "−";
  } else if (num < 0) {
    sign = "−";
  }

  const unit = options?.fullUnit
    ? locale === "id" ? "poin persentase" : "percentage points"
    : "pp";

  const formatted = `${sign}${absFormatted} ${unit}`;
  const rawStr = String(value);

  return {
    formatted,
    raw: rawStr,
    title: locale === "id" 
      ? `Nilai pasti: ${rawStr} poin persentase (pp)` 
      : `Exact value: ${rawStr} percentage points (pp)`,
    unit: "pp",
  };
}

/**
 * Format Indonesian Rupiah (IDR) currency values into readable compact denominations.
 * E.g., Rp 1,45 Triliun (ID) / Rp 1.45T (EN) or exact value in tooltip.
 */
export function formatCurrencyIDR(
  value: number | string | null | undefined,
  locale: Language = "id",
  compact = true
): FormattedValue {
  if (value === null || value === undefined || value === "") {
    return {
      formatted: "—",
      raw: "null",
      title: locale === "id" ? "Data tidak tersedia" : "Data unavailable",
    };
  }

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return { formatted: "—", raw: String(value), title: String(value) };
  }

  const rawStr = String(value);
  const sign = num < 0 ? "−" : "";
  const abs = Math.abs(num);
  const decimalSeparator = locale === "id" ? "," : ".";

  if (!compact) {
    const thousandSeparator = locale === "id" ? "." : ",";
    const parts = Math.round(abs).toString().split("");
    let formattedNum = "";
    for (let i = 0; i < parts.length; i++) {
      if (i > 0 && (parts.length - i) % 3 === 0) {
        formattedNum += thousandSeparator;
      }
      formattedNum += parts[i];
    }
    return {
      formatted: `${sign}Rp ${formattedNum}`,
      raw: rawStr,
      title: `Rp ${rawStr}`,
      unit: "IDR",
    };
  }

  let suffix = "";
  let divisor = 1;

  if (abs >= 1_000_000_000_000) {
    // Triliun / Trillion
    divisor = 1_000_000_000_000;
    suffix = locale === "id" ? " Triliun" : " T";
  } else if (abs >= 1_000_000_000) {
    // Miliar / Billion
    divisor = 1_000_000_000;
    suffix = locale === "id" ? " Miliar" : " B";
  } else if (abs >= 1_000_000) {
    // Juta / Million
    divisor = 1_000_000;
    suffix = locale === "id" ? " Juta" : " M";
  } else {
    divisor = 1;
    suffix = "";
  }

  const scaled = (abs / divisor).toFixed(2).replace(".", decimalSeparator);
  const formatted = `${sign}Rp ${scaled}${suffix}`;

  return {
    formatted,
    raw: rawStr,
    title: locale === "id" ? `Nilai penuh: Rp ${rawStr}` : `Full amount: IDR ${rawStr}`,
    unit: "IDR",
  };
}

/**
 * Format ratio or sample coverage count (e.g. "4 dari 6 emiten (66,7%)").
 */
export function formatRatio(
  part: number,
  total: number,
  locale: Language = "id"
): string {
  if (total <= 0) return "0/0";
  const decimalSeparator = locale === "id" ? "," : ".";
  const pct = ((part / total) * 100).toFixed(1).replace(".", decimalSeparator);

  if (locale === "id") {
    return `${part} dari ${total} emiten (${pct}%)`;
  }
  return `${part} of ${total} companies (${pct}%)`;
}
