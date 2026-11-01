import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  type TestRun,
  type UserSettings,
} from "../shared/types";
import { computeStats } from "../shared/stats";

const MAX_BYTES_SOFT = 4_500_000;

export interface ExtensionStore {
  get(keys: string[] | string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

export function chromeStore(): ExtensionStore {
  return {
    get: (keys) => chrome.storage.local.get(keys),
    set: (items) => chrome.storage.local.set(items),
    remove: (keys) => chrome.storage.local.remove(keys),
  };
}

export function memoryStore(initial: Record<string, unknown> = {}): ExtensionStore {
  const data = { ...initial };
  return {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys];
      const out: Record<string, unknown> = {};
      for (const key of list) {
        if (key in data) {
          out[key] = data[key];
        }
      }
      return out;
    },
    async set(items) {
      Object.assign(data, items);
    },
    async remove(keys) {
      const list = Array.isArray(keys) ? keys : [keys];
      for (const key of list) {
        delete data[key];
      }
    },
  };
}

export async function loadSettings(store: ExtensionStore): Promise<UserSettings> {
  try {
    const bag = await store.get(STORAGE_KEYS.settings);
    const value = bag[STORAGE_KEYS.settings];
    if (!value || typeof value !== "object") {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...(value as UserSettings) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(store: ExtensionStore, settings: UserSettings): Promise<void> {
  await store.set({ [STORAGE_KEYS.settings]: settings });
}

export async function loadHistory(store: ExtensionStore): Promise<TestRun[]> {
  try {
    const bag = await store.get(STORAGE_KEYS.history);
    const value = bag[STORAGE_KEYS.history];
    if (!Array.isArray(value)) {
      return [];
    }
    return value as TestRun[];
  } catch (error) {
    throw new Error(
      `Không đọc được lịch sử lưu trữ: ${error instanceof Error ? error.message : "dữ liệu hỏng"}`,
    );
  }
}

export async function saveRun(store: ExtensionStore, run: TestRun): Promise<TestRun> {
  const settings = await loadSettings(store);
  const history = await loadHistory(store);
  const next = [run, ...history.filter((item) => item.id !== run.id)].slice(0, settings.maxHistoryItems);
  const trimmed = trimHistorySize(next);
  await store.set({ [STORAGE_KEYS.history]: trimmed });
  return run;
}

export async function deleteRun(store: ExtensionStore, runId: string): Promise<void> {
  const history = await loadHistory(store);
  await store.set({ [STORAGE_KEYS.history]: history.filter((item) => item.id !== runId) });
}

export async function clearHistory(store: ExtensionStore): Promise<void> {
  await store.set({ [STORAGE_KEYS.history]: [] });
  await store.remove(STORAGE_KEYS.activeRunId);
}

function trimHistorySize(runs: TestRun[]): TestRun[] {
  const clone = runs.map((run) => ({ ...run }));
  let encoded = jsonSize(clone);
  while (encoded > MAX_BYTES_SOFT && clone.length > 1) {
    clone.pop();
    encoded = jsonSize(clone);
  }
  if (encoded > MAX_BYTES_SOFT && clone[0]) {
    clone[0] = {
      ...clone[0],
      findings: clone[0].findings.map((item) => ({
        ...item,
        evidence: item.evidence.slice(0, 2),
      })),
      linkChecks: clone[0].linkChecks.slice(0, 20),
    };
  }
  return clone;
}

function jsonSize(value: unknown): number {
  return new Blob([JSON.stringify(value)]).size;
}

export function markStaleRuns(runs: TestRun[], now = Date.now()): TestRun[] {
  return runs.map((run) => {
    if (run.lifecycle !== "running") {
      return run;
    }
    const started = Date.parse(run.startedAt);
    if (Number.isNaN(started) || now - started < 3 * 60_000) {
      return run;
    }
    const ended = {
      ...run,
      lifecycle: "error" as const,
      endedAt: new Date(now).toISOString(),
      progressLabel: "Phiên bị gián đoạn (service worker dừng hoặc timeout)",
      errorMessage: "Phiên kiểm thử không hoàn tất. Hãy chạy lại.",
    };
    ended.stats = computeStats(ended.findings);
    return ended;
  });
}
