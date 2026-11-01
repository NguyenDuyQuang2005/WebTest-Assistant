import { describe, expect, it } from "vitest";
import { clearHistory, loadHistory, markStaleRuns, memoryStore, saveRun } from "../../src/storage/history";
import { computeStats } from "../../src/shared/stats";
import type { TestRun } from "../../src/shared/types";

function run(partial: Partial<TestRun> = {}): TestRun {
  return {
    id: "run-1",
    targetUrl: "https://example.com/",
    tabId: 1,
    startedAt: new Date().toISOString(),
    endedAt: null,
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
    ...partial,
  };
}

describe("history store", () => {
  it("lưu và đọc phiên", async () => {
    const store = memoryStore();
    await saveRun(store, run());
    const history = await loadHistory(store);
    expect(history).toHaveLength(1);
    expect(history[0]?.targetUrl).toBe("https://example.com/");
  });

  it("xóa lịch sử", async () => {
    const store = memoryStore();
    await saveRun(store, run());
    await clearHistory(store);
    expect(await loadHistory(store)).toEqual([]);
  });

  it("đánh dấu phiên running quá hạn", () => {
    const stale = markStaleRuns(
      [run({ lifecycle: "running", startedAt: new Date(Date.now() - 10 * 60_000).toISOString() })],
      Date.now(),
    );
    expect(stale[0]?.lifecycle).toBe("error");
  });
});
