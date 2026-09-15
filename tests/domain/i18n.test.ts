import { describe, it, expect } from "vitest";
import { translations } from "../../src/lib/i18n";

describe("i18n Dictionary", () => {
  it("contains both Indonesian and English translations", () => {
    expect(translations.id).toBeDefined();
    expect(translations.en).toBeDefined();
  });

  it("has matching core keys across both languages", () => {
    const requiredKeys = [
      "brand.name",
      "brand.fullName",
      "brand.tagline",
      "nav.overview",
      "nav.radar",
      "nav.investigations",
      "nav.briefs",
      "nav.dataMethod",
      "status.risk",
      "status.opportunity",
      "status.mixed",
      "status.insufficientData",
      "concept.riskBreadth",
      "concept.riskBreadth.desc",
      "concept.coverage",
      "concept.coverage.desc",
      "concept.percentagePoints",
      "concept.percentagePoints.desc",
      "mode.synthetic",
      "mode.snapshot",
      "mode.live",
      "action.exportMarkdown",
      "action.switchLanguage",
    ];

    for (const key of requiredKeys) {
      expect(translations.id[key], `Missing id key: ${key}`).toBeDefined();
      expect(translations.en[key], `Missing en key: ${key}`).toBeDefined();
      expect(translations.id[key].length).toBeGreaterThan(0);
      expect(translations.en[key].length).toBeGreaterThan(0);
    }
  });

  it("includes clear plain-language descriptions for economic concepts", () => {
    expect(translations.id["concept.riskBreadth.desc"]).toContain("Proporsi emiten");
    expect(translations.en["concept.riskBreadth.desc"]).toContain("Proportion of companies");

    expect(translations.id["concept.percentagePoints.desc"]).toContain("Selisih mutlak");
    expect(translations.en["concept.percentagePoints.desc"]).toContain("Absolute difference");

    expect(translations.id["concept.coverage.desc"].toLowerCase()).toContain("cakupan minimal 60%");
    expect(translations.en["concept.coverage.desc"].toLowerCase()).toContain("at least 60% coverage");
  });

  it("distinguishes synthetic, snapshot, and live data mode explanations in both languages", () => {
    expect(translations.id["mode.synthetic.desc"]).toContain("Bukan temuan ekonomi riil");
    expect(translations.en["mode.synthetic.desc"]).toContain("Not a real economic finding");

    expect(translations.id["mode.snapshot.desc"]).toContain("dibekukan");
    expect(translations.en["mode.snapshot.desc"]).toContain("frozen");

    expect(translations.id["mode.live.desc"]).toContain("langsung");
    expect(translations.en["mode.live.desc"]).toContain("directly");
  });
});
