import { collectPageSnapshot } from "../content/collectPageSnapshot";
import { serializeReportJson } from "../reports/json";
import {
  chromeStore,
  clearHistory,
  deleteRun,
  loadHistory,
  loadSettings,
  markStaleRuns,
  saveRun,
  saveSettings,
} from "../storage/history";
import { createId } from "../shared/id";
import { computeStats } from "../shared/stats";
import type {
  ExtensionMessage,
  ExtensionResponse,
  PageSnapshot,
  ScanLevel,
  TestGroup,
  TestRun,
  UserSettings,
} from "../shared/types";
import { ALL_GROUPS, STORAGE_KEYS } from "../shared/types";
import { isRestrictedBrowserUrl, originPattern, validateHttpUrl } from "../shared/url";
import { evaluateSnapshot } from "../testing/engine";
import { probeMany } from "../testing/linkProbe";
import { findingsFromLinkChecks, linkLimitForLevel, selectLinksForCheck } from "../testing/rules/links";
import { runAxeOnTab } from "./axeRunner";

const store = chromeStore();
const cancelFlags = new Map<string, boolean>();

chrome.runtime.onInstalled.addListener(() => {
  void recoverStale();
});

chrome.runtime.onStartup.addListener(() => {
  void recoverStale();
});

async function recoverStale(): Promise<void> {
  try {
    const history = markStaleRuns(await loadHistory(store));
    await store.set({ "wta.history": history });
  } catch (error) {
    console.error("Không khôi phục được lịch sử", error);
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  void handle(message)
    .then((response) => sendResponse(response))
    .catch((error: unknown) => {
      const text = error instanceof Error ? error.message : "Lỗi không xác định";
      sendResponse({ ok: false, error: text } satisfies ExtensionResponse);
    });
  return true;
});

async function handle(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case "GET_ACTIVE_TAB": {
      const tab = await getActiveTab();
      if (!tab.id || !tab.url) {
        return { ok: false, error: "Không tìm thấy tab đang hoạt động." };
      }
      return { ok: true, tab: { id: tab.id, url: tab.url, title: tab.title ?? "" } };
    }
    case "GET_HISTORY": {
      const runs = markStaleRuns(await loadHistory(store));
      return { ok: true, runs };
    }
    case "GET_RUN": {
      const runs = await loadHistory(store);
      const run = runs.find((item) => item.id === message.runId);
      if (!run) {
        return { ok: false, error: "Không tìm thấy phiên kiểm thử." };
      }
      return { ok: true, run };
    }
    case "GET_ACTIVE_RUN": {
      const runs = markStaleRuns(await loadHistory(store));
      const running = runs.find((item) => item.lifecycle === "running");
      const run = running ?? runs[0];
      return run ? { ok: true, run } : { ok: true };
    }
    case "DELETE_RUN": {
      await deleteRun(store, message.runId);
      return { ok: true };
    }
    case "CLEAR_HISTORY": {
      await clearHistory(store);
      return { ok: true };
    }
    case "GET_SETTINGS": {
      return { ok: true, settings: await loadSettings(store) };
    }
    case "SAVE_SETTINGS": {
      await saveSettings(store, message.payload);
      return { ok: true, settings: message.payload };
    }
    case "CANCEL_RUN": {
      await persistCancel(message.runId);
      const runs = await loadHistory(store);
      const current = runs.find((item) => item.id === message.runId);
      if (current && current.lifecycle === "running") {
        current.lifecycle = "cancelled";
        current.endedAt = new Date().toISOString();
        current.progressLabel = "Đã hủy";
        current.stats = computeStats(current.findings);
        await saveRun(store, current);
      }
      return current ? { ok: true, run: current } : { ok: true };
    }
    case "START_RUN": {
      const run = await startRun(message.payload);
      return { ok: true, run };
    }
    default:
      return { ok: false, error: "Yêu cầu không hỗ trợ." };
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    throw new Error("Không có tab đang hoạt động.");
  }
  return tab;
}

