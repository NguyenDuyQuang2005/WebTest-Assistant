import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type PageSnapshot } from "../../src/shared/types";
import { evaluateSnapshot } from "../../src/testing/engine";

const snapshot: PageSnapshot = {
  collectedAt: "2026-01-01T00:00:00.000Z",
  url: "https://example.com/",
  origin: "https://example.com",
  title: "",
  lang: "vi",
  headings: [],
  images: [{ src: "/x.png", alt: null, hasAltAttribute: false, role: null, decorative: false }],
  links: [{ href: "", text: "", name: "", target: null, rel: null }],
  forms: [],
  controls: [{ tag: "input", type: "text", name: "q", id: null, required: false, disabled: false, readOnly: false, label: null, placeholder: null, autocomplete: null, validationAttrs: [], accessibleName: "" }],
  buttons: [{ text: "", type: "button", accessibleName: "", disabled: false }],
  ids: [],
  duplicateIds: [],
  ariaIssues: [],
  suspicious: [],
  performance: { ttfbMs: null, domContentLoadedMs: null, loadEventMs: null, transferSize: null, lcpMs: null },
  limits: { truncatedLinks: false, truncatedImages: false, truncatedControls: false },
};

describe("evaluateSnapshot", () => {
  it("chỉ chạy nhóm được chọn", () => {
    const result = evaluateSnapshot({
      snapshot,
      groups: ["dom"],
      level: "basic",
      settings: DEFAULT_SETTINGS,
    });
    expect(result.findings.every((item) => item.group === "dom")).toBe(true);
    expect(result.findings.some((item) => item.status === "failed")).toBe(true);
  });

  it("performance thiếu dữ liệu là not_verifiable", () => {
    const result = evaluateSnapshot({
      snapshot,
      groups: ["performance"],
      level: "basic",
      settings: DEFAULT_SETTINGS,
    });
    expect(result.findings.some((item) => item.status === "not_verifiable")).toBe(true);
  });
});
