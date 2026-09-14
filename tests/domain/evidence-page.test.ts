import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EvidencePage from "../../src/app/evidence/page";

describe("synthetic evidence presentation", () => {
  it("resolves each input link and labels the public comparison unavailable", async () => {
    const html = renderToStaticMarkup(await EvidencePage({ searchParams: Promise.resolve({ example: "risk" }) }));
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
      expect(html).toContain(`id="${target}"`);
    }
    expect(html).toContain("Risk score: 100/100");
    expect(html).toContain("SYNTHETIC EXAMPLE");
    expect(html).toContain("Not comparable");
  });
  it("shows opportunity and preserves unknown inputs without scoring them as zero", async () => {
    const positive = renderToStaticMarkup(await EvidencePage({ searchParams: Promise.resolve({ example: "opportunity" }) }));
    expect(positive).toContain("Opportunity score: 100/100");
    const missing = renderToStaticMarkup(await EvidencePage({ searchParams: Promise.resolve({ example: "missing" }) }));
    expect(missing).toContain("Scores are unavailable");
    expect(missing).toContain("null — unknown, not zero");
    expect(missing).not.toContain("Risk score:");
  });
});
