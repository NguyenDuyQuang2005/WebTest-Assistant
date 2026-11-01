import { createId } from "../shared/id";
import type { Severity, TestFinding, TestGroup, TestStatus } from "../shared/types";

export function finding(input: {
  ruleId: string;
  ruleName: string;
  group: TestGroup;
  description: string;
  severity: Severity;
  status: TestStatus;
  evidence?: string[];
  recommendation: string;
  unverifiableReason?: string;
}): TestFinding {
  const item: TestFinding = {
    id: createId(input.ruleId),
    ruleId: input.ruleId,
    ruleName: input.ruleName,
    group: input.group,
    description: input.description,
    severity: input.severity,
    status: input.status,
    evidence: input.evidence ?? [],
    recommendation: input.recommendation,
  };
  if (input.unverifiableReason) {
    item.unverifiableReason = input.unverifiableReason;
  }
  return item;
}
