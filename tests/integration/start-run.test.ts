import { describe, expect, it } from "vitest";
import { validateHttpUrl } from "../../src/shared/url";
import { ALL_GROUPS, type StartRunRequest } from "../../src/shared/types";

function canStart(payload: StartRunRequest): { ok: boolean; error?: string } {
  if (!payload.consent.ownedOrAuthorized) {
    return { ok: false, error: "cần xác nhận phạm vi" };
  }
  if (!payload.consent.acknowledgeNoLiveSubmit) {
    return { ok: false, error: "cần xác nhận không gửi dữ liệu thật" };
  }
  if (payload.groups.length === 0) {
    return { ok: false, error: "chọn nhóm" };
  }
  const url = validateHttpUrl(payload.url);
  if (!url.ok) {
    return { ok: false, error: url.error ?? "URL không hợp lệ" };
  }
  return { ok: true };
}

describe("khởi tạo phiên", () => {
  const base: StartRunRequest = {
    tabId: 1,
    url: "https://example.com",
    groups: [...ALL_GROUPS],
    level: "standard",
    consent: { ownedOrAuthorized: true, checkExternalLinks: false, acknowledgeNoLiveSubmit: true },
  };

  it("cho phép phiên hợp lệ", () => {
    expect(canStart(base).ok).toBe(true);
  });

  it("từ chối khi chưa xác nhận quyền kiểm thử", () => {
    expect(canStart({ ...base, consent: { ...base.consent, ownedOrAuthorized: false } }).ok).toBe(false);
  });

  it("từ chối URL không hợp lệ", () => {
    expect(canStart({ ...base, url: "ftp://x" }).ok).toBe(false);
  });

  it("từ chối khi không chọn nhóm", () => {
    expect(canStart({ ...base, groups: [] }).ok).toBe(false);
  });
});
