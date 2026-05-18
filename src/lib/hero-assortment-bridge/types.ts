import type { NavId } from "../../types";
import type { HeroWorkflowStageId } from "../hero-command/types";

export const HERO_EXECUTION_ACTIONS_STORAGE_KEY = "vokra.heroExecutionActions.v1" as const;

/** Standalone scope when no entity snapshot is active (still persisted locally). */
export const HERO_WORKFLOW_SNAPSHOT_SCOPE = "hero-workflow-scope" as const;

export type HeroExecutionActionStatus =
  | "new"
  | "accepted"
  | "in_progress"
  | "done"
  | "deferred"
  | "blocked";

export type HeroExecutionAction = {
  id: string;
  sourceHeroCommandSnapshotId: string;
  sourceStage: HeroWorkflowStageId;
  title: string;
  reason: string;
  priority: "critical" | "high" | "medium" | "low";
  urgency: "low" | "medium" | "elevated" | "critical";
  targetSystem: string;
  suggestedDestination: NavId;
  linkedQuery: string;
  marketplace: string;
  status: HeroExecutionActionStatus;
  createdAt: number;
  updatedAt: number;
};

export type HeroExecutionActionsRoot = {
  schema: typeof HERO_EXECUTION_ACTIONS_STORAGE_KEY;
  bySnapshot: Record<string, HeroExecutionAction[]>;
};
