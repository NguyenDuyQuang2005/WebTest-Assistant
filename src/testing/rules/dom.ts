import type { PageSnapshot, ScanLevel, TestFinding } from "../../shared/types";
import { finding } from "../findings";

export function runDomRules(snapshot: PageSnapshot, _level: ScanLevel): TestFinding[] {
  const results: TestFinding[] = [];

  results.push(
    snapshot.title.trim()
      ? finding({
          ruleId: "DOM-001",
          ruleName: "Tiêu đề trang",
          group: "dom",
          description: "Trang phải có phần tử title không rỗng.",
          severity: "high",
          status: "passed",
          evidence: [`title="${snapshot.title}"`],
          recommendation: "Giữ title ngắn, mô tả đúng nội dung trang.",
        })
      : finding({
          ruleId: "DOM-001",
          ruleName: "Tiêu đề trang",
          group: "dom",
          description: "Trang phải có phần tử title không rỗng.",
          severity: "high",
          status: "failed",
          evidence: ["document.title rỗng"],
          recommendation: "Thêm <title> mô tả nội dung trang.",
        }),
  );

  const h1 = snapshot.headings.filter((item) => item.level === 1);
  if (h1.length === 1) {
    results.push(
      finding({
        ruleId: "DOM-002",
        ruleName: "Heading chính",
        group: "dom",
        description: "Trang nên có đúng một heading h1.",
        severity: "medium",
        status: "passed",
        evidence: [`h1="${h1[0]?.text ?? ""}"`],
        recommendation: "Giữ một h1 duy nhất cho chủ đề trang.",
      }),
    );
  } else if (h1.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-002",
        ruleName: "Heading chính",
        group: "dom",
        description: "Trang nên có đúng một heading h1.",
        severity: "medium",
        status: "failed",
        evidence: ["Không tìm thấy h1"],
        recommendation: "Thêm một heading h1 mô tả chủ đề chính.",
      }),
    );
  } else {
    results.push(
      finding({
        ruleId: "DOM-002",
        ruleName: "Heading chính",
        group: "dom",
        description: "Trang nên có đúng một heading h1.",
        severity: "medium",
        status: "warning",
        evidence: [`Tìm thấy ${h1.length} thẻ h1`, ...h1.slice(0, 5).map((item) => item.text)],
        recommendation: "Giảm còn một h1; các mục còn lại dùng h2+.",
      }),
    );
  }

  const missingAlt = snapshot.images.filter((img) => !img.hasAltAttribute && !img.decorative);
  if (snapshot.images.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-003",
        ruleName: "Thuộc tính alt của ảnh",
        group: "dom",
        description: "Ảnh nội dung phải có thuộc tính alt.",
        severity: "high",
        status: "skipped",
        evidence: ["Trang không có thẻ img"],
        recommendation: "Không áp dụng khi không có ảnh.",
      }),
    );
  } else if (missingAlt.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-003",
        ruleName: "Thuộc tính alt của ảnh",
        group: "dom",
        description: "Ảnh nội dung phải có thuộc tính alt.",
        severity: "high",
        status: "passed",
        evidence: [`${snapshot.images.length} ảnh có thuộc tính alt hoặc được đánh dấu trang trí`],
        recommendation: "Duy trì alt mô tả, dùng alt rỗng cho ảnh trang trí.",
      }),
    );
  } else {
    results.push(
      finding({
        ruleId: "DOM-003",
        ruleName: "Thuộc tính alt của ảnh",
        group: "dom",
        description: "Ảnh nội dung phải có thuộc tính alt.",
        severity: "high",
        status: "failed",
        evidence: missingAlt.slice(0, 8).map((img) => img.src || "(src trống)"),
        recommendation: "Thêm alt mô tả cho ảnh nội dung. Ảnh trang trí dùng alt=\"\" và role phù hợp.",
      }),
    );
  }

  const inputs = snapshot.controls.filter((item) => item.tag === "input" || item.tag === "textarea" || item.tag === "select");
  const unlabeled = inputs.filter((item) => {
    if (item.type === "hidden" || item.type === "submit" || item.type === "button" || item.type === "reset") {
      return false;
    }
    return !item.label;
  });
  if (inputs.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-004",
        ruleName: "Nhãn trường nhập liệu",
        group: "dom",
        description: "Trường nhập liệu phải có label liên kết.",
        severity: "high",
        status: "skipped",
        evidence: ["Không có input/textarea/select"],
        recommendation: "Không áp dụng.",
      }),
    );
  } else if (unlabeled.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-004",
        ruleName: "Nhãn trường nhập liệu",
        group: "dom",
        description: "Trường nhập liệu phải có label liên kết.",
        severity: "high",
        status: "passed",
        evidence: [`${inputs.length} trường có nhãn`],
        recommendation: "Giữ liên kết label/for hoặc aria-label.",
      }),
    );
  } else {
    results.push(
      finding({
        ruleId: "DOM-004",
        ruleName: "Nhãn trường nhập liệu",
        group: "dom",
        description: "Trường nhập liệu phải có label liên kết.",
        severity: "high",
        status: "failed",
        evidence: unlabeled.slice(0, 8).map((item) => `${item.tag} type=${item.type ?? "?"} name=${item.name ?? "(không)"}`),
        recommendation: "Thêm <label for>, bọc label, hoặc aria-label.",
      }),
    );
  }

  const namelessButtons = snapshot.buttons.filter((item) => !item.accessibleName);
  const namelessLinks = snapshot.links.filter((item) => !item.name);
  if (namelessButtons.length + namelessLinks.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-005",
        ruleName: "Tên nút và liên kết",
        group: "dom",
        description: "Nút và liên kết phải có tên hoặc nội dung có ý nghĩa.",
        severity: "medium",
        status: "passed",
        evidence: [`${snapshot.buttons.length} nút, ${snapshot.links.length} liên kết`],
        recommendation: "Tránh nút chỉ chứa icon không có tên truy cập.",
      }),
    );
  } else {
    results.push(
      finding({
        ruleId: "DOM-005",
        ruleName: "Tên nút và liên kết",
        group: "dom",
        description: "Nút và liên kết phải có tên hoặc nội dung có ý nghĩa.",
        severity: "medium",
        status: "failed",
        evidence: [
          ...namelessButtons.slice(0, 5).map((item) => `nút type=${item.type ?? "?"}`),
          ...namelessLinks.slice(0, 5).map((item) => `a href="${item.href}"`),
        ],
        recommendation: "Thêm text, aria-label hoặc title mô tả hành động.",
      }),
    );
  }

  if (snapshot.duplicateIds.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-006",
        ruleName: "ID HTML duy nhất",
        group: "dom",
        description: "Giá trị thuộc tính id phải duy nhất trong tài liệu.",
        severity: "medium",
        status: "passed",
        evidence: [`${snapshot.ids.length} id được quét`],
        recommendation: "Không tái sử dụng id.",
      }),
    );
  } else {
    results.push(
      finding({
        ruleId: "DOM-006",
        ruleName: "ID HTML duy nhất",
        group: "dom",
        description: "Giá trị thuộc tính id phải duy nhất trong tài liệu.",
        severity: "medium",
        status: "failed",
        evidence: snapshot.duplicateIds.slice(0, 10),
        recommendation: "Đổi id trùng; dùng class cho style dùng chung.",
      }),
    );
  }

  if (snapshot.forms.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-007",
        ruleName: "Form method/action",
        group: "dom",
        description: "Form nên khai báo method/action phù hợp ngữ cảnh.",
        severity: "low",
        status: "skipped",
        evidence: ["Không có form"],
        recommendation: "Không áp dụng.",
      }),
    );
  } else {
    for (const form of snapshot.forms) {
      const method = (form.method ?? "get").toLowerCase();
      const missingAction = form.action === null;
      const evidences = [
        `id=${form.id ?? "(không)"}`,
        `method=${form.method ?? "(mặc định GET)"}`,
        `action=${form.action ?? "(mặc định URL hiện tại)"}`,
      ];
      if (form.hasPasswordField && method === "get") {
        results.push(
          finding({
            ruleId: "DOM-007",
            ruleName: "Form method/action",
            group: "dom",
            description: "Form có mật khẩu không nên dùng GET.",
            severity: "high",
            status: "failed",
            evidence: evidences,
            recommendation: "Dùng method=\"post\" và HTTPS cho form xác thực.",
          }),
        );
      } else if (missingAction || form.method === null) {
        results.push(
          finding({
            ruleId: "DOM-007",
            ruleName: "Form method/action",
            group: "dom",
            description: "Form nên khai báo method/action phù hợp ngữ cảnh.",
            severity: "low",
            status: "warning",
            evidence: evidences,
            recommendation: "Khai báo rõ method và action để tránh hành vi ngầm.",
          }),
        );
      } else {
        results.push(
          finding({
            ruleId: "DOM-007",
            ruleName: "Form method/action",
            group: "dom",
            description: "Form nên khai báo method/action phù hợp ngữ cảnh.",
            severity: "low",
            status: "passed",
            evidence: evidences,
            recommendation: "Giữ method/action khớp với API xử lý.",
          }),
        );
      }
    }
  }

  const emptyHref = snapshot.links.filter((item) => !item.href.trim());
  if (snapshot.links.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-008",
        ruleName: "Liên kết thiếu href",
        group: "dom",
        description: "Phần tử a nên có href hợp lệ; nếu là nút hãy dùng button.",
        severity: "medium",
        status: "skipped",
        evidence: ["Không có liên kết"],
        recommendation: "Không áp dụng.",
      }),
    );
  } else if (emptyHref.length === 0) {
    results.push(
      finding({
        ruleId: "DOM-008",
        ruleName: "Liên kết thiếu href",
        group: "dom",
        description: "Phần tử a nên có href hợp lệ; nếu là nút hãy dùng button.",
        severity: "medium",
        status: "passed",
        evidence: [`${snapshot.links.length} liên kết có href`],
        recommendation: "Không dùng <a> như nút không điều hướng.",
      }),
    );
  } else {
    results.push(
      finding({
        ruleId: "DOM-008",
        ruleName: "Liên kết thiếu href",
        group: "dom",
        description: "Phần tử a nên có href hợp lệ; nếu là nút hãy dùng button.",
        severity: "medium",
        status: "failed",
        evidence: [`${emptyHref.length} liên kết không có href`],
        recommendation: "Thêm href hoặc đổi sang <button>.",
      }),
    );
  }

  return results;
}
