import type { TestFinding } from "../shared/types";
import { finding } from "../testing/findings";

interface AxeNode {
  html?: string;
  target?: string[];
}

interface AxeViolation {
  id: string;
  help: string;
  description: string;
  impact?: string | null;
  nodes?: AxeNode[];
}

interface AxeResults {
  violations?: AxeViolation[];
}

export async function runAxeOnTab(tabId: number): Promise<TestFinding[]> {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["vendor/axe.min.js"],
    world: "MAIN",
  });

  const injected = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: async () => {
      const axe = (globalThis as unknown as { axe?: { run: () => Promise<AxeResults> } }).axe;
      if (!axe) {
        return { error: "axe-core không được inject" };
      }
      const results = await axe.run();
      return {
        violations: (results.violations ?? []).slice(0, 25).map((item) => ({
          id: item.id,
          help: item.help,
          description: item.description,
          impact: item.impact ?? null,
          nodes: (item.nodes ?? []).slice(0, 5).map((node) => ({
            html: (node.html ?? "").slice(0, 180),
            target: node.target ?? [],
          })),
        })),
      };
    },
  });

  const payload = injected[0]?.result as
    | { error?: string; violations?: AxeViolation[] }
    | undefined;
  if (!payload || payload.error) {
    return [
      finding({
        ruleId: "A11Y-AXE",
        ruleName: "axe-core",
        group: "a11y",
        description: "Chạy axe-core 4.14.0 (Mozilla Public License 2.0) trên trang.",
        severity: "medium",
        status: "not_verifiable",
        evidence: [payload?.error ?? "Không nhận được kết quả axe"],
        recommendation: "Chạy lại trên trang HTTP/HTTPS được phép inject.",
        unverifiableReason: payload?.error ?? "axe-core không chạy được",
      }),
    ];
  }

  const violations = payload.violations ?? [];
  if (violations.length === 0) {
    return [
      finding({
        ruleId: "A11Y-AXE",
        ruleName: "axe-core",
        group: "a11y",
        description: "Chạy axe-core 4.14.0. Không phát hiện violation trong lần chạy này.",
        severity: "medium",
        status: "passed",
        evidence: ["0 violation", "Thư viện: axe-core 4.14.0, MPL-2.0"],
        recommendation: "Không tuyên bố tuân thủ WCAG đầy đủ.",
      }),
    ];
  }

  return violations.map((item) =>
    finding({
      ruleId: `A11Y-AXE-${item.id}`,
      ruleName: `axe-core: ${item.help}`,
      group: "a11y",
      description: item.description,
      severity: item.impact === "critical" || item.impact === "serious" ? "high" : "medium",
      status: "failed",
      evidence: (item.nodes ?? []).map((node) => `${(node.target ?? []).join(" ")} ${node.html ?? ""}`.trim()),
      recommendation: "Sửa theo gợi ý axe-core. Kết quả tự động không thay kiểm thử thủ công.",
    }),
  );
}
