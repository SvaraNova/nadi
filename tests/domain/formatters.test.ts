import { describe, it, expect } from "vitest";
import {
  formatScore,
  formatPercent,
  formatPercentagePoints,
  formatCurrencyIDR,
  formatRatio,
} from "../../src/lib/formatters";

describe("formatters", () => {
  describe("formatScore", () => {
    it("formats score to 1 decimal place and preserves raw value in title", () => {
      const res = formatScore(54.166667, "id");
      expect(res.formatted).toBe("54,2");
      expect(res.raw).toBe("54.166667");
      expect(res.title).toContain("54.166667");

      const resEn = formatScore(54.166667, "en");
      expect(resEn.formatted).toBe("54.2");
      expect(resEn.raw).toBe("54.166667");
    });

    it("handles null or undefined gracefully", () => {
      const res = formatScore(null, "id");
      expect(res.formatted).toBe("—");
      expect(res.raw).toBe("null");
    });
  });

  describe("formatPercent", () => {
    it("formats positive and negative percentages with sign", () => {
      const pos = formatPercent(12.45, "id");
      expect(pos.formatted).toBe("+12,5%");
      expect(pos.raw).toBe("12.45");

      const neg = formatPercent(-8.12, "en");
      expect(neg.formatted).toBe("−8.1%");
      expect(neg.raw).toBe("-8.12");
    });
  });

  describe("formatPercentagePoints", () => {
    it("explicitly includes pp or full unit to distinguish from percentage growth", () => {
      const ppId = formatPercentagePoints(-2.54, "id");
      expect(ppId.formatted).toBe("−2,5 pp");
      expect(ppId.title).toContain("poin persentase (pp)");
      expect(ppId.unit).toBe("pp");

      const ppEn = formatPercentagePoints(4.1, "en", { fullUnit: true });
      expect(ppEn.formatted).toBe("+4.1 percentage points");
      expect(ppEn.unit).toBe("pp");
    });
  });

  describe("formatCurrencyIDR", () => {
    it("formats compact trillions and billions in IDR", () => {
      const tril = formatCurrencyIDR(1_450_000_000_000, "id", true);
      expect(tril.formatted).toBe("Rp 1,45 Triliun");
      expect(tril.title).toContain("1450000000000");

      const bil = formatCurrencyIDR(820_000_000_000, "en", true);
      expect(bil.formatted).toBe("Rp 820.00 B");
    });

    it("formats non-compact full amounts", () => {
      const full = formatCurrencyIDR(15_000_000, "id", false);
      expect(full.formatted).toBe("Rp 15.000.000");
    });
  });

  describe("formatRatio", () => {
    it("formats counts and percentage in both languages", () => {
      expect(formatRatio(4, 6, "id")).toBe("4 dari 6 emiten (66,7%)");
      expect(formatRatio(4, 6, "en")).toBe("4 of 6 companies (66.7%)");
    });
  });
});
