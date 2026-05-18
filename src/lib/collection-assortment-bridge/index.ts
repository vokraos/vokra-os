export type {
  CollectionExecutionAction,
  CollectionExecutionActionStatus,
  CollectionExecutionStageId,
} from "./types";
export { COLLECTION_EXECUTION_ACTIONS_STORAGE_KEY } from "./types";
export {
  getCollectionExecutionActions,
  listActiveCollectionExecutionActions,
  upsertCollectionExecutionAction,
  setCollectionExecutionActionStatus,
  bulkMergeCollectionExecutionActions,
  exportCollectionExecutionActionsForMemory,
} from "./storage";
export { deriveCollectionExecutionActions, type CollectionBridgeDeriveInput } from "./derive";
export { mergeCollectionExecutionIntoAssortmentActions, COLLECTION_WORKFLOW_TOUCH_ID } from "./toAssortment";
export { getCollectionExecutionDailyDigestLine } from "./digest";

import { loadPromptPackFromSession } from "../prompt-pack/sessionStorage";
import type { CollectionBridgeDeriveInput } from "./derive";
import { deriveCollectionExecutionActions } from "./derive";
import { bulkMergeCollectionExecutionActions } from "./storage";
import type { CollectionExecutionAction } from "./types";

export function addCollectionExecutionActionsToAssortmentPlan(
  snapshotId: string,
  input: CollectionBridgeDeriveInput,
  t: (key: string, vars?: Record<string, string>) => string,
): CollectionExecutionAction[] {
  const derived = deriveCollectionExecutionActions(
    { ...input, promptPackInSession: input.promptPackInSession ?? Boolean(loadPromptPackFromSession()) },
    t,
  );
  if (derived.length) bulkMergeCollectionExecutionActions(snapshotId, derived);
  return derived;
}
