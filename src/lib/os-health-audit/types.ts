import type { NavId } from "../../types";

export const OS_HEALTH_AUDIT_MEMORY_SCHEMA = "vokra.osHealthAudit.v1" as const;

export type AuditHealthLevel = "strong" | "adequate" | "weak" | "fragile" | "incomplete";

export type AuditFinding = {
  key: string;
  vars: Record<string, string>;
  navId: NavId;
  severity: "high" | "medium" | "low";
};

export type OsHealthAuditWarmupStatus =
  | "never"
  | "idle"
  | "warming"
  | "partial"
  | "complete"
  | "failed";

export type OsHealthAuditReport = {
  id: string;
  createdAt: number;
  overallHealth: AuditHealthLevel;
  dataCompleteness: AuditHealthLevel;
  workflowContinuity: AuditHealthLevel;
  memoryCoverage: AuditHealthLevel;
  economicCoverage: AuditHealthLevel;
  heroWorkflowCoverage: AuditHealthLevel;
  launchWorkflowCoverage: AuditHealthLevel;
  executionCoverage: AuditHealthLevel;
  reliabilityWarningKeys: string[];
  missingInputs: AuditFinding[];
  staleAreas: AuditFinding[];
  disconnectedModules: AuditFinding[];
  recommendedFixKeys: string[];
  confidenceNoteKey: string;
  manualAssumptionKeys: string[];
  warmupStatus: OsHealthAuditWarmupStatus;
  warmupFailedReports: string[];
  warmupStaleReports: string[];
};

export type OsHealthAuditMemoryPayload = {
  schema: typeof OS_HEALTH_AUDIT_MEMORY_SCHEMA;
  savedAt: number;
  report: OsHealthAuditReport;
};
