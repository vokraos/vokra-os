import { stableActionId } from "../assortment-actions/hash";
import type { MarketplaceLaunchPlan, LaunchExecutionAction, LaunchExecutionStageId } from "./types";
import { bulkMergeLaunchExecutionActions } from "./assortmentStorage";

type TFn = (key: string, vars?: Record<string, string>) => string;

function mkAction(
  plan: MarketplaceLaunchPlan,
  stage: LaunchExecutionStageId,
  titleKey: string,
  reasonKey: string,
  priority: LaunchExecutionAction["priority"],
  urgency: LaunchExecutionAction["urgency"],
  destination: LaunchExecutionAction["suggestedDestination"],
  t: TFn,
): LaunchExecutionAction {
  const now = Date.now();
  const corridor = plan.collectionName;
  return {
    id: stableActionId(["launch-exec", plan.id, stage]),
    sourceLaunchPlanId: plan.id,
    sourceCollectionId: plan.collectionId,
    sourceCollectionName: plan.collectionName,
    sourceStage: stage,
    title: t(titleKey, { name: plan.collectionName }),
    reason: t(reasonKey, { name: plan.collectionName }),
    priority,
    urgency,
    targetSystem: "launch_operations",
    suggestedDestination: destination,
    linkedCorridor: corridor,
    marketplaceTarget: plan.marketplace,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
}

export function buildLaunchExecutionActionsFromPlan(
  plan: MarketplaceLaunchPlan,
  mode: "blockers" | "review" | "hold" | "expansion" | "refresh",
  t: TFn,
): LaunchExecutionAction[] {
  const out: LaunchExecutionAction[] = [];
  if (mode === "blockers") {
    for (const b of plan.blockers.slice(0, 6)) {
      out.push({
        ...mkAction(plan, "blocker_review", "lops.aa.blocker.title", "lops.aa.blocker.reason", "high", "elevated", "launchOperations", t),
        id: stableActionId(["launch-exec", plan.id, b.id]),
        title: b.label,
        reason: t("lops.aa.blocker.reasonDetail", { source: b.source }),
      });
    }
    return out;
  }
  if (mode === "review") {
    out.push(mkAction(plan, "launch_review", "lops.aa.review.title", "lops.aa.review.reason", "high", "elevated", "launchOperations", t));
    return out;
  }
  if (mode === "hold") {
    out.push(mkAction(plan, "launch_hold", "lops.aa.hold.title", "lops.aa.hold.reason", "critical", "critical", "launchOperations", t));
    return out;
  }
  if (mode === "expansion") {
    out.push(mkAction(plan, "expansion_wave", "lops.aa.expansion.title", "lops.aa.expansion.reason", "medium", "medium", "collectionBuilder", t));
    return out;
  }
  if (mode === "refresh") {
    out.push(mkAction(plan, "refresh_wave", "lops.aa.refresh.title", "lops.aa.refresh.reason", "medium", "elevated", "competitiveMap", t));
    return out;
  }
  return out;
}

export function addLaunchActionsToAssortmentPlan(
  snapshotId: string,
  plan: MarketplaceLaunchPlan,
  mode: "blockers" | "review" | "hold" | "expansion" | "refresh",
  t: TFn,
): LaunchExecutionAction[] {
  const actions = buildLaunchExecutionActionsFromPlan(plan, mode, t);
  if (actions.length) bulkMergeLaunchExecutionActions(snapshotId, actions);
  return actions;
}
