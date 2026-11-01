import { describe, expect, it } from "vitest";
import { runDomRules } from "../../src/testing/rules/dom";
import type { PageSnapshot } from "../../src/shared/types";

function snapshot(partial: Partial<PageSnapshot>): PageSnapshot {
  return {
    collectedAt: "2026-01-01T00:00:00.000Z",
    url: "https://example.com/",
    origin: "https://example.com",
    title: "Hello",
    lang: "vi",
    headings: [{ level: 1, text: "Hello" }],
    images: [],
    links: [{ href: "/a", text: "A", name: "A", target: null, rel: null }],
    forms: [],
    controls: [],
    buttons: [{ text: "OK", type: "button", accessibleName: "OK", disabled: false }],
    ids: ["x"],
    duplicateIds: [],
    ariaIssues: [],
    suspicious: [],
    performance: {
      ttfbMs: 10,
      domContentLoadedMs: 20,
      loadEventMs: 30,
      transferSize: 100,
      lcpMs: null,
    },
    limits: { truncatedLinks: false, truncatedImages: false, truncatedControls: false },
    ...partial,
  };
}

describe("runDomRules", () => {
  it("failed khi thiếu title", () => {
    const findings = runDomRules(snapshot({ title: "" }), "standard");
    const title = findings.find((item) => item.ruleId === "DOM-001");
    expect(title?.status).toBe("failed");
  });

  it("passed khi có title", () => {
    const findings = runDomRules(snapshot({ title: "Trang" }), "standard");
    expect(findings.find((item) => item.ruleId === "DOM-001")?.status).toBe("passed");
  });

  it("failed khi ảnh thiếu alt", () => {
    const findings = runDomRules(
      snapshot({
        images: [{ src: "/a.png", alt: null, hasAltAttribute: false, role: null, decorative: false }],
      }),
      "standard",
    );
    expect(findings.find((item) => item.ruleId === "DOM-003")?.status).toBe("failed");
  });

  it("failed khi trùng id", () => {
    const findings = runDomRules(snapshot({ ids: ["a", "a"], duplicateIds: ["a"] }), "standard");
    expect(findings.find((item) => item.ruleId === "DOM-006")?.status).toBe("failed");
  });

  it("warning khi form thiếu method", () => {
    const findings = runDomRules(
      snapshot({
        forms: [{ id: "f", name: null, method: null, action: "/x", hasPasswordField: false, controlCount: 1 }],
      }),
      "standard",
    );
    expect(findings.find((item) => item.ruleId === "DOM-007")?.status).toBe("warning");
  });
});
