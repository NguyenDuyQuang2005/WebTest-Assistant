import type { LinkCheckResult } from "../shared/types";
import { mapHttpOutcome } from "./rules/links";

export async function probeHttpUrl(args: {
  href: string;
  pageOrigin: string;
  timeoutMs: number;
  allowExternal: boolean;
}): Promise<LinkCheckResult> {
  const classifiedKind = (() => {
    try {
      const url = new URL(args.href, args.pageOrigin);
      return url.origin === args.pageOrigin ? "internal" : "external";
    } catch {
      return "special" as const;
    }
  })();

  if (classifiedKind === "external" && !args.allowExternal) {
    return {
      href: args.href,
      kind: "external",
      urlValid: true,
      httpStatus: null,
      status: "not_verifiable",
      detail: "Liên kết ngoài: chưa cấp quyền host / không gửi request ngoài phạm vi",
    };
  }

  let target: URL;
  try {
    target = new URL(args.href, args.pageOrigin);
  } catch {
    return {
      href: args.href,
      kind: "special",
      urlValid: false,
      httpStatus: null,
      status: "failed",
      detail: "URL không hợp lệ",
    };
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return {
      href: args.href,
      kind: "special",
      urlValid: false,
      httpStatus: null,
      status: "skipped",
      detail: `Không kiểm tra giao thức ${target.protocol}`,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs);
  try {
    const head = await fetch(target.href, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
    });
    const redirectedOffOrigin = isOffOriginRedirect(head, args.pageOrigin, args.allowExternal);
    if (head.status === 405 || head.status === 501) {
      const getRes = await fetch(target.href, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
      });
      const off = isOffOriginRedirect(getRes, args.pageOrigin, args.allowExternal);
      return mapHttpOutcome({
        href: args.href,
        kind: classifiedKind,
        statusCode: getRes.status,
        error: null,
        redirectedOffOrigin: off,
      });
    }
    return mapHttpOutcome({
      href: args.href,
      kind: classifiedKind,
      statusCode: head.status,
      error: null,
      redirectedOffOrigin,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return mapHttpOutcome({
      href: args.href,
      kind: classifiedKind,
      statusCode: null,
      error: timedOut ? "timeout" : message,
      redirectedOffOrigin: false,
    });
  } finally {
    clearTimeout(timer);
  }
}

function isOffOriginRedirect(response: Response, pageOrigin: string, allowExternal: boolean): boolean {
  if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
    const location = response.headers.get("location");
    if (!location) {
      return false;
    }
    try {
      const next = new URL(location, pageOrigin);
      if (next.origin !== pageOrigin && !allowExternal) {
        return true;
      }
    } catch {
      return true;
    }
  }
  return false;
}

export async function probeMany(
  items: Array<{ href: string; kind: LinkCheckResult["kind"]; urlValid: boolean }>,
  options: {
    pageOrigin: string;
    timeoutMs: number;
    concurrency: number;
    allowExternal: boolean;
    shouldCancel: () => Promise<boolean>;
    onProgress?: (done: number, total: number) => Promise<void> | void;
  },
): Promise<LinkCheckResult[]> {
  const httpItems = items.filter(
    (item) => item.urlValid && (item.kind === "internal" || item.kind === "external"),
  );
  const skipped = items.filter((item) => !httpItems.includes(item));
  const results: LinkCheckResult[] = [];
  let index = 0;
  let done = 0;

  async function worker(): Promise<void> {
    while (index < httpItems.length) {
      if (await options.shouldCancel()) {
        return;
      }
      const current = httpItems[index];
      index += 1;
      if (!current) {
        continue;
      }
      const probed = await probeHttpUrl({
        href: current.href,
        pageOrigin: options.pageOrigin,
        timeoutMs: options.timeoutMs,
        allowExternal: options.allowExternal && current.kind === "external" ? true : current.kind === "internal",
      });
      results.push(probed);
      done += 1;
      await options.onProgress?.(done, httpItems.length);
    }
  }

  const workers = Array.from({ length: Math.max(1, options.concurrency) }, () => worker());
  await Promise.all(workers);
  const rest: LinkCheckResult[] = skipped.map((item) => ({
    href: item.href,
    kind: item.kind,
    urlValid: item.urlValid,
    httpStatus: null,
    status: item.urlValid ? "skipped" : "failed",
    detail: item.urlValid ? "Không gửi HTTP cho loại liên kết này" : "URL không hợp lệ",
  }));
  return [...results, ...rest];
}