async function startRun(payload: {
  tabId: number;
  url: string;
  groups: TestGroup[];
  level: ScanLevel;
  consent: TestRun["consent"];
}): Promise<TestRun> {
  if (!payload.consent.ownedOrAuthorized) {
    throw new Error("Bạn cần xác nhận website nằm trong phạm vi được phép kiểm thử.");
  }
  if (!payload.consent.acknowledgeNoLiveSubmit) {
    throw new Error("Bạn cần xác nhận không gửi dữ liệu thật lên website.");
  }
  if (payload.groups.length === 0) {
    throw new Error("Chọn ít nhất một nhóm kiểm thử.");
  }

  const urlCheck = validateHttpUrl(payload.url);
  if (!urlCheck.ok || !urlCheck.normalized || !urlCheck.origin) {
    throw new Error(urlCheck.error ?? "URL không hợp lệ.");
  }
  if (isRestrictedBrowserUrl(urlCheck.normalized)) {
    throw new Error("Không thể inject script vào trang trình duyệt bị hạn chế.");
  }

  const groups = payload.groups.filter((item) => ALL_GROUPS.includes(item));
  const settings = await loadSettings(store);
  await abortOtherRunningRuns();

  const hostGranted = await chrome.permissions
    .contains({ origins: [originPattern(urlCheck.origin)] })
    .catch(() => false);

  const run: TestRun = {
    id: createId("run"),
    targetUrl: urlCheck.normalized,
    tabId: payload.tabId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    groups,
    level: payload.level,
    lifecycle: "running",
    progressPercent: 5,
    progressLabel: hostGranted
      ? "Đang chuẩn bị…"
      : "Thiếu quyền host tùy chọn — kiểm tra HTTP có thể Không thể xác minh. Đang thu thập DOM bằng activeTab…",
    findings: [],
    stats: computeStats([]),
    performance: null,
    linkChecks: [],
    errorMessage: null,
    consent: payload.consent,
  };
  cancelFlags.set(run.id, false);
  await saveRun(store, run);

  void executeRun(run, settings, urlCheck.origin).catch(async (error: unknown) => {
    if (await isCancelled(run.id)) {
      return;
    }
    run.lifecycle = "error";
    run.endedAt = new Date().toISOString();
    run.errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
    run.progressLabel = "Lỗi";
    run.stats = computeStats(run.findings);
    await saveRun(store, run);
  });
  return run;
}

async function abortOtherRunningRuns(): Promise<void> {
  const history = await loadHistory(store);
  for (const item of history) {
    if (item.lifecycle === "running") {
      item.lifecycle = "error";
      item.endedAt = new Date().toISOString();
      item.progressLabel = "Đã dừng vì có phiên mới";
      item.errorMessage = "Phiên trước chưa hoàn tất và đã được thay bằng phiên mới.";
      item.stats = computeStats(item.findings);
      await persistCancel(item.id);
      await saveRun(store, item);
    }
  }
}

async function persistCancel(runId: string): Promise<void> {
  cancelFlags.set(runId, true);
  try {
    const bag = await chrome.storage.local.get(STORAGE_KEYS.cancelFlags);
    const current = bag[STORAGE_KEYS.cancelFlags];
    const flags =
      current && typeof current === "object" && !Array.isArray(current)
        ? { ...(current as Record<string, boolean>) }
        : {};
    flags[runId] = true;
    await chrome.storage.local.set({ [STORAGE_KEYS.cancelFlags]: flags });
  } catch (error) {
    console.error("Không lưu được cờ hủy phiên", error);
  }
}

