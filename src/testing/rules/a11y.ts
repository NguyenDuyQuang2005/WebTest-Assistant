import type { PageSnapshot, ScanLevel, TestFinding } from "../../shared/types";
import { finding } from "../findings";

export function runA11yRules(snapshot: PageSnapshot, _level: ScanLevel): TestFinding[] {
  const results: TestFinding[] = [];

  const missingAlt = snapshot.images.filter((img) => !img.hasAltAttribute);
  results.push(
    snapshot.images.length === 0
      ? finding({
          ruleId: "A11Y-001",
          ruleName: "Ảnh thiếu alt",
          group: "a11y",
          description: "Ảnh cần văn bản thay thế cho trình đọc màn hình.",
          severity: "high",
          status: "skipped",
          evidence: ["Không có ảnh"],
          recommendation: "Không áp dụng.",
        })
      : missingAlt.length === 0
        ? finding({
            ruleId: "A11Y-001",
            ruleName: "Ảnh thiếu alt",
            group: "a11y",
            description: "Ảnh cần văn bản thay thế cho trình đọc màn hình.",
            severity: "high",
            status: "passed",
            evidence: ["Mọi ảnh đều có thuộc tính alt"],
            recommendation: "Kiểm tra thủ công chất lượng nội dung alt.",
          })
        : finding({
            ruleId: "A11Y-001",
            ruleName: "Ảnh thiếu alt",
            group: "a11y",
            description: "Ảnh cần văn bản thay thế cho trình đọc màn hình.",
            severity: "high",
            status: "failed",
            evidence: missingAlt.slice(0, 8).map((img) => img.src || "(src trống)"),
            recommendation: "Thêm alt. Không kết luận tuân thủ WCAG đầy đủ chỉ từ kiểm tra này.",
          }),
  );

  const unlabeled = snapshot.controls.filter((item) => {
    if (item.tag === "button") {
      return false;
    }
    if (item.type === "hidden" || item.type === "submit" || item.type === "button" || item.type === "reset") {
      return false;
    }
    return !item.label;
  });
  results.push(
    unlabeled.length === 0
      ? finding({
          ruleId: "A11Y-002",
          ruleName: "Input thiếu nhãn",
          group: "a11y",
          description: "Input cần nhãn truy cập.",
          severity: "high",
          status: "passed",
          evidence: ["Không phát hiện input thiếu nhãn trong snapshot"],
          recommendation: "Rà soát thêm placeholder không được dùng thay label.",
        })
      : finding({
          ruleId: "A11Y-002",
          ruleName: "Input thiếu nhãn",
          group: "a11y",
          description: "Input cần nhãn truy cập.",
          severity: "high",
          status: "failed",
          evidence: unlabeled.slice(0, 8).map((item) => `${item.tag} type=${item.type ?? "?"}`),
          recommendation: "Liên kết label hoặc aria-label.",
        }),
  );

  const nameless = snapshot.buttons.filter((item) => !item.accessibleName);
  results.push(
    nameless.length === 0
      ? finding({
          ruleId: "A11Y-003",
          ruleName: "Button thiếu tên truy cập",
          group: "a11y",
          description: "Nút phải có accessible name.",
          severity: "high",
          status: "passed",
          evidence: [`${snapshot.buttons.length} nút có tên hoặc không có nút`],
          recommendation: "Icon-only button cần aria-label.",
        })
      : finding({
          ruleId: "A11Y-003",
          ruleName: "Button thiếu tên truy cập",
          group: "a11y",
          description: "Nút phải có accessible name.",
          severity: "high",
          status: "failed",
          evidence: nameless.slice(0, 8).map((item) => `type=${item.type ?? "button"}`),
          recommendation: "Thêm nội dung text hoặc aria-label.",
        }),
  );

  const levels = snapshot.headings.map((item) => item.level);
  let skippedHeading = false;
  for (let i = 1; i < levels.length; i += 1) {
    const prev = levels[i - 1];
    const curr = levels[i];
    if (prev !== undefined && curr !== undefined && curr > prev + 1) {
      skippedHeading = true;
      break;
    }
  }
  if (snapshot.headings.length === 0) {
    results.push(
      finding({
        ruleId: "A11Y-004",
        ruleName: "Thứ tự heading",
        group: "a11y",
        description: "Heading không nên nhảy cấp (ví dụ h1 sang h3).",
        severity: "medium",
        status: "warning",
        evidence: ["Không có heading"],
        recommendation: "Thêm cấu trúc heading. Cần rà soát thủ công.",
      }),
    );
  } else if (!skippedHeading) {
    results.push(
      finding({
        ruleId: "A11Y-004",
        ruleName: "Thứ tự heading",
        group: "a11y",
        description: "Heading không nên nhảy cấp (ví dụ h1 sang h3).",
        severity: "medium",
        status: "passed",
        evidence: [levels.join(" → ")],
        recommendation: "Vẫn nên kiểm tra thủ công ý nghĩa heading.",
      }),
    );
  } else {
    results.push(
      finding({
        ruleId: "A11Y-004",
        ruleName: "Thứ tự heading",
        group: "a11y",
        description: "Heading không nên nhảy cấp (ví dụ h1 sang h3).",
        severity: "medium",
        status: "warning",
        evidence: [levels.join(" → ")],
        recommendation: "Không nhảy cấp heading. Đây là cảnh báo vì ngữ cảnh có thể hợp lệ.",
      }),
    );
  }

  results.push(
    snapshot.ariaIssues.length === 0
      ? finding({
          ruleId: "A11Y-005",
          ruleName: "Thuộc tính ARIA",
          group: "a11y",
          description: "Phát hiện một số thuộc tính aria-* không nằm trong danh sách thường gặp.",
          severity: "low",
          status: "passed",
          evidence: ["Không thấy aria-* lạ trong danh sách kiểm tra tĩnh"],
          recommendation: "Danh sách thuộc tính không đầy đủ theo spec; dùng axe-core cho kiểm tra sâu hơn.",
        })
      : finding({
          ruleId: "A11Y-005",
          ruleName: "Thuộc tính ARIA",
          group: "a11y",
          description: "Phát hiện một số thuộc tính aria-* không nằm trong danh sách thường gặp.",
          severity: "low",
          status: "warning",
          evidence: snapshot.ariaIssues.slice(0, 10),
          recommendation: "Đối chiếu ARIA spec. Cảnh báo, không kết luận chắc chắn thuộc tính sai.",
        }),
  );

  const emptyLinks = snapshot.links.filter((item) => !item.name);
  results.push(
    emptyLinks.length === 0
      ? finding({
          ruleId: "A11Y-006",
          ruleName: "Liên kết thiếu nội dung",
          group: "a11y",
          description: "Liên kết cần nội dung có ý nghĩa.",
          severity: "medium",
          status: "passed",
          evidence: [`${snapshot.links.length} liên kết`],
          recommendation: "Tránh text kiểu 'click here' — nên rà soát thủ công.",
        })
      : finding({
          ruleId: "A11Y-006",
          ruleName: "Liên kết thiếu nội dung",
          group: "a11y",
          description: "Liên kết cần nội dung có ý nghĩa.",
          severity: "medium",
          status: "failed",
          evidence: emptyLinks.slice(0, 8).map((item) => item.href || "(thiếu href)"),
          recommendation: "Thêm text hoặc aria-label mô tả đích đến.",
        }),
  );

  results.push(
    finding({
      ruleId: "A11Y-000",
      ruleName: "Phạm vi WCAG",
      group: "a11y",
      description: "Kiểm tra tự động không chứng minh tuân thủ WCAG.",
      severity: "info",
      status: "passed",
      evidence: ["Kết quả chỉ là hỗ trợ rà soát, không phải chứng nhận WCAG"],
      recommendation: "Bổ sung kiểm thử thủ công, hỗ trợ công nghệ trợ giúp và tiêu chí WCAG còn lại.",
    }),
  );

  return results;
}
