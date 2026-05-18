import {
  buildAssortmentExecutionPlan,
  deriveAssortmentActions,
  getAssortmentChecklistMap,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { buildEntityCleanupPlan, deriveSnapshotIntelligence, getActiveEntitySnapshot } from "../entity-snapshot";
import { buildHeroCommandSnapshot, gatherHeroWorkflowArtifacts, hasAnyHeroWorkflowSignal } from "../hero-command";
import { peekLaunchOpsSession } from "../launch-ops/session";
import { loadLatestLaunchReviewForCollection } from "../launch-ops/review/storage";
import { loadUnitEconomicsBundle } from "../unit-economics";
import { peekControlTowerSession } from "../strategic-control-tower/session";
import { peekCorridorStrategySession } from "../corridor-strategy/session";
import { peekScalingSafetySession } from "../scaling-safety/session";
import { peekFboFbsDecisionSession } from "../fbo-fbs-decision/session";
import { peekMarketTimingSession } from "../market-timing/session";
import { getActiveProjectId } from "../memory/service";
import { loadSnapshot as loadMemorySnapshot } from "../memory/persist";
import { peekOsReportWarmupState } from "../os-report-warmup";
import { listStaleCacheReportIds } from "../os-report-warmup/digest";
import { loadSafeModeState, type SafeModeState } from "../safe-mode";
import { loadLastRuntimeSmokeReport, type RuntimeSmokeTestReport } from "../runtime-smoke-tests";
import type { EntitySnapshot } from "../entity-snapshot/types";
import type { AssortmentExecutionPlan } from "../assortment-actions/types";
import type { HeroCommandSnapshot } from "../hero-command/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { UnitEconomicsBundle } from "../unit-economics/types";

const MS_STALE_SNAPSHOT = 14 * 24 * 60 * 60 * 1000;
const MS_STALE_SESSION = 7 * 24 * 60 * 60 * 1000;

export type OsHealthAuditGatherContext = {
  snapshot: EntitySnapshot | null;
  intel: ReturnType<typeof deriveSnapshotIntelligence> | null;
  cleanupMissingSlots: number;
  executionPlan: AssortmentExecutionPlan | null;
  checklistItemCount: number;
  heroSnapshot: HeroCommandSnapshot | null;
  heroWorkflowActive: boolean;
  heroStagesReady: number;
  heroStagesMissing: number;
  launchPlan: MarketplaceLaunchPlan | null;
  hasLaunchReview: boolean;
  unitBundle: UnitEconomicsBundle;
  memoryGenerationCount: number;
  savedSessionModules: number;
  controlTowerSessionAge: number | null;
  snapshotAgeMs: number | null;
  hasProjectMemory: boolean;
  warmupState: ReturnType<typeof peekOsReportWarmupState>;
  staleCacheReportIds: ReturnType<typeof listStaleCacheReportIds>;
  safeMode: SafeModeState;
  lastSmokeTest: RuntimeSmokeTestReport | null;
};

function countMemoryGenerations(): number {
  const projectId = getActiveProjectId();
  if (!projectId) return 0;
  const snap = loadMemorySnapshot();
  const project = snap.projects[projectId];
  if (!project) return 0;
  return project.generationIds.filter((gid) => snap.generations[gid]).length;
}

function countSavedSessions(): number {
  let n = 0;
  if (peekControlTowerSession()) n += 1;
  if (peekCorridorStrategySession()) n += 1;
  if (peekScalingSafetySession()) n += 1;
  if (peekFboFbsDecisionSession()) n += 1;
  if (peekMarketTimingSession()) n += 1;
  if (peekLaunchOpsSession()) n += 1;
  return n;
}

export function gatherOsHealthAuditContext(): OsHealthAuditGatherContext {
  const snapshot = getActiveEntitySnapshot();
  const intel = snapshot ? deriveSnapshotIntelligence(snapshot) : null;
  const cleanup = snapshot ? buildEntityCleanupPlan(snapshot) : null;
  const cleanupMissingSlots =
    cleanup?.missingFieldGroups.length ?? intel?.missingFieldSummary.totalSlots ?? 0;

  let executionPlan: AssortmentExecutionPlan | null = null;
  let checklistItemCount = 0;
  if (snapshot) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    executionPlan = buildAssortmentExecutionPlan(snapshot.id, merged);
    checklistItemCount = Object.keys(getAssortmentChecklistMap(snapshot.id)).length;
  }

  const artifacts = gatherHeroWorkflowArtifacts();
  const heroWorkflowActive = hasAnyHeroWorkflowSignal(artifacts);
  const heroSnapshot = heroWorkflowActive ? buildHeroCommandSnapshot(artifacts) : null;
  const heroStagesReady = heroSnapshot?.stages.filter((s) => s.status === "ready" || s.status === "completed").length ?? 0;
  const heroStagesMissing = heroSnapshot?.stages.filter((s) => s.status === "missing").length ?? 0;

  const launchSession = peekLaunchOpsSession();
  const launchPlan = launchSession?.plan ?? null;
  const collectionId = launchPlan?.collectionId;
  const hasLaunchReview = Boolean(
    collectionId && loadLatestLaunchReviewForCollection(collectionId),
  );

  const cst = peekControlTowerSession();
  const now = Date.now();

  return {
    snapshot,
    intel,
    cleanupMissingSlots,
    executionPlan,
    checklistItemCount,
    heroSnapshot,
    heroWorkflowActive,
    heroStagesReady,
    heroStagesMissing,
    launchPlan,
    hasLaunchReview,
    unitBundle: loadUnitEconomicsBundle(),
    memoryGenerationCount: countMemoryGenerations(),
    savedSessionModules: countSavedSessions(),
    controlTowerSessionAge: cst?.savedAt ? now - cst.savedAt : null,
    snapshotAgeMs: snapshot?.createdAt ? now - snapshot.createdAt : null,
    hasProjectMemory: Boolean(getActiveProjectId()),
    warmupState: peekOsReportWarmupState(),
    staleCacheReportIds: listStaleCacheReportIds(MS_STALE_SESSION),
    safeMode: loadSafeModeState(),
    lastSmokeTest: loadLastRuntimeSmokeReport(),
  };
}

export function isSnapshotStale(ctx: OsHealthAuditGatherContext): boolean {
  return ctx.snapshotAgeMs !== null && ctx.snapshotAgeMs > MS_STALE_SNAPSHOT;
}

export function isSessionStale(ageMs: number | null): boolean {
  return ageMs !== null && ageMs > MS_STALE_SESSION;
}
