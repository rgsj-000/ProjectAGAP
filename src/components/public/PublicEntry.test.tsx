import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicEntry } from "./PublicEntry";

describe("PublicEntry", () => {
  it("offers personnel and household paths without mounting operations", () => {
    const html = renderToStaticMarkup(<PublicEntry />);

    expect(html).toContain("Authorized Personnel");
    expect(html).toContain('href="/login"');
    expect(html).toContain("Household Preparedness");
    expect(html).toContain('href="/household"');
    expect(html).not.toContain("OperationalWorkspace");
    expect(html).not.toContain("Loading your authorized workspace");
  });

  it("states the decision support boundary without fake operational metrics", () => {
    const html = renderToStaticMarkup(<PublicEntry />);

    expect(html).toContain("Official warnings and final emergency instructions remain with PAGASA and authorized LGUs.");
    expect(html).not.toContain("High Priority");
    expect(html).not.toContain("estimated potentially exposed residents");
  });
});
