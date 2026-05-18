import { stableActionId } from "../../assortment-actions/hash";
import type { MarketplaceLaunchPlan, LaunchExecutionAction } from "../types";
import { bulkMergeLaunchExecutionActions } from "../assortmentStorage";
import type { MarketplaceLaunchReview } from "./types";
import { deriveReviewLearningFlags } from "./learning";

type TFn = (key: string, vars?: Record<string, string>) => string;

function mkFromReview(
  review: MarketplaceLaunchReview,
  plan: MarketplaceLaunchPlan,
  stage: LaunchExecutionAction["sourceStage"],
  titleKey: string,
  reasonKey: string,
  priority: LaunchExecutionAction["priority"],
  urgency: LaunchExecutionAction["urgency"],
  destination: LaunchExecutionAction["suggestedDestination"],
  t: TFn,
  suffix?: string,
): LaunchExecutionAction {
  const now = Date.now();
  const id = stableActionId(["launch-rev", review.id, stage, suffix ?? "0"]);
  return {
    id,
    sourceLaunchPlanId: plan.id,
    sourceCollectionId: review.collectionId,
    sourceCollectionName: review.collectionName,
    sourceStage: stage,
    title: t(titleKey, { name: review.collectionName }),
    reason: t(reasonKey, { name: review.collectionName }),
    priority,
    urgency,
    targetSystem: "launch_review",
    suggestedDestination: destination,
    linkedCorridor: review.collectionName,
    marketplaceTarget: review.marketplace,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
}

function linesFromFollowUp(text: string): string[] {
  return text
    .split(/\n|;|•/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .slice(0, 6);
}

export function buildLaunchReviewAssortmentActions(
  review: MarketplaceLaunchReview,
  plan: MarketplaceLaunchPlan,
  mode: "followup" | "refresh" | "cleanup" | "competitive",
  t: TFn,
): LaunchExecutionAction[] {
  const flags = deriveReviewLearningFlags(review);
  const out: LaunchExecutionAction[] = [];

  if (mode === "followup") {
    const lines = linesFromFollowUp(review.followUpActions);
    if (lines.length) {
      lines.forEach((line, i) => {
        out.push({
          ...mkFromReview(
            review,
            plan,
            "launch_review",
            "lrev.aa.followup.title",
            "lrev.aa.followup.reason",
            "high",
            "elevated",
            "assortmentActions",
            t,
            String(i),
          ),
          title: line.slice(0, 120),
          reason: review.nextDecision.slice(0, 160) || t("lrev.aa.followup.reason", { name: review.collectionName }),
        });
      });
    } else {
      out.push(
        mkFromReview(
          review,
          plan,
          "launch_review",
          "lrev.aa.followup.title",
          "lrev.aa.followup.reason",
          "high",
          "elevated",
          "assortmentActions",
          t,
        ),
      );
    }
    if (flags.carryHeldItems && review.heldItems.trim()) {
      out.push({
        ...mkFromReview(
          review,
          plan,
          "launch_hold",
          "lrev.aa.carryHeld.title",
          "lrev.aa.carryHeld.reason",
          "medium",
          "medium",
          "launchOperations",
          t,
        ),
        reason: review.heldItems.slice(0, 160),
      });
    }
    return out;
  }

  if (mode === "refresh") {
    out.push(
      mkFromReview(
        review,
        plan,
        "refresh_wave",
        "lrev.aa.refresh.title",
        "lrev.aa.refresh.reason",
        "medium",
        "elevated",
        "competitiveMap",
        t,
      ),
    );
    return out;
  }

  if (mode === "cleanup") {
    out.push(
      mkFromReview(
        review,
        plan,
        "blocker_review",
        "lrev.aa.cleanup.title",
        "lrev.aa.cleanup.reason",
        "high",
        "elevated",
        "cardProduction",
        t,
      ),
    );
    return out;
  }

  if (mode === "competitive") {
    out.push({
      ...mkFromReview(
        review,
        plan,
        "launch_review",
        "lrev.aa.competitive.title",
        "lrev.aa.competitive.reason",
        "medium",
        "medium",
        "competitiveMap",
        t,
      ),
      reason: review.competitorObservation.slice(0, 160) || t("lrev.aa.competitive.reason", { name: review.collectionName }),
    });
    return out;
  }

  return out;
}

export function addLaunchReviewActionsToAssortmentPlan(
  snapshotId: string,
  review: MarketplaceLaunchReview,
  plan: MarketplaceLaunchPlan,
  mode: "followup" | "refresh" | "cleanup" | "competitive",
  t: TFn,
): LaunchExecutionAction[] {
  const actions = buildLaunchReviewAssortmentActions(review, plan, mode, t);
  if (actions.length) bulkMergeLaunchExecutionActions(snapshotId, actions);
  return actions;
}
