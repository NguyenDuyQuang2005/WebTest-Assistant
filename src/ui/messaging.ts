import { DASHBOARD_HTML } from "../shared/extensionPages";
import type { ExtensionMessage, ExtensionResponse, TestRun, UserSettings } from "../shared/types";

const MESSAGE_TIMEOUT_MS = 20_000;

export async function sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  try {
    const response = (await Promise.race([
      chrome.runtime.sendMessage(message) as Promise<ExtensionResponse | undefined>,
      new Promise<undefined>((resolve) => {
        setTimeout(() => resolve(undefined), MESSAGE_TIMEOUT_MS);
      }),
    ])) as ExtensionResponse | undefined;
    if (!response) {
      return { ok: false, error: "Service worker không phản hồi. Hãy thử lại." };
    }
    return response;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không gửi được thông điệp tới service worker.",
    };
  }
}

export async function fetchHistory(): Promise<TestRun[]> {
  const res = await sendMessage({ type: "GET_HISTORY" });
  if (!res.ok) {
    throw new Error(res.error);
  }
  return res.runs ?? [];
}

export async function fetchSettings(): Promise<UserSettings> {
  const res = await sendMessage({ type: "GET_SETTINGS" });
  if (!res.ok || !res.settings) {
    throw new Error(res.ok ? "Thiếu cấu hình" : res.error);
  }
  return res.settings;
}

export async function fetchRun(runId: string): Promise<TestRun> {
  const res = await sendMessage({ type: "GET_RUN", runId });
  if (!res.ok || !res.run) {
    throw new Error(res.ok ? "Thiếu dữ liệu phiên" : res.error);
  }
  return res.run;
}

export async function openDashboardTab(hash = ""): Promise<void> {
  const page = chrome.runtime.getURL(DASHBOARD_HTML);
  const target = `${page}${hash}`;
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((tab) => typeof tab.url === "string" && tab.url.startsWith(page) && tab.id);
  if (existing?.id) {
    await chrome.tabs.update(existing.id, { url: target, active: true });
    return;
  }
  await chrome.tabs.create({ url: target });
}
