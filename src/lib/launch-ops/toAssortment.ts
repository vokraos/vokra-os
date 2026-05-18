import type { NavId } from "../../types";
import { ASSORTMENT_ECON_PLACEHOLDER, enrichAssortmentActions } from "../assortment-actions/prioritization";
import type { AssortmentAction, AssortmentActionStatus } from "../assortment-actions/types";
import type { EntitySnapshot } from "../entity-snapshot/types";
import type { LaunchExecutionAction, LaunchExecutionActionStatus } from "./types";

export const LAUNCH_WORKFLOW_TOUCH_ID = "__launch_workflow__" as const;

function mapStatus(s: LaunchExecutionActionStatus): AssortmentActionStatus {
  if (s === "blocked") return "deferred";
  if (s === "accepted") return "accepted";
  return s;
}

function toCore(snapshotId: string, row: LaunchExecutionAction): Omit<
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
    actionType: "launch_workflow_step",
    category: "collection",
    titleKey: "lops.assortment.title",
    reasonKey: "lops.assortment.reason",
    titleVars: { title: row.title, name: row.sourceCollectionName },
    reasonVars: { reason: row.reason, corridor: row.linkedCorridor || "—" },
    affectedSkuIds: [LAUNCH_WORKFLOW_TOUCH_ID],
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
    launchDerived: true,
    launchPlanId: row.sourceLaunchPlanId,
    launchSourceStage: row.sourceStage,
    collectionId: row.sourceCollectionId,
    collectionName: row.sourceCollectionName,
  };
}

export function launchExecutionActionsToAssortmentActions(
  snapshot: EntitySnapshot,
  rows: LaunchExecutionAction[],
): AssortmentAction[] {
  if (!rows.length) return [];
  const partial = rows.map((r) => ({ ...toCore(snapshot.id, r), ...ASSORTMENT_ECON_PLACEHOLDER })) as AssortmentAction[];
  return enrichAssortmentActions(snapshot, partial);
}

export function mergeLaunchExecutionIntoAssortmentActions(
  snapshot: EntitySnapshot,
  base: AssortmentAction[],
  rows: LaunchExecutionAction[],
): AssortmentAction[] {
  const converted = launchExecutionActionsToAssortmentActions(snapshot, rows);
  const ids = new Set(converted.map((x) => x.id));
  const rest = base.filter((a) => !ids.has(a.id) && !a.launchDerived);
  return [...converted, ...rest];
}
