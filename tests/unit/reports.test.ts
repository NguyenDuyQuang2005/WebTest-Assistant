import { describe, expect, it } from "vitest";
import { serializeReportHtml } from "../../src/reports/html";
import { serializeReportJson } from "../../src/reports/json";
import { computeStats } from "../../src/shared/stats";
import type { TestRun } from "../../src/shared/types";

const run: TestRun = {
  id: "run-xss",
  targetUrl: "https://example.com/?q=<script>",
  tabId: 1,
  startedAt: "2026-01-01T00:00:00.000Z",
  endedAt: "2026-01-01T00:01:00.000Z",
  groups: ["dom"],
  level: "basic",
  lifecycle: "completed",
  progressPercent: 100,
  progressLabel: "xong",
  findings: [
    {
      id: "1",
      ruleId: "DOM-001",
      ruleName: "title",
      group: "dom",
      description: "mô tả <b>html</b>",
      severity: "high",
      status: "failed",
      evidence: ["<img src=x onerror=alert(1)>"],
      recommendation: "sửa",
    },
  ],
  stats: computeStats([]),
  performance: null,
  linkChecks: [],
  errorMessage: null,
  consent: { ownedOrAuthorized: true, checkExternalLinks: false, acknowledgeNoLiveSubmit: true },
};

describe("reports", () => {
  it("JSON chứa công thức tỷ lệ và findings", () => {
    const json = serializeReportJson({ ...run, stats: computeStats(run.findings) });
    const parsed = JSON.parse(json) as { runId: string; stats: { successRateFormula: string } };
    expect(parsed.runId).toBe("run-xss");
    expect(parsed.stats.successRateFormula).toContain("Passed / (Passed + Failed + Warning)");
  });

  it("HTML escape dữ liệu trang", () => {
    const html = serializeReportHtml(run);
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("&lt;b&gt;html&lt;/b&gt;");
  });
});
