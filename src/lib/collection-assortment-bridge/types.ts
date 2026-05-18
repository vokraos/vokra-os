import type { NavId } from "../../types";

export const COLLECTION_EXECUTION_ACTIONS_STORAGE_KEY = "vokra.collectionExecutionActions.v1" as const;

export type CollectionExecutionActionStatus =
  | "new"
  | "accepted"
  | "in_progress"
  | "done"
  | "deferred"
  | "blocked";

export type CollectionExecutionStageId =
  | "dna"
  | "hero_sku"
  | "support_sku"
  | "visual_brief"
  | "prompt_pack"
  | "visual_queue"
  | "seo_brief"
  | "production_fit"
  | "launch_blockers"
  | "hold_launch";

export type CollectionExecutionAction = {
  id: string;
  sourceCollectionId: string;
  sourceCollectionName: string;
  sourceStage: CollectionExecutionStageId;
  title: string;
  reason: string;
  priority: "critical" | "high" | "medium" | "low";
  urgency: "low" | "medium" | "elevated" | "critical";
  targetSystem: string;
  suggestedDestination: NavId;
  linkedCorridor: string;
  marketplaceTarget: string;
  status: CollectionExecutionActionStatus;
  createdAt: number;
  updatedAt: number;
};

export type CollectionExecutionActionsRoot = {
  schema: typeof COLLECTION_EXECUTION_ACTIONS_STORAGE_KEY;
  bySnapshot: Record<string, CollectionExecutionAction[]>;
};
