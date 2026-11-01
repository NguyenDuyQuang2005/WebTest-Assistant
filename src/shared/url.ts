const BLOCKED_HOSTS = new Set([
  "chrome.google.com",
  "chromewebstore.google.com",
  "microsoftedge.microsoft.com",
]);

export interface UrlValidation {
  ok: boolean;
  normalized?: string;
  origin?: string;
  error?: string;
}

export function validateHttpUrl(input: string): UrlValidation {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "URL không được để trống." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "URL không hợp lệ. Hãy nhập dạng https://example.com" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      error: `Chỉ hỗ trợ HTTP/HTTPS. Giao thức ${parsed.protocol} bị từ chối.`,
    };
  }

  if (!parsed.hostname) {
    return { ok: false, error: "URL thiếu tên miền." };
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1" || host === "[::1]") {
    // Cho phép kiểm thử local trong môi trường phát triển/học tập.
  }

  if (BLOCKED_HOSTS.has(host)) {
    return { ok: false, error: "Không được kiểm thử trang cửa hàng tiện ích." };
  }

  return {
    ok: true,
    normalized: parsed.href,
    origin: parsed.origin,
  };
}

export function isRestrictedBrowserUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.startsWith("chrome://") ||
    lower.startsWith("chrome-extension://") ||
    lower.startsWith("edge://") ||
    lower.startsWith("about:") ||
    lower.startsWith("devtools://") ||
    lower.startsWith("view-source:") ||
    lower.startsWith("https://chrome.google.com/webstore") ||
    lower.startsWith("https://chromewebstore.google.com")
  );
}

export function classifyLink(href: string, pageUrl: string): {
  kind: "internal" | "external" | "anchor" | "special";
  valid: boolean;
  reason: string;
} {
  const raw = href.trim();
  if (!raw) {
    return { kind: "special", valid: false, reason: "href trống" };
  }
  if (raw.startsWith("#")) {
    return { kind: "anchor", valid: true, reason: "liên kết neo trong trang" };
  }
  const special = /^(mailto:|tel:|sms:|javascript:|data:|blob:)/i;
  if (special.test(raw)) {
    const valid = !raw.toLowerCase().startsWith("javascript:") && !raw.toLowerCase().startsWith("data:");
    return {
      kind: "special",
      valid,
      reason: raw.toLowerCase().startsWith("javascript:")
        ? "javascript: không nên dùng cho liên kết"
        : "giao thức đặc biệt",
    };
  }

  try {
    const resolved = new URL(raw, pageUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return { kind: "special", valid: false, reason: `giao thức ${resolved.protocol}` };
    }
    const page = new URL(pageUrl);
    const kind = resolved.origin === page.origin ? "internal" : "external";
    return { kind, valid: true, reason: kind === "internal" ? "cùng origin" : "khác origin" };
  } catch {
    return { kind: "special", valid: false, reason: "không phân tích được URL" };
  }
}

export function originPattern(origin: string): string {
  return `${origin}/*`;
}
