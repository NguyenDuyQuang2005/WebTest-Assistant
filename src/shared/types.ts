export type TestStatus =
  | "passed"
  | "failed"
  | "warning"
  | "skipped"
  | "not_verifiable";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type TestGroup = "dom" | "links" | "forms" | "a11y" | "performance";

export type ScanLevel = "basic" | "standard" | "thorough";

export type RunLifecycle = "running" | "completed" | "cancelled" | "error";

export type LinkKind = "internal" | "external" | "anchor" | "special";

export interface TestFinding {
  id: string;
  ruleId: string;
  ruleName: string;
  group: TestGroup;
  description: string;
  severity: Severity;
  status: TestStatus;
  evidence: string[];
  recommendation: string;
  unverifiableReason?: string;
}

export interface TestStats {
  total: number;
  passed: number;
  failed: number;
  warning: number;
  skipped: number;
  notVerifiable: number;
  /** Passed / (Passed + Failed + Warning) * 100. null khi không có kiểm tra đủ điều kiện. */
  successRate: number | null;
}

export interface PerformanceMetric {
  name: string;
  valueMs: number | null;
  kind: "measured" | "estimated" | "unavailable";
  note: string;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  thresholds: PerformanceThresholds;
}

export interface PerformanceThresholds {
  ttfbMs: number;
  domContentLoadedMs: number;
  loadEventMs: number;
}

export interface CollectedImage {
  src: string;
  alt: string | null;
  hasAltAttribute: boolean;
  role: string | null;
  decorative: boolean;
}

export interface CollectedLink {
  href: string;
  text: string;
  name: string;
  target: string | null;
  rel: string | null;
}

export interface CollectedControl {
  tag: string;
  type: string | null;
  name: string | null;
  id: string | null;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  label: string | null;
  placeholder: string | null;
  autocomplete: string | null;
  validationAttrs: string[];
  accessibleName: string;
}

export interface CollectedForm {
  id: string | null;
  name: string | null;
  method: string | null;
  action: string | null;
  hasPasswordField: boolean;
  controlCount: number;
}

export interface CollectedHeading {
  level: number;
  text: string;
}

export interface PageSnapshot {
  collectedAt: string;
  url: string;
  origin: string;
  title: string;
  lang: string | null;
  headings: CollectedHeading[];
  images: CollectedImage[];
  links: CollectedLink[];
  forms: CollectedForm[];
  controls: CollectedControl[];
  buttons: Array<{ text: string; type: string | null; accessibleName: string; disabled: boolean }>;
  ids: string[];
  duplicateIds: string[];
  ariaIssues: string[];
  suspicious: string[];
  performance: {
    ttfbMs: number | null;
    domContentLoadedMs: number | null;
    loadEventMs: number | null;
    transferSize: number | null;
    lcpMs: number | null;
  };
  limits: {
    truncatedLinks: boolean;
    truncatedImages: boolean;
    truncatedControls: boolean;
  };
}

export interface LinkCheckResult {
  href: string;
  kind: LinkKind;
  urlValid: boolean;
  httpStatus: number | null;
  status: TestStatus;
  detail: string;
}

export interface TestRunConsent {
  ownedOrAuthorized: boolean;
  checkExternalLinks: boolean;
  acknowledgeNoLiveSubmit: boolean;
}

export interface TestRun {
  id: string;
  targetUrl: string;
  tabId: number | null;
  startedAt: string;
  endedAt: string | null;
  groups: TestGroup[];
  level: ScanLevel;
  lifecycle: RunLifecycle;
  progressPercent: number;
  progressLabel: string;
  findings: TestFinding[];
  stats: TestStats;
  performance: PerformanceReport | null;
  linkChecks: LinkCheckResult[];
  errorMessage: string | null;
  consent: TestRunConsent;
}

export interface UserSettings {
  performanceThresholds: PerformanceThresholds;
  maxHistoryItems: number;
  maxLinksToCheck: number;
  linkTimeoutMs: number;
  linkConcurrency: number;
}

export interface StartRunRequest {
  tabId: number;
  url: string;
  groups: TestGroup[];
  level: ScanLevel;
  consent: TestRunConsent;
}

export type ExtensionMessage =
  | { type: "START_RUN"; payload: StartRunRequest }
  | { type: "CANCEL_RUN"; runId: string }
  | { type: "GET_HISTORY" }
  | { type: "GET_RUN"; runId: string }
  | { type: "GET_ACTIVE_RUN" }
  | { type: "DELETE_RUN"; runId: string }
  | { type: "CLEAR_HISTORY" }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; payload: UserSettings }
  | { type: "GET_ACTIVE_TAB" };

export type ExtensionResponse =
  | { ok: true; run?: TestRun; runs?: TestRun[]; settings?: UserSettings; tab?: { id: number; url: string; title: string } }
  | { ok: false; error: string };

export const ALL_GROUPS: TestGroup[] = ["dom", "links", "forms", "a11y", "performance"];

export const DEFAULT_SETTINGS: UserSettings = {
  performanceThresholds: {
    ttfbMs: 800,
    domContentLoadedMs: 2000,
    loadEventMs: 4000,
  },
  maxHistoryItems: 40,
  maxLinksToCheck: 50,
  linkTimeoutMs: 8000,
  linkConcurrency: 3,
};

export const STORAGE_KEYS = {
  history: "wta.history",
  settings: "wta.settings",
  activeRunId: "wta.activeRunId",
  cancelFlags: "wta.cancelFlags",
} as const;
