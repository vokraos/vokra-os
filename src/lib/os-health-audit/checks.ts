import type { AuditFinding, AuditHealthLevel } from "./types";
import type { OsHealthAuditGatherContext } from "./gather";
import { isSessionStale, isSnapshotStale } from "./gather";
import { levelFromScore, worstLevel } from "./levels";

export function auditDataCompleteness(ctx: OsHealthAuditGatherContext): {
  level: AuditHealthLevel;
  score: number;
  findings: AuditFinding[];
} {
  const findings: AuditFinding[] = [];
  if (!ctx.snapshot) {
    findings.push({
      key: "oha.missing.snapshot",
      vars: {},
      navId: "entityFusion",
      severity: "high",
    });
    return { level: "incomplete", score: 0, findings };
  }

  let score = 72;
  const snap = ctx.snapshot;
  if (snap.skuEntities.length < 3) {
    score -= 25;
    findings.push({
      key: "oha.missing.skuVolume",
      vars: { n: String(snap.skuEntities.length) },
      navId: "dataImport",
      severity: "high",
    });
  }
  if (ctx.cleanupMissingSlots >= 8) {
    score -= 22;
    findings.push({
      key: "oha.missing.dataSlots",
      vars: { n: String(ctx.cleanupMissingSlots) },
      navId: "dataCleanup",
      severity: "high",
    });
  } else if (ctx.cleanupMissingSlots >= 3) {
    score -= 10;
    findings.push({
      key: "oha.missing.dataSlotsLight",
      vars: { n: String(ctx.cleanupMissingSlots) },
      navId: "dataCleanup",
      severity: "medium",
    });
  }
  if (snap.warnings.length >= 3) {
    score -= 12;
    findings.push({
      key: "oha.missing.snapshotWarnings",
      vars: { n: String(snap.warnings.length) },
      navId: "entityFusion",
      severity: "medium",
    });
  }
  if (isSnapshotStale(ctx)) {
    score -= 15;
    findings.push({
      key: "oha.stale.snapshot",
      vars: {},
      navId: "entityFusion",
      severity: "medium",
    });
  }

  return { level: levelFromScore(score), score, findings };
}

export function auditWorkflowContinuity(ctx: OsHealthAuditGatherContext): {
  level: AuditHealthLevel;
  score: number;
  findings: AuditFinding[];
} {
  const findings: AuditFinding[] = [];
  if (!ctx.snapshot) {
    return { level: "incomplete", score: 0, findings };
  }

  let score = 70;
  if (!ctx.executionPlan) {
    score -= 30;
    findings.push({
      key: "oha.missing.executionPlan",
      vars: {},
      navId: "assortmentActions",
      severity: "high",
    });
  } else if (ctx.executionPlan.todayActions.length === 0 && ctx.executionPlan.holdActions.length === 0) {
    score -= 12;
    findings.push({
      key: "oha.missing.todayQueue",
      vars: {},
      navId: "assortmentActions",
      severity: "medium",
    });
  }
  if (ctx.checklistItemCount === 0 && ctx.executionPlan && ctx.executionPlan.todayActions.length > 0) {
    score -= 10;
    findings.push({
      key: "oha.missing.checklist",
      vars: {},
      navId: "assortmentActions",
      severity: "low",
    });
  }
  if (ctx.heroWorkflowActive && ctx.heroStagesMissing >= 4) {
    score -= 18;
    findings.push({
      key: "oha.missing.heroStages",
      vars: { n: String(ctx.heroStagesMissing) },
      navId: "competitiveMap",
      severity: "medium",
    });
  }
  if (ctx.launchPlan && !ctx.hasLaunchReview && ctx.launchPlan.launchReadiness === "ready") {
    score -= 8;
    findings.push({
      key: "oha.missing.launchReview",
      vars: {},
      navId: "launchOperations",
      severity: "low",
    });
  }

  return { level: levelFromScore(score), score, findings };
}

export function auditMemoryCoverage(ctx: OsHealthAuditGatherContext): {
  level: AuditHealthLevel;
  score: number;
  findings: AuditFinding[];
} {
  const findings: AuditFinding[] = [];
  let score = 40;
  if (ctx.hasProjectMemory) score += 15;
  if (ctx.memoryGenerationCount >= 8) score += 35;
  else if (ctx.memoryGenerationCount >= 3) score += 22;
  else if (ctx.memoryGenerationCount >= 1) score += 10;
  else {
    findings.push({
      key: "oha.missing.memorySaves",
      vars: {},
      navId: "memory",
      severity: "medium",
    });
  }

  if (ctx.savedSessionModules === 0) {
    score -= 12;
    findings.push({
      key: "oha.missing.moduleSessions",
      vars: {},
      navId: "controlTower",
      severity: "low",
    });
  } else if (ctx.savedSessionModules >= 3) {
    score += 12;
  }

  if (isSessionStale(ctx.controlTowerSessionAge) && ctx.controlTowerSessionAge) {
    score -= 10;
    findings.push({
      key: "oha.stale.controlTower",
      vars: {},
      navId: "controlTower",
      severity: "low",
    });
  }

  return { level: levelFromScore(Math.min(100, score)), score, findings };
}

