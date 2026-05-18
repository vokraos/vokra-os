export type { HeroExecutionAction, HeroExecutionActionStatus } from "./types";
export { HERO_EXECUTION_ACTIONS_STORAGE_KEY, HERO_WORKFLOW_SNAPSHOT_SCOPE } from "./types";
export {
  getHeroExecutionActions,
  listActiveHeroExecutionActions,
  upsertHeroExecutionAction,
  setHeroExecutionActionStatus,
  bulkMergeHeroExecutionActions,
  exportHeroExecutionActionsForMemory,
} from "./storage";
export { deriveHeroExecutionActionFromCommand, deriveHeroExecutionActionFromWorkflow } from "./derive";
export { mergeHeroExecutionIntoAssortmentActions, HERO_WORKFLOW_TOUCH_ID } from "./toAssortment";
export { getHeroExecutionDailyDigestLine } from "./digest";

import type { HeroCommandSnapshot } from "../hero-command/types";
import type { HeroExecutionAction } from "./types";
import { deriveHeroExecutionActionFromCommand } from "./derive";
import { upsertHeroExecutionAction } from "./storage";

export function addHeroExecutionActionToAssortmentPlan(
  snapshotId: string,
  commandSnapshot: HeroCommandSnapshot,
  t: (key: string, vars?: Record<string, string>) => string,
): HeroExecutionAction | null {
  const action = deriveHeroExecutionActionFromCommand(commandSnapshot, t);
  if (!action) return null;
  upsertHeroExecutionAction(snapshotId, action);
  return action;
}
