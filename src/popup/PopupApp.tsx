import { useEffect, useMemo, useState } from "react";
import { userMessageForError } from "../shared/errors";
import { ALL_GROUPS, type ScanLevel, type TestGroup, type TestRun } from "../shared/types";
import { formatSuccessRate } from "../shared/stats";
import { isRestrictedBrowserUrl, validateHttpUrl } from "../shared/url";
import { ErrorState, LoadingState, PrimaryButton, SecondaryButton, StatusBadge } from "../ui/components";
import { requestHostAccess } from "../ui/hostAccess";
import { openDashboardTab, sendMessage } from "../ui/messaging";

const GROUP_LABEL: Record<TestGroup, string> = {
  dom: "DOM",
  links: "Liên kết",
  forms: "Biểu mẫu",
  a11y: "Truy cập",
  performance: "Hiệu năng",
};

export function PopupApp() {
  const [tab, setTab] = useState<{ id: number; url: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [groups, setGroups] = useState<TestGroup[]>([...ALL_GROUPS]);
  const [level, setLevel] = useState<ScanLevel>("standard");
  const [owned, setOwned] = useState(false);
  const [noSubmit, setNoSubmit] = useState(false);
  const [external, setExternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<TestRun | null>(null);

  const urlState = useMemo(() => (tab ? validateHttpUrl(tab.url) : { ok: false, error: "Chưa có tab" }), [tab]);

  async function refresh() {
    setLoading(true);
    setLoadError(null);
    const tabRes = await sendMessage({ type: "GET_ACTIVE_TAB" });
    const runRes = await sendMessage({ type: "GET_ACTIVE_RUN" });
    if (!tabRes.ok) {
      setLoadError(userMessageForError(tabRes.error));
      setLoading(false);
      return;
    }
    setTab(tabRes.tab ?? null);
    if (runRes.ok) {
      setActive(runRes.run ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void sendMessage({ type: "GET_ACTIVE_RUN" }).then((res) => {
        if (res.ok) {
          setActive(res.run ?? null);
        }
      });
    }, 1200);
    return () => window.clearInterval(timer);
  }, []);

  async function start() {
    if (!tab) {
      return;
    }
    setBusy(true);
    setActionError(null);
    const access = await requestHostAccess(tab.url, external);
    if (access.error) {
      setActionError(userMessageForError(access.error));
      setBusy(false);
      return;
    }
    const res = await sendMessage({
      type: "START_RUN",
      payload: {
        tabId: tab.id,
        url: tab.url,
        groups,
        level,
        consent: {
          ownedOrAuthorized: owned,
          checkExternalLinks: external,
          acknowledgeNoLiveSubmit: noSubmit,
        },
      },
    });
    setBusy(false);
    if (!res.ok) {
      setActionError(userMessageForError(res.error));
      return;
    }
    setActive(res.run ?? null);
  }

  async function cancelActive() {
    if (!active) {
      return;
    }
    const res = await sendMessage({ type: "CANCEL_RUN", runId: active.id });
    if (!res.ok) {
      setActionError(userMessageForError(res.error));
      return;
    }
    setActive(res.run ?? null);
  }

  const restricted = tab ? isRestrictedBrowserUrl(tab.url) : true;

  return (
    <div className="p-4">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">WebTest Assistant</p>
        <h1 className="text-lg font-bold">Kiểm thử tab hiện tại</h1>
      </header>

      {loading ? <LoadingState label="Đang đọc tab…" /> : null}
      {loadError ? (
        <ErrorState title="Không đọc được tab" message={loadError} onRetry={() => void refresh()} />
      ) : null}
      {actionError ? (
        <ErrorState title="Không bắt đầu được phiên" message={actionError} onRetry={() => void start()} />
      ) : null}

      {tab && !loading ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Tab</p>
            <p className="truncate text-sm font-medium">{tab.title || "(không tiêu đề)"}</p>
            <p className="truncate text-xs text-slate-500">{tab.url}</p>
            {!urlState.ok ? <p className="mt-2 text-xs text-rose-700">{urlState.error}</p> : null}
            {restricted ? (
              <p className="mt-2 text-xs text-rose-700">Trang này không cho phép inject script.</p>
            ) : null}
          </div>

          {active && active.lifecycle === "running" ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <p className="text-sm font-medium">Đang chạy {active.progressPercent}%</p>
              <p className="text-xs text-slate-600">{active.progressLabel}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full bg-brand-600" style={{ width: `${active.progressPercent}%` }} />
              </div>
              <button type="button" className="mt-2 text-xs text-indigo-800 underline" onClick={() => void cancelActive()}>
                Hủy phiên
              </button>
            </div>
          ) : null}

          {active && active.lifecycle === "error" ? (
            <ErrorState
              title="Phiên kiểm thử lỗi"
              message={active.errorMessage ?? "Phiên không hoàn tất."}
              onRetry={() => void start()}
            />
          ) : null}

          {active && active.lifecycle === "cancelled" ? (
            <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-700">Phiên gần nhất đã bị hủy.</p>
          ) : null}

          {active && active.lifecycle === "completed" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="font-medium">Phiên gần nhất: {formatSuccessRate(active.stats.successRate)}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <StatusBadge status="passed" /> {active.stats.passed}
                <StatusBadge status="failed" /> {active.stats.failed}
              </div>
            </div>
          ) : null}

          <fieldset className="space-y-1">
            <legend className="text-xs font-semibold text-slate-600">Nhóm kiểm thử</legend>
            <div className="flex flex-wrap gap-2">
              {ALL_GROUPS.map((group) => (
                <label key={group} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={groups.includes(group)}
                    onChange={(event) => {
                      setGroups((current) =>
                        event.target.checked ? [...current, group] : current.filter((item) => item !== group),
                      );
                    }}
                  />
                  {GROUP_LABEL[group]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-xs font-semibold text-slate-600">
            Mức kiểm tra
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              value={level}
              onChange={(event) => setLevel(event.target.value as ScanLevel)}
            >
              <option value="basic">Cơ bản</option>
              <option value="standard">Tiêu chuẩn</option>
              <option value="thorough">Kỹ</option>
            </select>
          </label>

          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={owned} onChange={(event) => setOwned(event.target.checked)} />
            Tôi sở hữu website này hoặc được phép kiểm thử.
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={noSubmit} onChange={(event) => setNoSubmit(event.target.checked)} />
            Tôi hiểu công cụ không gửi form/dữ liệu thật và không vượt qua đăng nhập/CAPTCHA.
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={external} onChange={(event) => setExternal(event.target.checked)} />
            Cho phép kiểm tra HTTP liên kết ngoài (quyền host tùy chọn).
          </label>

          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              disabled={busy || !urlState.ok || restricted || !owned || !noSubmit || groups.length === 0}
              onClick={() => void start()}
            >
              {busy ? "Đang chạy…" : "Bắt đầu"}
            </PrimaryButton>
            <SecondaryButton onClick={() => void openDashboardTab()}>Dashboard</SecondaryButton>
            <SecondaryButton onClick={() => void openDashboardTab("#/help")}>Hướng dẫn</SecondaryButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