export function auditEconomicCoverage(ctx: OsHealthAuditGatherContext): {
  level: AuditHealthLevel;
  score: number;
  findings: AuditFinding[];
} {
  const findings: AuditFinding[] = [];
  const { profiles, templates, assignments } = ctx.unitBundle;
  if (!profiles.length && !templates.length) {
    findings.push({
      key: "oha.missing.economicsProfile",
      vars: {},
      navId: "unitEconomics",
      severity: "high",
    });
    return { level: "incomplete", score: 15, findings };
  }

  let score = 55;
  if (profiles.length >= 2) score += 20;
  else score += 8;
  if (templates.length >= 1) score += 10;
  if (assignments.length >= 1) score += 18;
  else {
    findings.push({
      key: "oha.missing.economicsAssignment",
      vars: {},
      navId: "unitEconomics",
      severity: "high",
    });
    score -= 25;
  }
  if (!ctx.snapshot) {
    score -= 20;
    findings.push({
      key: "oha.disconnected.economicsSnapshot",
      vars: {},
      navId: "entityFusion",
      severity: "medium",
    });
  }

  return { level: levelFromScore(Math.max(0, score)), score, findings };
}

export function auditHeroWorkflowCoverage(ctx: OsHealthAuditGatherContext): {
  level: AuditHealthLevel;
  score: number;
  findings: AuditFinding[];
} {
  const findings: AuditFinding[] = [];
  if (!ctx.heroWorkflowActive) {
    return {
      level: "adequate",
      score: 65,
      findings: [
        {
          key: "oha.assumption.heroOptional",
          vars: {},
          navId: "competitiveMap",
          severity: "low",
        },
      ],
    };
  }

  let score = 50 + ctx.heroStagesReady * 8;
  if (ctx.heroStagesMissing >= 5) {
    score -= 25;
    findings.push({
      key: "oha.missing.heroPipeline",
      vars: { ready: String(ctx.heroStagesReady), missing: String(ctx.heroStagesMissing) },
      navId: "competitiveMap",
      severity: "high",
    });
  }
  if (!ctx.snapshot) {
    score -= 15;
    findings.push({
      key: "oha.disconnected.heroSnapshot",
      vars: {},
      navId: "entityFusion",
      severity: "medium",
    });
  }

  return { level: levelFromScore(Math.min(100, score)), score, findings };
}

export function auditLaunchWorkflowCoverage(ctx: OsHealthAuditGatherContext): {
  level: AuditHealthLevel;
  score: number;
  findings: AuditFinding[];
} {
  const findings: AuditFinding[] = [];
  if (!ctx.launchPlan) {
    return {
      level: "adequate",
      score: 60,
      findings: [
        {
          key: "oha.assumption.launchOptional",
          vars: {},
          navId: "launchOperations",
          severity: "low",
        },
      ],
    };
  }

  let score = 62;
  if (ctx.hasLaunchReview) score += 22;
  else {
    findings.push({
      key: "oha.missing.launchReview",
      vars: {},
      navId: "launchOperations",
      severity: "medium",
    });
  }
  if (ctx.launchPlan.blockers.length >= 2) {
    score -= 15;
    findings.push({
      key: "oha.warn.launchBlockers",
      vars: { n: String(ctx.launchPlan.blockers.length) },
      navId: "launchOperations",
      severity: "medium",
    });
  }
  if (!ctx.snapshot) {
    score -= 20;
    findings.push({
      key: "oha.disconnected.launchSnapshot",
      vars: {},
      navId: "entityFusion",
      severity: "high",
    });
  }

  return { level: levelFromScore(Math.max(0, score)), score, findings };
}

export function auditExecutionCoverage(ctx: OsHealthAuditGatherContext): {
  level: AuditHealthLevel;
  score: number;
  findings: AuditFinding[];
} {
  const findings: AuditFinding[] = [];
  if (!ctx.snapshot) {
    return { level: "incomplete", score: 0, findings };
  }
  if (!ctx.executionPlan) {
    findings.push({
      key: "oha.missing.assortmentPlan",
      vars: {},
      navId: "assortmentActions",
      severity: "high",
    });
    return { level: "incomplete", score: 20, findings };
  }

  let score = 68;
  const plan = ctx.executionPlan;
  if (plan.todayActions.length > 0) score += 15;
  if (plan.holdActions.length >= 5) {
    score -= 18;
    findings.push({
      key: "oha.warn.executionHolds",
      vars: { n: String(plan.holdActions.length) },
      navId: "assortmentActions",
      severity: "medium",
    });
  }
  if (plan.continuityWarnings.length >= 2) {
    score -= 10;
    findings.push({
      key: "oha.warn.executionContinuity",
      vars: {},
      navId: "assortmentActions",
      severity: "low",
    });
  }

  return { level: levelFromScore(Math.max(0, score)), score, findings };
}