async function executeRun(run: TestRun, settings: UserSettings, origin: string): Promise<void> {
  if (!run.tabId) {
    throw new Error("Thiếu tabId.");
  }
  await update(run, 15, "Đang thu thập DOM…");
  const snapshot = await collectSnapshot(run.tabId);
  if (await isCancelled(run.id)) {
    return;
  }

  await update(run, 35, "Đang áp dụng quy tắc…");
  const evaluated = evaluateSnapshot({
    snapshot,
    groups: run.groups,
    level: run.level,
    settings,
  });
  run.findings = evaluated.findings.filter((item) => item.group !== "links");
  run.performance = evaluated.performance;

  if (run.groups.includes("a11y") && run.level !== "basic") {
    await update(run, 50, "Đang chạy axe-core…");
    try {
      const axeFindings = await runAxeOnTab(run.tabId);
      run.findings.push(...axeFindings);
    } catch (error) {
      run.findings.push({
        id: createId("A11Y-AXE"),
        ruleId: "A11Y-AXE",
        ruleName: "axe-core",
        group: "a11y",
        description: "Không chạy được axe-core trên tab này.",
        severity: "medium",
        status: "not_verifiable",
        evidence: [error instanceof Error ? error.message : "inject thất bại"],
        recommendation: "Dùng các quy tắc a11y tĩnh. Không kết luận tuân thủ WCAG.",
        unverifiableReason: "Không inject được axe-core",
      });
    }
  }

  if (run.groups.includes("links")) {
    await update(run, 65, "Đang kiểm tra liên kết…");
    const selected = selectLinksForCheck(snapshot, run.level, linkLimitForLevel(run.level, settings));
    const skeletons = evaluated.pendingLinks.filter((item) =>
      selected.some((link) => link.href === item.href),
    );
    const httpResults = await probeMany(skeletons, {
      pageOrigin: origin,
      timeoutMs: settings.linkTimeoutMs,
      concurrency: settings.linkConcurrency,
      allowExternal: run.consent.checkExternalLinks,
      shouldCancel: () => isCancelled(run.id),
      onProgress: async (done, total) => {
        const pct = 65 + Math.round((done / Math.max(total, 1)) * 20);
        await update(run, pct, `Đang kiểm tra liên kết ${done}/${total}…`);
      },
    });
    const merged = skeletons.map((item) => httpResults.find((res) => res.href === item.href) ?? item);
    run.linkChecks = merged;
    run.findings = run.findings.filter((item) => item.group !== "links");
    run.findings.push(...findingsFromLinkChecks(snapshot, merged));
  }

  if (await isCancelled(run.id)) {
    return;
  }

  run.lifecycle = "completed";
  run.endedAt = new Date().toISOString();
  run.progressPercent = 100;
  run.progressLabel = "Hoàn tất";
  run.stats = computeStats(run.findings);
  await saveRun(store, run);
}

async function collectSnapshot(tabId: number): Promise<PageSnapshot> {
  try {
    const injected = await chrome.scripting.executeScript({
      target: { tabId },
      world: "ISOLATED",
      func: collectPageSnapshot,
    });
    const snapshot = injected[0]?.result;
    if (!snapshot) {
      throw new Error("Không thu thập được DOM.");
    }
    return snapshot;
  } catch (error) {
    const text = error instanceof Error ? error.message : "Không inject được script";
    if (text.toLowerCase().includes("cannot access") || text.toLowerCase().includes("chrome://")) {
      throw new Error("Tab không hỗ trợ inject script (chrome://, Web Store hoặc trang bị hạn chế).");
    }
    throw new Error(text);
  }
}

async function update(run: TestRun, percent: number, label: string): Promise<void> {
  run.progressPercent = percent;
  run.progressLabel = label;
  run.stats = computeStats(run.findings);
  await saveRun(store, run);
}

async function isCancelled(runId: string): Promise<boolean> {
  if (cancelFlags.get(runId) === true) {
    return true;
  }
  try {
    const bag = await chrome.storage.local.get(STORAGE_KEYS.cancelFlags);
    const current = bag[STORAGE_KEYS.cancelFlags];
    if (current && typeof current === "object" && !Array.isArray(current)) {
      return (current as Record<string, boolean>)[runId] === true;
    }
  } catch (error) {
    console.error("Không đọc được cờ hủy phiên", error);
  }
  return false;
}

export function reportPreview(run: TestRun): string {
  return serializeReportJson(run);
}
