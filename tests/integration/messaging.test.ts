import { describe, expect, it } from "vitest";
import type { ExtensionMessage, ExtensionResponse, TestRun } from "../../src/shared/types";
import { computeStats } from "../../src/shared/stats";
import { memoryStore, saveRun, loadHistory } from "../../src/storage/history";

function fakeRuntime(store: ReturnType<typeof memoryStore>) {
  return async (message: ExtensionMessage): Promise<ExtensionResponse> => {
    if (message.type === "GET_HISTORY") {
      return { ok: true, runs: await loadHistory(store) };
    }
    if (message.type === "GET_RUN") {
      const runs = await loadHistory(store);
      const run = runs.find((item) => item.id === message.runId);
      return run ? { ok: true, run } : { ok: false, error: "missing" };
    }
    return { ok: false, error: "unsupported" };
  };
}

describe("message passing lưu kết quả", () => {
  it("GET_HISTORY trả về phiên đã lưu", async () => {
    const store = memoryStore();
    const run: TestRun = {
      id: "run-msg",
      targetUrl: "https://example.com/",
      tabId: 2,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      groups: ["dom"],
      level: "basic",
      lifecycle: "completed",
      progressPercent: 100,
      progressLabel: "xong",
      findings: [],
      stats: computeStats([]),
      performance: null,
      linkChecks: [],
      errorMessage: null,
      consent: { ownedOrAuthorized: true, checkExternalLinks: false, acknowledgeNoLiveSubmit: true },
    };
    await saveRun(store, run);
    const send = fakeRuntime(store);
    const res = await send({ type: "GET_HISTORY" });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.runs?.[0]?.id).toBe("run-msg");
    }
    const one = await send({ type: "GET_RUN", runId: "run-msg" });
    expect(one.ok).toBe(true);
  });

  it("GET_RUN thiếu id là lỗi", async () => {
    const send = fakeRuntime(memoryStore());
    const res = await send({ type: "GET_RUN", runId: "nope" });
    expect(res.ok).toBe(false);
  });
});
