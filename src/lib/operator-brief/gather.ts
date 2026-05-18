import {
  buildAssortmentExecutionPlan,
  deriveAssortmentActions,
  getAssortmentChecklistMap,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { getActiveEntitySnapshot, buildEntityCleanupPlan } from "../entity-snapshot";
import { listActiveHeroExecutionActions } from "../hero-assortment-bridge/storage";
import { listActiveCollectionExecutionActions } from "../collection-assortment-bridge/storage";
import { listActiveLaunchExecutionActions } from "../launch-ops/assortmentStorage";
import { loadVisualProductionQueueFromSession } from "../visual-production/sessionStorage";
import { loadCardProductionBoardFromSession } from "../card-production/sessionStorage";

export function gatherOperatorBriefContext() {
  const snapshot = getActiveEntitySnapshot();
  const snapshotId = snapshot?.id ?? null;

  let executionPlan = null;
  let checklist = {} as ReturnType<typeof getAssortmentChecklistMap>;
  if (snapshot) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    executionPlan = buildAssortmentExecutionPlan(snapshot.id, merged);
    checklist = getAssortmentChecklistMap(snapshot.id);
  }

  const cleanupPlan = snapshot ? buildEntityCleanupPlan(snapshot) : null;
  const visualQueue = loadVisualProductionQueueFromSession();
  const cardBoard = loadCardProductionBoardFromSession();

  return {
    snapshot,
    snapshotId,
    executionPlan,
    checklist,
    heroActions: snapshotId ? listActiveHeroExecutionActions(snapshotId) : [],
    collectionActions: snapshotId ? listActiveCollectionExecutionActions(snapshotId) : [],
    launchActions: snapshotId ? listActiveLaunchExecutionActions(snapshotId) : [],
    cleanupPlan,
    visualJobs: visualQueue?.jobs ?? [],
    cardPlans: cardBoard?.plans ?? [],
  };
}

export type OperatorBriefGatherContext = ReturnType<typeof gatherOperatorBriefContext>;
