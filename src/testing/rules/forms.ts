import type { PageSnapshot, ScanLevel, TestFinding } from "../../shared/types";
import { finding } from "../findings";

export function runFormRules(snapshot: PageSnapshot, level: ScanLevel): TestFinding[] {
  const results: TestFinding[] = [];
  const fields = snapshot.controls.filter((item) => item.tag !== "button");

  if (fields.length === 0 && snapshot.forms.length === 0) {
    results.push(
      finding({
        ruleId: "FRM-001",
        ruleName: "Thu thập biểu mẫu",
        group: "forms",
        description: "Thu thập input, textarea, select và thuộc tính liên quan.",
        severity: "info",
        status: "skipped",
        evidence: ["Không có biểu mẫu hoặc trường nhập"],
        recommendation: "Không áp dụng.",
      }),
    );
    return results;
  }

  const required = fields.filter((item) => item.required);
  results.push(
    finding({
      ruleId: "FRM-001",
      ruleName: "Trường bắt buộc",
      group: "forms",
      description: "Ghi nhận các trường required (không gửi dữ liệu thật).",
      severity: "info",
      status: "passed",
      evidence:
        required.length === 0
          ? ["Không có trường required"]
          : required.slice(0, 10).map((item) => `${item.tag} name=${item.name ?? item.id ?? "?"}`),
      recommendation: "Kèm nhãn và thông báo lỗi phía client/server.",
    }),
  );

  const missingName = fields.filter((item) => {
    if (item.disabled || item.type === "hidden" || item.type === "submit" || item.type === "button") {
      return false;
    }
    return !item.name;
  });
  results.push(
    missingName.length === 0
      ? finding({
          ruleId: "FRM-002",
          ruleName: "Thuộc tính name",
          group: "forms",
          description: "Trường gửi được nên có name.",
          severity: "medium",
          status: "passed",
          evidence: ["Các trường gửi được đều có name hoặc bị loại trừ hợp lệ"],
          recommendation: "Giữ name ổn định để server nhận dữ liệu.",
        })
      : finding({
          ruleId: "FRM-002",
          ruleName: "Thuộc tính name",
          group: "forms",
          description: "Trường gửi được nên có name.",
          severity: "medium",
          status: "warning",
          evidence: missingName.slice(0, 8).map((item) => `${item.tag} id=${item.id ?? "(không)"}`),
          recommendation: "Thêm name nếu trường sẽ được gửi. Đây là cảnh báo vì có thể trường chỉ dùng phía client.",
        }),
  );

  const incomplete = fields.filter((item) => !item.id && !item.name && !item.label && item.type !== "hidden");
  results.push(
    incomplete.length === 0
      ? finding({
          ruleId: "FRM-003",
          ruleName: "Nhận diện trường",
          group: "forms",
          description: "Trường nên có id, name hoặc nhãn để nhận diện.",
          severity: "medium",
          status: "passed",
          evidence: ["Không có trường thiếu identifer"],
          recommendation: "Giữ id/name rõ ràng phục vụ kiểm thử và a11y.",
        })
      : finding({
          ruleId: "FRM-003",
          ruleName: "Nhận diện trường",
          group: "forms",
          description: "Trường nên có id, name hoặc nhãn để nhận diện.",
          severity: "medium",
          status: "failed",
          evidence: incomplete.slice(0, 8).map((item) => `${item.tag} type=${item.type ?? "?"}`),
          recommendation: "Bổ sung id, name và label.",
        }),
  );

  const withValidation = fields.filter((item) => item.validationAttrs.length > 0 || item.required);
  results.push(
    finding({
      ruleId: "FRM-004",
      ruleName: "HTML validation",
      group: "forms",
      description: "Ghi nhận thuộc tính kiểm tra HTML5 (required, pattern, min, max...).",
      severity: "info",
      status: "passed",
      evidence:
        withValidation.length === 0
          ? ["Không dùng HTML validation"]
          : withValidation.slice(0, 10).map(
              (item) => `${item.name ?? item.id ?? item.tag}: ${item.validationAttrs.join(", ") || "required"}`,
            ),
      recommendation: "HTML validation hỗ trợ UX nhưng không thay kiểm tra phía máy chủ.",
    }),
  );

  const disabledOrReadonly = fields.filter((item) => item.disabled || item.readOnly);
  results.push(
    finding({
      ruleId: "FRM-005",
      ruleName: "disabled/readonly",
      group: "forms",
      description: "Ghi nhận trạng thái disabled và readonly.",
      severity: "info",
      status: "passed",
      evidence:
        disabledOrReadonly.length === 0
          ? ["Không có trường disabled/readonly"]
          : disabledOrReadonly.slice(0, 8).map(
              (item) => `${item.name ?? item.id ?? item.tag} disabled=${item.disabled} readonly=${item.readOnly}`,
            ),
      recommendation: "Trường disabled không được gửi; readonly vẫn gửi được.",
    }),
  );

  results.push(
    finding({
      ruleId: "FRM-006",
      ruleName: "Không gửi dữ liệu thật",
      group: "forms",
      description: "WebTest Assistant không tự gửi form, đăng ký tài khoản hay thực hiện giao dịch.",
      severity: "info",
      status: "skipped",
      evidence: [
        "Chế độ gửi thử nghiệm an toàn không được bật cho phiên này",
        `Mức quét: ${level}`,
      ],
      recommendation: "Nếu cần kiểm thử submit, dùng môi trường staging và công cụ chuyên biệt có dữ liệu giả.",
    }),
  );

  return results;
}
