import { describe, expect, it } from "vitest";
import { serializeReportHtml } from "../../src/reports/html";
import { serializeReportJson } from "../../src/reports/json";
import { computeStats } from "../../src/shared/stats";
import { isRestrictedBrowserUrl } from "../../src/shared/url";
import type { TestRun } from "../../src/shared/types";

const run: TestRun = {
  id: "run-export",
  targetUrl: "https://example.com/",
  tabId: 1,
  startedAt: "2026-01-01T00:00:00.000Z",
  endedAt: "2026-01-01T00:00:10.000Z",
  groups: ["dom", "links"],
  level: "standard",
  lifecycle: "completed",
  progressPercent: 100,
  progressLabel: "xong",
  findings: [
    {
      id: "a",
      ruleId: "DOM-001",
      ruleName: "title",
      group: "dom",
      description: "ok",
      severity: "high",
      status: "passed",
      evidence: ["title=Home"],
      recommendation: "giữ",
    },
  ],
  stats: computeStats([]),
  performance: null,
  linkChecks: [],
  errorMessage: null,
  consent: { ownedOrAuthorized: true, checkExternalLinks: false, acknowledgeNoLiveSubmit: true },
};

describe("xuất báo cáo và lỗi tab", () => {
  it("xuất JSON parse được", () => {
    const parsed = JSON.parse(serializeReportJson(run)) as { schema: string };
    expect(parsed.schema).toBe("webtest-assistant.report.v1");
  });

  it("xuất HTML có mã phiên", () => {
    expect(serializeReportHtml(run)).toContain("run-export");
  });

  it("tab chrome:// không hỗ trợ", () => {
    expect(isRestrictedBrowserUrl("chrome://extensions")).toBe(true);
  });
});
