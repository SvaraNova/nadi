import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EvidencePage from "../../src/app/evidence/page";

describe("evidence methodology explainer", () => {
  it("explains the deterministic formulas without fabricating company figures", () => {
    const html = renderToStaticMarkup(EvidencePage());
    expect(html).toContain("Revenue growth");
    expect(html).toContain("Open live radar");
    expect(html).not.toContain("SYNTHETIC");
  });
});
