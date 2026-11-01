import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { hostOriginsForScan, requestHostAccess } from "../../src/ui/hostAccess";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("quyền host khi bắt đầu kiểm thử", () => {
  it("xin đúng origin trang, không tự thêm <all_urls> khi không dò liên kết ngoài", () => {
    expect(hostOriginsForScan("http://127.0.0.1:4173/valid.html", false)).toEqual(["http://127.0.0.1:4173/*"]);
  });

  it("thêm http/https tùy chọn khi người dùng cho phép liên kết ngoài", () => {
    expect(hostOriginsForScan("https://example.com/path", true)).toEqual([
      "https://example.com/*",
      "http://*/*",
      "https://*/*",
    ]);
  });

  it("không tạo origin khi URL không hợp lệ", () => {
    expect(hostOriginsForScan("chrome://extensions", false)).toEqual([]);
  });

  it("service worker không gọi chrome.permissions.request", () => {
    const source = readFileSync(join(root, "src/background/index.ts"), "utf8");
    expect(source).not.toContain("permissions.request");
    expect(source).toContain("chrome.permissions");
    expect(source).toContain(".contains");
  });

  it("requestHostAccess gọi permissions.request với origins đã tính", async () => {
    const request = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("chrome", { permissions: { request } });
    const result = await requestHostAccess("https://example.com/", false);
    expect(request).toHaveBeenCalledWith({ origins: ["https://example.com/*"] });
    expect(result).toEqual({ granted: true, denied: false, origins: ["https://example.com/*"] });
    vi.unstubAllGlobals();
  });

  it("giữ nguyên lỗi user gesture từ Chrome API, không nuốt thành granted", async () => {
    vi.stubGlobal("chrome", {
      permissions: {
        request: vi.fn().mockRejectedValue(new Error("This function must be called during a user gesture")),
      },
    });
    const result = await requestHostAccess("http://127.0.0.1:4173/", false);
    expect(result.granted).toBe(false);
    expect(result.error).toMatch(/user gesture/);
    vi.unstubAllGlobals();
  });
});
