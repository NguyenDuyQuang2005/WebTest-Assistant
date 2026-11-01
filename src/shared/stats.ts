import type { TestFinding, TestStats } from "./types";

export function computeStats(findings: TestFinding[]): TestStats {
  const passed = findings.filter((item) => item.status === "passed").length;
  const failed = findings.filter((item) => item.status === "failed").length;
  const warning = findings.filter((item) => item.status === "warning").length;
  const skipped = findings.filter((item) => item.status === "skipped").length;
  const notVerifiable = findings.filter((item) => item.status === "not_verifiable").length;
  const eligible = passed + failed + warning;
  return {
    total: findings.length,
    passed,
    failed,
    warning,
    skipped,
    notVerifiable,
    successRate: eligible === 0 ? null : (passed / eligible) * 100,
  };
}

export function formatSuccessRate(rate: number | null): string {
  if (rate === null) {
    return "N/A";
  }
  return `${rate.toFixed(1)}%`;
}

export function aggregateRuns(runs: Array<{ stats: TestStats }>): TestStats {
  const merged: TestFinding[] = [];
  for (const run of runs) {
    for (let i = 0; i < run.stats.passed; i += 1) {
      merged.push(stub("passed"));
    }
    for (let i = 0; i < run.stats.failed; i += 1) {
      merged.push(stub("failed"));
    }
    for (let i = 0; i < run.stats.warning; i += 1) {
      merged.push(stub("warning"));
    }
    for (let i = 0; i < run.stats.skipped; i += 1) {
      merged.push(stub("skipped"));
    }
    for (let i = 0; i < run.stats.notVerifiable; i += 1) {
      merged.push(stub("not_verifiable"));
    }
  }
  return computeStats(merged);
}

function stub(status: TestFinding["status"]): TestFinding {
  return {
    id: status,
    ruleId: "AGG",
    ruleName: "aggregate",
    group: "dom",
    description: "",
    severity: "info",
    status,
    evidence: [],
    recommendation: "",
  };
}
