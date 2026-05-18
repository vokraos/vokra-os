import {
  buildAssortmentExecutionPlan,
  buildAssortmentExecutionReview,
  deriveAssortmentActions,
  getAssortmentChecklistMap,
  getTopLearningSignals,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { listActiveCollectionExecutionActions } from "../collection-assortment-bridge";
import { buildEntityCleanupPlan, deriveSnapshotIntelligence, getActiveEntitySnapshot } from "../entity-snapshot";
import { buildHeroCommandSnapshot, gatherHeroWorkflowArtifacts, hasAnyHeroWorkflowSignal } from "../hero-command";
import { peekCompetitorSerpSession } from "../hero-command/peekSessions";
import { listActiveHeroExecutionActions } from "../hero-assortment-bridge";
import { loadLatestLaunchReviewForCollection, peekLaunchOpsSession } from "../launch-ops";
import { listActiveLaunchExecutionActions } from "../launch-ops/assortmentStorage";
import type { AssortmentAction, AssortmentExecutionPlan } from "../assortment-actions/types";
import type { EntitySnapshot } from "../entity-snapshot/types";
import type { HeroCommandSnapshot } from "../hero-command/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { MarketplaceLaunchReview } from "../launch-ops/review/types";
import type { EntityCleanupPlan } from "../entity-snapshot/cleanup/types";

export type FounderBriefGatherContext = {
  snapshot: EntitySnapshot | null;
  intel: ReturnType<typeof deriveSnapshotIntelligence> | null;
  executionPlan: AssortmentExecutionPlan | null;
  mergedActions: AssortmentAction[];
  heroSnapshot: HeroCommandSnapshot | null;
  heroWorkflowActive: boolean;
  heroExecutionTop: string | null;
  collectionExecutionTop: string | null;
  launchExecutionTop: string | null;
  launchPlan: MarketplaceLaunchPlan | null;
  launchReview: MarketplaceLaunchReview | null;
  cleanupPlan: EntityCleanupPlan | null;
  competitiveMapActive: boolean;
  learningTop: string | null;
  checklistBlocked: number;
};

export function gatherFounderBriefContext(): FounderBriefGatherContext {
  const snapshot = getActiveEntitySnapshot();
  const intel = snapshot ? deriveSnapshotIntelligence(snapshot) : null;

  let mergedActions: AssortmentAction[] = [];
  let executionPlan: AssortmentExecutionPlan | null = null;
  let checklistBlocked = 0;
  let learningTop: string | null = null;

  if (snapshot) {
    mergedActions = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    executionPlan = buildAssortmentExecutionPlan(snapshot.id, mergedActions);
    const map = getAssortmentChecklistMap(snapshot.id);
    const review = buildAssortmentExecutionReview(snapshot.id, executionPlan, map, (k) => k);
    checklistBlocked = review?.blockedItems.length ?? 0;
    const learn = getTopLearningSignals(snapshot.id, 1)[0];
    learningTop = learn?.title ?? null;
  }

  const artifacts = gatherHeroWorkflowArtifacts();
  const heroWorkflowActive = hasAnyHeroWorkflowSignal(artifacts);
  const heroSnapshot = heroWorkflowActive ? buildHeroCommandSnapshot(artifacts) : null;

  const snapId = snapshot?.id ?? "";
  const heroExec = snapId ? listActiveHeroExecutionActions(snapId)[0] : null;
  const colExec = snapId ? listActiveCollectionExecutionActions(snapId)[0] : null;
  const launchExec = snapId ? listActiveLaunchExecutionActions(snapId)[0] : null;

  const launchSession = peekLaunchOpsSession();
  const launchPlan = launchSession?.plan ?? null;
  const collectionId = launchPlan?.collectionId;
  const launchReview = collectionId
    ? loadLatestLaunchReviewForCollection(collectionId)
    : launchSession?.review ?? null;

  const cleanupPlan = snapshot ? buildEntityCleanupPlan(snapshot) : null;
  const competitiveMapActive = Boolean(peekCompetitorSerpSession()) || heroWorkflowActive;

  return {
    snapshot,
    intel,
    executionPlan,
    mergedActions,
    heroSnapshot,
    heroWorkflowActive,
    heroExecutionTop: heroExec?.title ?? null,
    collectionExecutionTop: colExec?.title ?? null,
    launchExecutionTop: launchExec?.title ?? null,
    launchPlan,
    launchReview,
    cleanupPlan,
    competitiveMapActive,
    learningTop,
    checklistBlocked,
  };
}
