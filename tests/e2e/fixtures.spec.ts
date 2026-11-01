import { expect, test } from "@playwright/test";
import { collectPageSnapshot } from "../../src/content/collectPageSnapshot";
import { runA11yRules } from "../../src/testing/rules/a11y";
import { runDomRules } from "../../src/testing/rules/dom";
import { runFormRules } from "../../src/testing/rules/forms";
import { classifyLink } from "../../src/shared/url";

test("website hợp lệ có title và h1", async ({ page }) => {
  await page.goto("/valid");
  expect(await page.title()).toBe("Trang hợp lệ");
  await expect(page.locator("h1")).toHaveText("Trang hợp lệ");
});

test("trang thiếu title", async ({ page }) => {
  await page.goto("/missing-title");
  expect(await page.title()).toBe("");
  const snapshot = await page.evaluate(collectPageSnapshot);
  const findings = runDomRules(snapshot, "standard");
  expect(findings.find((item) => item.ruleId === "DOM-001")?.status).toBe("failed");
});

test("ảnh thiếu alt", async ({ page }) => {
  await page.goto("/missing-alt");
  const snapshot = await page.evaluate(collectPageSnapshot);
  expect(snapshot.images.some((img) => !img.hasAltAttribute)).toBe(true);
  expect(runDomRules(snapshot, "standard").find((item) => item.ruleId === "DOM-003")?.status).toBe("failed");
});

test("form thiếu label", async ({ page }) => {
  await page.goto("/form-no-label");
  const snapshot = await page.evaluate(collectPageSnapshot);
  expect(snapshot.controls.some((item) => item.tag === "input" && !item.label)).toBe(true);
  expect(runDomRules(snapshot, "standard").find((item) => item.ruleId === "DOM-004")?.status).toBe("failed");
  expect(runFormRules(snapshot, "standard").length).toBeGreaterThan(0);
  expect(runA11yRules(snapshot, "standard").find((item) => item.ruleId === "A11Y-002")?.status).toBe("failed");
});

test("link URL không hợp lệ", async ({ page }) => {
  await page.goto("/invalid-link");
  const snapshot = await page.evaluate(collectPageSnapshot);
  expect(snapshot.links.some((item) => !item.href)).toBe(true);
  expect(classifyLink("http://[", snapshot.url).valid).toBe(false);
  expect(runDomRules(snapshot, "standard").find((item) => item.ruleId === "DOM-008")?.status).toBe("failed");
});

test("website trả về lỗi HTTP", async ({ request }) => {
  const res = await request.get("/http-error");
  expect(res.status()).toBe(500);
});

test("trang tải chậm", async ({ page }) => {
  const started = Date.now();
  await page.goto("/slow");
  expect(Date.now() - started).toBeGreaterThan(1000);
  expect(await page.title()).toBe("Trang chậm");
});

test("trang không thể truy cập", async ({ request }) => {
  const res = await request.get("/no-such-page");
  expect(res.status()).toBe(404);
});
