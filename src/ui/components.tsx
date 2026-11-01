import type { ReactNode } from "react";
import type { TestStatus } from "../shared/types";

export function StatusBadge({ status }: { status: TestStatus }) {
  const map: Record<TestStatus, string> = {
    passed: "bg-emerald-100 text-emerald-800",
    failed: "bg-rose-100 text-rose-800",
    warning: "bg-amber-100 text-amber-800",
    skipped: "bg-slate-200 text-slate-700",
    not_verifiable: "bg-indigo-100 text-indigo-800",
  };
  const label: Record<TestStatus, string> = {
    passed: "Passed",
    failed: "Failed",
    warning: "Warning",
    skipped: "Skipped",
    not_verifiable: "Không thể xác minh",
  };
  return <span className={`badge ${map[status]}`}>{label[status]}</span>;
}

export function StatCard(props: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className={`mt-1 text-2xl font-semibold ${props.tone ?? "text-slate-900"}`}>{props.value}</p>
      {props.hint ? <p className="mt-1 text-xs text-slate-500">{props.hint}</p> : null}
    </div>
  );
}

export function EmptyState(props: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-lg font-semibold">{props.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{props.detail}</p>
      {props.action ? <div className="mt-4">{props.action}</div> : null}
    </div>
  );
}

export function ErrorState(props: { message: string; title?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
      <p className="font-semibold">{props.title ?? "Không tải được dữ liệu"}</p>
      <p className="mt-1 text-sm">{props.message}</p>
      {props.onRetry ? (
        <button className="mt-3 rounded-lg bg-rose-700 px-3 py-1.5 text-sm text-white" onClick={props.onRetry} type="button">
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}

export function PrimaryButton(props: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {props.children}
    </button>
  );
}

export function SecondaryButton(props: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {props.children}
    </button>
  );
}
