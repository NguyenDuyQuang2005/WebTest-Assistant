import type { PageSnapshot, PerformanceReport, PerformanceThresholds, ScanLevel, TestFinding } from "../../shared/types";
import { finding } from "../findings";

function metricFinding(
  ruleId: string,
  name: string,
  valueMs: number | null,
  threshold: number,
  kind: "measured" | "estimated" | "unavailable",
): TestFinding {
  if (valueMs === null || kind === "unavailable") {
    return finding({
      ruleId,
      ruleName: name,
      group: "performance",
      description: `${name} so với ngưỡng ${threshold} ms do người dùng cấu hình.`,
      severity: "low",
      status: "not_verifiable",
      evidence: ["Chỉ số không khả dụng từ Navigation Timing / Performance API"],
      recommendation: "Mở lại trang và chạy kiểm thử sau khi sự kiện load hoàn tất.",
      unverifiableReason: "Performance API không cung cấp chỉ số này trên tab hiện tại.",
    });
  }
  const status = valueMs <= threshold ? "passed" : "warning";
  return finding({
    ruleId,
    ruleName: name,
    group: "performance",
    description: `${name} so với ngưỡng ${threshold} ms do người dùng cấu hình.`,
    severity: "low",
    status,
    evidence: [`Giá trị đo được: ${valueMs} ms`, `Ngưỡng: ${threshold} ms`, `Loại: ${kind}`],
    recommendation:
      status === "passed"
        ? "Chỉ số nằm trong ngưỡng cấu hình. Đây không phải toàn bộ thời gian tải trang nếu chỉ đo HTTP."
        : "Vượt ngưỡng cấu hình. Cần phân tích thủ công tài nguyên, mạng và render.",
  });
}

export function runPerformanceRules(
  snapshot: PageSnapshot,
  thresholds: PerformanceThresholds,
  _level: ScanLevel,
): { findings: TestFinding[]; report: PerformanceReport } {
  const ttfbKind = snapshot.performance.ttfbMs === null ? "unavailable" : "measured";
  const dclKind = snapshot.performance.domContentLoadedMs === null ? "unavailable" : "measured";
  const loadKind = snapshot.performance.loadEventMs === null ? "unavailable" : "measured";
  const lcpKind = snapshot.performance.lcpMs === null ? "unavailable" : "measured";

  const findings = [
    metricFinding("PERF-001", "TTFB (responseStart)", snapshot.performance.ttfbMs, thresholds.ttfbMs, ttfbKind),
    metricFinding(
      "PERF-002",
      "DOMContentLoaded",
      snapshot.performance.domContentLoadedMs,
      thresholds.domContentLoadedMs,
      dclKind,
    ),
    metricFinding("PERF-003", "Load event", snapshot.performance.loadEventMs, thresholds.loadEventMs, loadKind),
    metricFinding("PERF-004", "LCP (nếu có)", snapshot.performance.lcpMs, 2500, lcpKind),
    finding({
      ruleId: "PERF-000",
      ruleName: "Phạm vi đo hiệu năng",
      group: "performance",
      description: "Không gọi thời gian phản hồi HTTP là toàn bộ thời gian tải trang.",
      severity: "info",
      status: "passed",
      evidence: [
        `transferSize=${snapshot.performance.transferSize ?? "không có"}`,
        "Số liệu lấy từ PerformanceNavigationTiming trên tab người dùng, không phải ước lượng giả.",
      ],
      recommendation: "Kết hợp DevTools, Lighthouse hoặc WebPageTest cho phân tích sâu.",
    }),
  ];

  return {
    findings,
    report: {
      thresholds,
      metrics: [
        {
          name: "TTFB",
          valueMs: snapshot.performance.ttfbMs,
          kind: ttfbKind,
          note: "responseStart từ Navigation Timing",
        },
        {
          name: "DOMContentLoaded",
          valueMs: snapshot.performance.domContentLoadedMs,
          kind: dclKind,
          note: "domContentLoadedEventEnd",
        },
        {
          name: "Load",
          valueMs: snapshot.performance.loadEventMs,
          kind: loadKind,
          note: "loadEventEnd",
        },
        {
          name: "LCP",
          valueMs: snapshot.performance.lcpMs,
          kind: lcpKind,
          note: "largest-contentful-paint nếu trình duyệt đã ghi nhận",
        },
      ],
    },
  };
}
