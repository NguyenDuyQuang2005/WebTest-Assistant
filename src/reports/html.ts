import { escapeHtml } from "../shared/html";
import { formatSuccessRate } from "../shared/stats";
import type { TestFinding, TestRun } from "../shared/types";

const STATUS_LABEL: Record<TestFinding["status"], string> = {
  passed: "Passed",
  failed: "Failed",
  warning: "Warning",
  skipped: "Skipped",
  not_verifiable: "Không thể xác minh",
};

export function serializeReportHtml(run: TestRun): string {
  const rows = run.findings
    .map((item) => {
      const evidence = item.evidence.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
      const unverifiable = item.unverifiableReason
        ? `<p><strong>Lý do chưa xác minh:</strong> ${escapeHtml(item.unverifiableReason)}</p>`
        : "";
      return `<tr>
        <td>${escapeHtml(item.ruleId)}</td>
        <td>${escapeHtml(item.ruleName)}</td>
        <td>${escapeHtml(item.group)}</td>
        <td>${escapeHtml(item.severity)}</td>
        <td>${escapeHtml(STATUS_LABEL[item.status])}</td>
        <td>
          <p>${escapeHtml(item.description)}</p>
          <ul>${evidence}</ul>
          ${unverifiable}
          <p><strong>Khuyến nghị:</strong> ${escapeHtml(item.recommendation)}</p>
        </td>
      </tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Báo cáo ${escapeHtml(run.id)}</title>
  <style>
    body { font-family: Segoe UI, sans-serif; margin: 24px; color: #0f172a; }
    h1 { font-size: 22px; }
    .meta, table { width: 100%; }
    .cards { display: flex; gap: 12px; flex-wrap: wrap; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
    table { border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; vertical-align: top; }
    th { background: #f8fafc; text-align: left; }
    .note { background: #f1f5f9; padding: 12px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>WebTest Assistant — Báo cáo kiểm thử</h1>
  <p class="note">Tỷ lệ thành công = Passed / (Passed + Failed + Warning). Skipped và Không thể xác minh không tính là Passed. Nếu không có kiểm tra đủ điều kiện: N/A. Báo cáo không chứng minh tuân thủ WCAG hay bảo mật xâm nhập.</p>
  <div class="meta">
    <p><strong>Mã phiên:</strong> ${escapeHtml(run.id)}</p>
    <p><strong>URL:</strong> ${escapeHtml(run.targetUrl)}</p>
    <p><strong>Bắt đầu:</strong> ${escapeHtml(run.startedAt)}</p>
    <p><strong>Kết thúc:</strong> ${escapeHtml(run.endedAt ?? "—")}</p>
    <p><strong>Nhóm:</strong> ${escapeHtml(run.groups.join(", "))}</p>
    <p><strong>Mức:</strong> ${escapeHtml(run.level)}</p>
  </div>
  <div class="cards">
    <div class="card">Tổng: ${run.stats.total}</div>
    <div class="card">Passed: ${run.stats.passed}</div>
    <div class="card">Failed: ${run.stats.failed}</div>
    <div class="card">Warning: ${run.stats.warning}</div>
    <div class="card">Skipped: ${run.stats.skipped}</div>
    <div class="card">Không thể xác minh: ${run.stats.notVerifiable}</div>
    <div class="card">Tỷ lệ: ${escapeHtml(formatSuccessRate(run.stats.successRate))}</div>
  </div>
  <h2>Chi tiết</h2>
  <table>
    <thead>
      <tr>
        <th>Mã</th><th>Tên</th><th>Nhóm</th><th>Mức độ</th><th>Kết quả</th><th>Mô tả / bằng chứng</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