export function collectDisconnectedModules(ctx: OsHealthAuditGatherContext): AuditFinding[] {
  const out: AuditFinding[] = [];
  if (ctx.launchPlan && !ctx.snapshot) {
    out.push({
      key: "oha.disconnected.launchNoSnapshot",
      vars: {},
      navId: "launchOperations",
      severity: "high",
    });
  }
  if (ctx.savedSessionModules >= 2 && !ctx.snapshot) {
    out.push({
      key: "oha.disconnected.sessionsNoSnapshot",
      vars: { n: String(ctx.savedSessionModules) },
      navId: "entityFusion",
      severity: "high",
    });
  }
  if (ctx.heroWorkflowActive && !ctx.snapshot) {
    out.push({
      key: "oha.disconnected.heroNoSnapshot",
      vars: {},
      navId: "competitiveMap",
      severity: "high",
    });
  }
  return out;
}

export function auditWarmupCache(ctx: OsHealthAuditGatherContext): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const w = ctx.warmupState;
  if (!w) {
    findings.push({
      key: "oha.warmup.never",
      vars: {},
      navId: "controlTower",
      severity: "medium",
    });
  } else if (w.status === "failed" || w.failedReports.length > 0) {
    findings.push({
      key: "oha.warmup.failed",
      vars: { reports: w.failedReports.map((id) => id.replace(/_/g, " ")).join(", ") },
      navId: "controlTower",
      severity: "high",
    });
  }
  for (const id of ctx.staleCacheReportIds.slice(0, 4)) {
    findings.push({
      key: "oha.stale.reportCache",
      vars: { report: id.replace(/_/g, " ") },
      navId:
        id === "production_pressure"
          ? "productionPressure"
          : id === "economic_pressure"
            ? "economicPressure"
            : id === "scaling_safety"
              ? "scalingSafety"
              : "warRoom",
      severity: "medium",
    });
  }
  return findings;
}

export function auditSafeMode(ctx: OsHealthAuditGatherContext): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const sm = ctx.safeMode;
  if (sm.enabled) {
    findings.push({
      key: "oha.safeMode.active",
      vars: { reason: sm.reason },
      navId: "safeMode",
      severity: "high",
    });
    if (sm.lastErrorMessage) {
      findings.push({
        key: "oha.safeMode.lastError",
        vars: { msg: sm.lastErrorMessage.slice(0, 220) },
        navId: "safeMode",
        severity: "high",
      });
    }
    if (sm.disabledFeatures.length) {
      findings.push({
        key: "oha.safeMode.disabledFeatures",
        vars: { list: sm.disabledFeatures.join(", ") },
        navId: "safeMode",
        severity: "medium",
      });
    }
  } else if (sm.lastErrorMessage && Date.now() - sm.createdAt < 48 * 60 * 60 * 1000 && sm.createdAt > 0) {
    findings.push({
      key: "oha.safeMode.recentIncident",
      vars: { msg: sm.lastErrorMessage.slice(0, 220) },
      navId: "safeMode",
      severity: "medium",
    });
  }
  return findings;
}

export function auditRuntimeSmoke(ctx: OsHealthAuditGatherContext): AuditFinding[] {
  const last = ctx.lastSmokeTest;
  if (!last) return [];
  const findings: AuditFinding[] = [];
  const age = Date.now() - last.createdAt;
  const staleMs = 7 * 24 * 60 * 60 * 1000;
  if (age > staleMs) {
    findings.push({
      key: "oha.smoke.stale",
      vars: { days: String(Math.floor(age / (24 * 60 * 60 * 1000))) },
      navId: "systemSmokeTest",
      severity: "low",
    });
  }
  if (last.status === "failed") {
    findings.push({
      key: "oha.smoke.failedSummary",
      vars: {
        n: String(last.failedChecks.length),
        when: new Date(last.createdAt).toLocaleString(),
      },
      navId: "systemSmokeTest",
      severity: "high",
    });
    for (const f of last.failedChecks.slice(0, 6)) {
      findings.push({
        key: "oha.smoke.failedCheck",
        vars: { id: f.id, detail: (f.detail ?? "").slice(0, 160) },
        navId: "systemSmokeTest",
        severity: "medium",
      });
    }
  } else if (last.status === "warning") {
    findings.push({
      key: "oha.smoke.warningSummary",
      vars: {
        n: String(last.skippedChecks.length),
        when: new Date(last.createdAt).toLocaleString(),
      },
      navId: "systemSmokeTest",
      severity: "medium",
    });
  } else {
    findings.push({
      key: "oha.smoke.ok",
      vars: { when: new Date(last.createdAt).toLocaleString() },
      navId: "systemSmokeTest",
      severity: "low",
    });
  }
  return findings;
}

export function deriveOverallHealth(dimensions: AuditHealthLevel[]): AuditHealthLevel {
  return worstLevel(dimensions);
}
