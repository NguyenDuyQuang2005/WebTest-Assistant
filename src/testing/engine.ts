import type { PageSnapshot, ScanLevel, TestFinding, TestGroup, UserSettings } from "../shared/types";
import { runA11yRules } from "./rules/a11y";
import { runDomRules } from "./rules/dom";
import { runFormRules } from "./rules/forms";
import { findingsFromLinkChecks, selectLinksForCheck, toLinkCheckSkeleton } from "./rules/links";
import { runPerformanceRules } from "./rules/performance";
import type { LinkCheckResult } from "../shared/types";

export function evaluateSnapshot(args: {
  snapshot: PageSnapshot;
  groups: TestGroup[];
  level: ScanLevel;
  settings: UserSettings;
  linkChecks?: LinkCheckResult[];
}): { findings: TestFinding[]; performance: ReturnType<typeof runPerformanceRules>["report"] | null; pendingLinks: LinkCheckResult[] } {
  const findings: TestFinding[] = [];
  let performance = null as ReturnType<typeof runPerformanceRules>["report"] | null;
  let pendingLinks: LinkCheckResult[] = [];

  if (args.groups.includes("dom")) {
    findings.push(...runDomRules(args.snapshot, args.level));
  }
  if (args.groups.includes("forms")) {
    findings.push(...runFormRules(args.snapshot, args.level));
  }
  if (args.groups.includes("a11y")) {
    findings.push(...runA11yRules(args.snapshot, args.level));
  }
  if (args.groups.includes("performance")) {
    const perf = runPerformanceRules(args.snapshot, args.settings.performanceThresholds, args.level);
    findings.push(...perf.findings);
    performance = perf.report;
  }
  if (args.groups.includes("links")) {
    const selected = selectLinksForCheck(args.snapshot, args.level, args.settings.maxLinksToCheck);
    pendingLinks = selected.map((item) => toLinkCheckSkeleton(item.href, args.snapshot.url));
    const checks = args.linkChecks ?? pendingLinks;
    findings.push(...findingsFromLinkChecks(args.snapshot, checks));
  }

  return { findings, performance, pendingLinks };
}
