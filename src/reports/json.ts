import type { TestRun } from "../shared/types";
import { formatSuccessRate } from "../shared/stats";

export function serializeReportJson(run: TestRun): string {
  const payload = {
    schema: "webtest-assistant.report.v1",
    runId: run.id,
    targetUrl: run.targetUrl,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    groups: run.groups,
    level: run.level,
    lifecycle: run.lifecycle,
    stats: {
      ...run.stats,
      successRateFormatted: formatSuccessRate(run.stats.successRate),
      successRateFormula: "Passed / (Passed + Failed + Warning) * 100. Skipped và Not Verifiable không tính là Passed. Denominator = 0 → N/A.",
    },
    performance: run.performance,
    findings: run.findings,
    unverifiable: run.findings.filter((item) => item.status === "not_verifiable"),
    linkChecks: run.linkChecks,
    consent: run.consent,
    errorMessage: run.errorMessage,
  };
  return JSON.stringify(payload, null, 2);
}
