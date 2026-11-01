import { describe, expect, it, vi } from "vitest";
import { DASHBOARD_HTML } from "../../src/shared/extensionPages";
import { openDashboardTab } from "../../src/ui/messaging";

describe("đường dẫn Dashboard", () => {
  it("dùng đường dẫn HTML cố định, không hardcode extension ID", () => {
    expect(DASHBOARD_HTML).toBe("src/dashboard/index.html");
    expect(DASHBOARD_HTML).not.toMatch(/chrome-extension:/);
  });

  it("mở tab có sẵn thay vì tạo trùng", async () => {
    const getURL = vi.fn((path: string) => `chrome-extension://testid/${path}`);
    const update = vi.fn().mockResolvedValue({});
    const create = vi.fn();
    vi.stubGlobal("chrome", {
      runtime: { getURL, sendMessage: vi.fn() },
      tabs: {
        query: vi.fn().mockResolvedValue([
          { id: 9, url: "chrome-extension://testid/src/dashboard/index.html#/" },
        ]),
        update,
        create,
      },
    });
    await openDashboardTab("#/help");
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(9, {
      url: "chrome-extension://testid/src/dashboard/index.html#/help",
      active: true,
    });
    vi.unstubAllGlobals();
  });

  it("tạo tab mới khi chưa có Dashboard", async () => {
    const getURL = vi.fn((path: string) => `chrome-extension://testid/${path}`);
    vi.stubGlobal("chrome", {
      runtime: { getURL },
      tabs: {
        query: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
        create: vi.fn().mockResolvedValue({}),
      },
    });
    await openDashboardTab();
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "chrome-extension://testid/src/dashboard/index.html",
    });
    vi.unstubAllGlobals();
  });
});
