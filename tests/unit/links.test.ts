import { describe, expect, it } from "vitest";
import { mapHttpOutcome, toLinkCheckSkeleton } from "../../src/testing/rules/links";

describe("link classification outcomes", () => {
  it("CORS không phải failed", () => {
    const result = mapHttpOutcome({
      href: "https://other.test/",
      kind: "external",
      statusCode: null,
      error: "CORS blocked",
      redirectedOffOrigin: false,
    });
    expect(result.status).toBe("not_verifiable");
  });

  it("HTTP 404 là failed", () => {
    const result = mapHttpOutcome({
      href: "https://example.com/missing",
      kind: "internal",
      statusCode: 404,
      error: null,
      redirectedOffOrigin: false,
    });
    expect(result.status).toBe("failed");
  });

  it("HTTP 403 là not_verifiable", () => {
    const result = mapHttpOutcome({
      href: "https://example.com/admin",
      kind: "internal",
      statusCode: 403,
      error: null,
      redirectedOffOrigin: false,
    });
    expect(result.status).toBe("not_verifiable");
  });

  it("redirect ngoài origin không theo", () => {
    const result = mapHttpOutcome({
      href: "/go",
      kind: "internal",
      statusCode: 302,
      error: null,
      redirectedOffOrigin: true,
    });
    expect(result.status).toBe("not_verifiable");
  });

  it("javascript href là warning", () => {
    const result = toLinkCheckSkeleton("javascript:void(0)", "https://example.com/");
    expect(result.status).toBe("warning");
  });
});
