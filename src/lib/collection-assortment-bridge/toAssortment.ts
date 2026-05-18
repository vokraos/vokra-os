import type { NavId } from "../../types";
import { ASSORTMENT_ECON_PLACEHOLDER, enrichAssortmentActions } from "../assortment-actions/prioritization";
import type { AssortmentAction, AssortmentActionStatus } from "../assortment-actions/types";
import type { EntitySnapshot } from "../entity-snapshot/types";
import type { CollectionExecutionAction, CollectionExecutionActionStatus } from "./types";

export const COLLECTION_WORKFLOW_TOUCH_ID = "__collection_workflow__" as const;

function mapStatus(s: CollectionExecutionActionStatus): AssortmentActionStatus {
  if (s === "blocked") return "deferred";
  if (s === "accepted") return "accepted";
  return s;
}

function toCore(snapshotId: string, row: CollectionExecutionAction): Omit<
  AssortmentAction,
  | "leverageScore"
  | "effortScore"
  | "operationalRisk"
  | "executionPressure"
  | "confidence"
  | "expectedOutcome"
  | "urgencyBand"
  | "executiveQueues"
  | "priorityReasons"
  | "leverageReasons"
  | "riskReasons"
  | "effortReasons"
  | "trustNote"
> {
  return {
    id: row.id,
    sourceSnapshotId: snapshotId,
    actionType: "collection_workflow_step",
    category: "collection",
    titleKey: "cab.assortment.title",
    reasonKey: "cab.assortment.reason",
    titleVars: { title: row.title, name: row.sourceCollectionName },
    reasonVars: { reason: row.reason, corridor: row.linkedCorridor || "—" },
    affectedSkuIds: [COLLECTION_WORKFLOW_TOUCH_ID],
    affectedCardIds: [],
    corridor: row.linkedCorridor || undefined,
    marketplace: row.marketplaceTarget || undefined,
    priority: row.priority,
    expectedImpact: "high",
    difficulty: "medium",
    ownerSystem: row.targetSystem,
    suggestedDestination: row.suggestedDestination as NavId,
    status: mapStatus(row.status),
    createdAt: row.createdAt,
    collectionDerived: true,
    collectionSourceStage: row.sourceStage,
    collectionId: row.sourceCollectionId,
    collectionName: row.sourceCollectionName,
  };
}

export function collectionExecutionActionsToAssortmentActions(
  snapshot: EntitySnapshot,
  rows: CollectionExecutionAction[],
): AssortmentAction[] {
  if (!rows.length) return [];
  const partial = rows.map((r) => ({
    ...toCore(snapshot.id, r),
    ...ASSORTMENT_ECON_PLACEHOLDER,
  })) as AssortmentAction[];
  return enrichAssortmentActions(snapshot, partial);
}

export function mergeCollectionExecutionIntoAssortmentActions(
  snapshot: EntitySnapshot,
  base: AssortmentAction[],
  rows: CollectionExecutionAction[],
): AssortmentAction[] {
  const converted = collectionExecutionActionsToAssortmentActions(snapshot, rows);
  const ids = new Set(converted.map((x) => x.id));
  const rest = base.filter((a) => !ids.has(a.id) && !a.collectionDerived);
  return [...converted, ...rest];
}
