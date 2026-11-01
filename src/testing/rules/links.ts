import { classifyLink } from "../../shared/url";
import type { LinkCheckResult, PageSnapshot, ScanLevel, TestFinding, UserSettings } from "../../shared/types";
import { finding } from "../findings";

export function selectLinksForCheck(snapshot: PageSnapshot, level: ScanLevel, maxLinks: number): typeof snapshot.links {
  const factor = level === "basic" ? 0.4 : level === "thorough" ? 1 : 0.7;
  const limit = Math.max(5, Math.round(maxLinks * factor));
  return snapshot.links.slice(0, limit);
}

export function toLinkCheckSkeleton(href: string, pageUrl: string): LinkCheckResult {
  const classified = classifyLink(href, pageUrl);
  if (!classified.valid) {
    return {
      href,
      kind: classified.kind,
      urlValid: false,
      httpStatus: null,
      status: href.trim() === "" ? "failed" : classified.kind === "special" && href.toLowerCase().startsWith("javascript:")
        ? "warning"
        : "failed",
      detail: classified.reason,
    };
  }
  if (classified.kind === "anchor") {
    return {
      href,
      kind: "anchor",
      urlValid: true,
      httpStatus: null,
      status: "not_verifiable",
      detail: "Liên kết neo: chưa đối chiếu id đích ở bước HTTP",
    };
  }
  if (classified.kind === "special") {
    return {
      href,
      kind: "special",
      urlValid: true,
      httpStatus: null,
      status: "skipped",
      detail: classified.reason,
    };
  }
  return {
    href,
    kind: classified.kind,
    urlValid: true,
    httpStatus: null,
    status: "not_verifiable",
    detail: "Chưa kiểm tra HTTP",
  };
}

export function findingsFromLinkChecks(
  snapshot: PageSnapshot,
  checks: LinkCheckResult[],
): TestFinding[] {
  const results: TestFinding[] = [];
  const invalid = checks.filter((item) => !item.urlValid);
  results.push(
    invalid.length === 0
      ? finding({
          ruleId: "LNK-001",
          ruleName: "URL hợp lệ",
          group: "links",
          description: "Mỗi href phải phân tích được thành URL hợp lệ hoặc giao thức đặc biệt có chủ đích.",
          severity: "high",
          status: "passed",
          evidence: [`${checks.length} liên kết trong phạm vi quét`],
          recommendation: "Tránh href tương đối lỗi và ký tự không mã hóa.",
        })
      : finding({
          ruleId: "LNK-001",
          ruleName: "URL hợp lệ",
          group: "links",
          description: "Mỗi href phải phân tích được thành URL hợp lệ hoặc giao thức đặc biệt có chủ đích.",
          severity: "high",
          status: "failed",
          evidence: invalid.slice(0, 10).map((item) => `${item.href} (${item.detail})`),
          recommendation: "Sửa href không hợp lệ.",
        }),
  );

  const counts = {
    internal: checks.filter((item) => item.kind === "internal").length,
    external: checks.filter((item) => item.kind === "external").length,
    anchor: checks.filter((item) => item.kind === "anchor").length,
    special: checks.filter((item) => item.kind === "special").length,
  };
  results.push(
    finding({
      ruleId: "LNK-002",
      ruleName: "Phân loại liên kết",
      group: "links",
      description: "Phân loại nội bộ, ngoài, neo và đặc biệt.",
      severity: "info",
      status: "passed",
      evidence: [
        `internal=${counts.internal}`,
        `external=${counts.external}`,
        `anchor=${counts.anchor}`,
        `special=${counts.special}`,
      ],
      recommendation: "Dùng phân loại để ưu tiên kiểm tra thủ công liên kết ngoài.",
    }),
  );

  const httpFailed = checks.filter((item) => item.status === "failed" && item.httpStatus !== null);
  const httpOk = checks.filter((item) => item.status === "passed" && item.httpStatus !== null);
  const unverifiable = checks.filter((item) => item.status === "not_verifiable");
  if (httpOk.length + httpFailed.length === 0) {
    results.push(
      finding({
        ruleId: "LNK-003",
        ruleName: "Mã trạng thái HTTP",
        group: "links",
        description: "Ghi nhận HTTP status khi extension được phép kiểm tra.",
        severity: "medium",
        status: "not_verifiable",
        evidence: unverifiable.slice(0, 8).map((item) => `${item.href}: ${item.detail}`),
        recommendation: "Cấp quyền host tùy chọn nếu muốn kiểm tra HTTP. Không kết luận liên kết hỏng khi gặp CORS hoặc thiếu quyền.",
        unverifiableReason: "Không có mã HTTP nào được thu thập.",
      }),
    );
  } else if (httpFailed.length === 0) {
    results.push(
      finding({
        ruleId: "LNK-003",
        ruleName: "Mã trạng thái HTTP",
        group: "links",
        description: "Ghi nhận HTTP status khi extension được phép kiểm tra.",
        severity: "medium",
        status: "passed",
        evidence: httpOk.slice(0, 8).map((item) => `${item.href} → ${item.httpStatus}`),
        recommendation: "Vẫn nên kiểm tra thủ công các liên kết ngoài chưa đo được.",
      }),
    );
  } else {
    results.push(
      finding({
        ruleId: "LNK-003",
        ruleName: "Mã trạng thái HTTP",
        group: "links",
        description: "Ghi nhận HTTP status khi extension được phép kiểm tra.",
        severity: "high",
        status: "failed",
        evidence: httpFailed.slice(0, 8).map((item) => `${item.href} → ${item.httpStatus} (${item.detail})`),
        recommendation: "Sửa liên kết trả về 4xx/5xx trong phạm vi đã xác minh.",
      }),
    );
  }

  const jsLinks = snapshot.links.filter((item) => item.href.trim().toLowerCase().startsWith("javascript:"));
  results.push(
    jsLinks.length === 0
      ? finding({
          ruleId: "LNK-004",
          ruleName: "javascript: href",
          group: "links",
          description: "Không nên dùng javascript: làm href.",
          severity: "medium",
          status: "passed",
          evidence: ["Không có javascript: href"],
          recommendation: "Dùng button và event handler không nội tuyến.",
        })
      : finding({
          ruleId: "LNK-004",
          ruleName: "javascript: href",
          group: "links",
          description: "Không nên dùng javascript: làm href.",
          severity: "medium",
          status: "warning",
          evidence: jsLinks.slice(0, 5).map((item) => item.href),
          recommendation: "Thay bằng button hoặc URL thật.",
        }),
  );

  if (snapshot.limits.truncatedLinks) {
    results.push(
      finding({
        ruleId: "LNK-005",
        ruleName: "Giới hạn số liên kết",
        group: "links",
        description: "Snapshot cắt bớt liên kết để bảo vệ hiệu năng và bộ nhớ.",
        severity: "info",
        status: "warning",
        evidence: ["Một phần liên kết không được quét"],
        recommendation: "Tăng mức kiểm tra hoặc chia nhỏ trang. Không kết luận các liên kết chưa quét.",
      }),
    );
  }

  return results;
}

