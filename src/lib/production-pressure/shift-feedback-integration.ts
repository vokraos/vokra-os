import type { OsHealthAuditReport } from "../os-health-audit/types";
import { getProductionShiftLearning } from "./shift-feedback-learning";

export function enrichOsHealthAuditWithProductionShiftFeedback(
  report: OsHealthAuditReport,
): OsHealthAuditReport {
  const learning = getProductionShiftLearning();
  if (!learning.reliabilityNoteKey) return report;
  const reliabilityWarningKeys = [...report.reliabilityWarningKeys];
  if (!reliabilityWarningKeys.includes(learning.reliabilityNoteKey)) {
    reliabilityWarningKeys.unshift(learning.reliabilityNoteKey);
  }
  return { ...report, reliabilityWarningKeys: reliabilityWarningKeys.slice(0, 8) };
}
