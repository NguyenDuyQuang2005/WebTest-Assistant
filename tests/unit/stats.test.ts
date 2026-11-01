import { describe, expect, it } from "vitest";
import { computeStats, formatSuccessRate } from "../../src/shared/stats";
import type { TestFinding } from "../../src/shared/types";

function make(status: TestFinding["status"]): TestFinding {
  return {
    id: status,
    ruleId: "X",
    ruleName: "x",
    group: "dom",
    description: "",
    severity: "info",
    status,
    evidence: [],
    recommendation: "",
  };
}

describe("computeStats", () => {
  it("không tính skipped và not_verifiable là passed", () => {
    const stats = computeStats([
      make("passed"),
      make("passed"),
      make("failed"),
      make("warning"),
      make("skipped"),
      make("not_verifiable"),
    ]);
    expect(stats.passed).toBe(2);
    expect(stats.successRate).toBeCloseTo(50);
    expect(stats.total).toBe(6);
  });

  it("trả về null khi không có kiểm tra đủ điều kiện", () => {
    const stats = computeStats([make("skipped"), make("not_verifiable")]);
    expect(stats.successRate).toBeNull();
    expect(formatSuccessRate(stats.successRate)).toBe("N/A");
  });
});
