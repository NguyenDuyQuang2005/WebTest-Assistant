import { describe, expect, it } from "vitest";
import { classifyLink, isRestrictedBrowserUrl, validateHttpUrl } from "../../src/shared/url";

describe("validateHttpUrl", () => {
  it("chấp nhận https hợp lệ", () => {
    const result = validateHttpUrl("https://example.com/path");
    expect(result.ok).toBe(true);
    expect(result.origin).toBe("https://example.com");
  });

  it("từ chối chuỗi rỗng", () => {
    expect(validateHttpUrl("   ").ok).toBe(false);
  });

  it("từ chối chrome://", () => {
    const result = validateHttpUrl("chrome://extensions");
    expect(result.ok).toBe(false);
  });

  it("từ chối web store", () => {
    expect(validateHttpUrl("https://chromewebstore.google.com/detail/x").ok).toBe(false);
  });
});

describe("isRestrictedBrowserUrl", () => {
  it("nhận diện trang bị cấm inject", () => {
    expect(isRestrictedBrowserUrl("chrome://settings")).toBe(true);
    expect(isRestrictedBrowserUrl("https://example.com")).toBe(false);
  });
});

describe("classifyLink", () => {
  const page = "https://example.com/page";

  it("phân loại nội bộ", () => {
    expect(classifyLink("/about", page).kind).toBe("internal");
  });

  it("phân loại ngoài", () => {
    expect(classifyLink("https://other.test/", page).kind).toBe("external");
  });

  it("phân loại neo", () => {
    expect(classifyLink("#main", page).kind).toBe("anchor");
  });

  it("javascript: không hợp lệ", () => {
    const result = classifyLink("javascript:alert(1)", page);
    expect(result.kind).toBe("special");
    expect(result.valid).toBe(false);
  });

  it("href trống không hợp lệ", () => {
    expect(classifyLink("  ", page).valid).toBe(false);
  });
});
