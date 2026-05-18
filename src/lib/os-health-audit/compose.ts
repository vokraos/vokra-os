import type { AuditFinding, AuditHealthLevel, OsHealthAuditReport } from "./types";
import {
  auditDataCompleteness,
  auditEconomicCoverage,
  auditExecutionCoverage,
  auditHeroWorkflowCoverage,
  auditLaunchWorkflowCoverage,
  auditMemoryCoverage,
  auditWorkflowContinuity,
  collectDisconnectedModules,
  auditWarmupCache,
  auditSafeMode,
  auditRuntimeSmoke,
  deriveOverallHealth,
} from "./checks";
import { enrichOsHealthAuditWithStoredFeedback } from "../execution-feedback";
import { enrichOsHealthAuditWithProductionShiftFeedback } from "../production-pressure/shift-feedback-integration";
import { gatherOsHealthAuditContext } from "./gather";
import { newOsHealthAuditReportId } from "./levels";

function mergeFindings(...groups: AuditFinding[][]): AuditFinding[] {
  const seen = new Set<string>();
  const out: AuditFinding[] = [];
  for (const g of groups) {
    for (const f of g) {
      const id = `${f.key}:${f.navId}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(f);
    }
  }
  return out;
}

function sortFindings(findings: AuditFinding[]): AuditFinding[] {
  const rank = (s: AuditFinding["severity"]) => (s === "high" ? 3 : s === "medium" ? 2 : 1);
  return [...findings].sort((a, b) => rank(b.severity) - rank(a.severity));
}

function pickStale(findings: AuditFinding[]): AuditFinding[] {
  return findings.filter((f) => f.key.startsWith("oha.stale."));
}

function pickMissing(findings: AuditFinding[]): AuditFinding[] {
  return findings.filter((f) => f.key.startsWith("oha.missing."));
}

function buildRecommendedFixes(
  overall: OsHealthAuditReport["overallHealth"],
  missing: AuditFinding[],
  disconnected: AuditFinding[],
  ctx: ReturnType<typeof gatherOsHealthAuditContext>,
): string[] {
  const keys: string[] = [];
  if (ctx.lastSmokeTest?.status === "failed") {
    keys.push("oha.fix.smokeClearCaches", "oha.fix.smokeOpenSmokeTest", "oha.fix.smokeOpenOha");
    if (!ctx.safeMode.enabled) keys.push("oha.fix.smokeEnterSafeWarmup");
  }
  if (ctx.safeMode.enabled) keys.push("oha.fix.safeMode");
  if (ctx.safeMode.lastErrorMessage && !ctx.safeMode.enabled) keys.push("oha.fix.reviewSafeModeLog");
  if (overall === "incomplete" || overall === "fragile") {
    const top = missing[0];
    if (top) keys.push("oha.fix.topMissing");
    if (disconnected.length) keys.push("oha.fix.reconnectSnapshot");
  }
  if (missing.some((f) => f.key.includes("economics"))) keys.push("oha.fix.economics");
  if (missing.some((f) => f.key.includes("snapshot"))) keys.push("oha.fix.snapshot");
  if (missing.some((f) => f.key.includes("checklist"))) keys.push("oha.fix.checklist");
  if (!keys.length && overall === "weak") keys.push("oha.fix.reviewModules");
  if (!keys.length) keys.push("oha.fix.maintain");
  return [...new Set(keys)].slice(0, 6);
}

function buildReliabilityWarnings(
  overall: OsHealthAuditReport["overallHealth"],
  _dimensions: AuditHealthLevel[],
  ctx: ReturnType<typeof gatherOsHealthAuditContext>,
): string[] {
  const keys: string[] = [];
  if (overall === "incomplete" || overall === "fragile") keys.push("oha.warn.lowConfidence");
  if (!ctx.snapshot) keys.push("oha.warn.noSnapshotTruth");
  keys.push("oha.warn.manualOnly");
  if (ctx.memoryGenerationCount < 2) keys.push("oha.warn.thinMemory");
  if (ctx.lastSmokeTest?.status === "failed") keys.push("oha.warn.smokeFailed");
  if (ctx.safeMode.enabled) keys.push("oha.warn.safeModeActive");
  if (ctx.safeMode.lastErrorMessage && !ctx.safeMode.enabled) {
    const recent = ctx.safeMode.createdAt && Date.now() - ctx.safeMode.createdAt < 48 * 60 * 60 * 1000;
    if (recent) keys.push("oha.warn.safeModeRecentError");
  }
  return [...new Set(keys)].slice(0, 6);
}

export function buildOsHealthAuditReport(existingId?: string): OsHealthAuditReport {
  const ctx = gatherOsHealthAuditContext();

  const data = auditDataCompleteness(ctx);
  const workflow = auditWorkflowContinuity(ctx);
  const memory = auditMemoryCoverage(ctx);
  const economic = auditEconomicCoverage(ctx);
  const hero = auditHeroWorkflowCoverage(ctx);
  const launch = auditLaunchWorkflowCoverage(ctx);
  const execution = auditExecutionCoverage(ctx);
  const disconnected = collectDisconnectedModules(ctx);
  const warmupFindings = auditWarmupCache(ctx);
  const safeModeFindings = auditSafeMode(ctx);
  const smokeFindings = auditRuntimeSmoke(ctx);

  const allFindings = mergeFindings(
    data.findings,
    workflow.findings,
    memory.findings,
    economic.findings,
    hero.findings,
    launch.findings,
    execution.findings,
    disconnected,
    warmupFindings,
    safeModeFindings,
    smokeFindings,
  );

  const dimensions = [
    data.level,
    workflow.level,
    memory.level,
    economic.level,
    hero.level,
    launch.level,
    execution.level,
  ];
  const overallHealth = deriveOverallHealth(dimensions);

  const missingInputs = sortFindings(pickMissing(allFindings)).slice(0, 10);
  const staleAreas = sortFindings(pickStale(allFindings)).slice(0, 6);
  const disconnectedModules = sortFindings(disconnected).slice(0, 6);

  const manualAssumptionKeys = allFindings
    .filter((f) => f.key.startsWith("oha.assumption."))
    .map((f) => f.key)
    .slice(0, 4);

  const warmupState = ctx.warmupState;
  const warmupStatus =
    warmupState?.status ?? ("never" as const);

  const report: OsHealthAuditReport = {
    id: existingId ?? newOsHealthAuditReportId(),
    createdAt: Date.now(),
    overallHealth,
    dataCompleteness: data.level,
    workflowContinuity: workflow.level,
    memoryCoverage: memory.level,
    economicCoverage: economic.level,
    heroWorkflowCoverage: hero.level,
    launchWorkflowCoverage: launch.level,
    executionCoverage: execution.level,
    reliabilityWarningKeys: buildReliabilityWarnings(overallHealth, dimensions, ctx),
    missingInputs,
    staleAreas,
    disconnectedModules,
    recommendedFixKeys: buildRecommendedFixes(overallHealth, missingInputs, disconnectedModules, ctx),
    confidenceNoteKey: ctx.snapshot ? "oha.confidence.honest" : "oha.confidence.noSnapshot",
    manualAssumptionKeys:
      manualAssumptionKeys.length > 0 ? manualAssumptionKeys : ["oha.assumption.manualOnly"],
    warmupStatus,
    warmupFailedReports: warmupState?.failedReports ?? [],
    warmupStaleReports: ctx.staleCacheReportIds,
  };

  return enrichOsHealthAuditWithProductionShiftFeedback(enrichOsHealthAuditWithStoredFeedback(report));
}

export function pickTopMissingInput(report: OsHealthAuditReport): AuditFinding | null {
  return report.missingInputs[0] ?? report.disconnectedModules[0] ?? null;
}