export function mapHttpOutcome(args: {
  href: string;
  kind: LinkCheckResult["kind"];
  statusCode: number | null;
  error: string | null;
  redirectedOffOrigin: boolean;
}): LinkCheckResult {
  if (args.redirectedOffOrigin) {
    return {
      href: args.href,
      kind: args.kind,
      urlValid: true,
      httpStatus: args.statusCode,
      status: "not_verifiable",
      detail: "Redirect sang origin khác — không tự theo để giữ phạm vi đã xác nhận",
    };
  }
  if (args.error) {
    const lower = args.error.toLowerCase();
    if (lower.includes("cors")) {
      return {
        href: args.href,
        kind: args.kind,
        urlValid: true,
        httpStatus: null,
        status: "not_verifiable",
        detail: "Lỗi CORS — không kết luận liên kết hỏng",
      };
    }
    if (lower.includes("timeout")) {
      return {
        href: args.href,
        kind: args.kind,
        urlValid: true,
        httpStatus: null,
        status: "not_verifiable",
        detail: "Timeout khi kiểm tra HTTP",
      };
    }
    if (lower.includes("401") || lower.includes("403") || lower.includes("auth")) {
      return {
        href: args.href,
        kind: args.kind,
        urlValid: true,
        httpStatus: args.statusCode,
        status: "not_verifiable",
        detail: "Yêu cầu xác thực — không bypass",
      };
    }
    if (lower.includes("permission") || lower.includes("failed to fetch") || lower.includes("network")) {
      return {
        href: args.href,
        kind: args.kind,
        urlValid: true,
        httpStatus: null,
        status: "not_verifiable",
        detail: args.error,
      };
    }
    return {
      href: args.href,
      kind: args.kind,
      urlValid: true,
      httpStatus: args.statusCode,
      status: "not_verifiable",
      detail: args.error,
    };
  }
  const code = args.statusCode;
  if (code === null) {
    return {
      href: args.href,
      kind: args.kind,
      urlValid: true,
      httpStatus: null,
      status: "not_verifiable",
      detail: "Không có mã trạng thái",
    };
  }
  if (code >= 200 && code < 400) {
    return {
      href: args.href,
      kind: args.kind,
      urlValid: true,
      httpStatus: code,
      status: "passed",
      detail: `HTTP ${code}`,
    };
  }
  if (code === 401 || code === 403) {
    return {
      href: args.href,
      kind: args.kind,
      urlValid: true,
      httpStatus: code,
      status: "not_verifiable",
      detail: `HTTP ${code} — cần xác thực, không kết luận hỏng`,
    };
  }
  if (code >= 400) {
    return {
      href: args.href,
      kind: args.kind,
      urlValid: true,
      httpStatus: code,
      status: "failed",
      detail: `HTTP ${code}`,
    };
  }
  return {
    href: args.href,
    kind: args.kind,
    urlValid: true,
    httpStatus: code,
    status: "not_verifiable",
    detail: `HTTP ${code}`,
  };
}

export function linkLimitForLevel(level: ScanLevel, settings: UserSettings): number {
  if (level === "basic") {
    return Math.min(20, settings.maxLinksToCheck);
  }
  if (level === "thorough") {
    return settings.maxLinksToCheck;
  }
  return Math.min(50, settings.maxLinksToCheck);
}
