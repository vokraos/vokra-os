import type { MarketplaceLaunchPlan } from "../types";
import { newLaunchReviewId } from "./ids";
import { deriveReviewLearningFlags, deriveReviewLearningReinforcement } from "./learning";
import type { LaunchReviewOutcomeLabel, MarketplaceLaunchReview } from "./types";

export type LaunchReviewDraft = Omit<
  MarketplaceLaunchReview,
  "id" | "createdAt" | "reviewedAt" | "learningReinforcement"
>;

export function createReviewDraftFromPlan(plan: MarketplaceLaunchPlan): LaunchReviewDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    sourceLaunchPlanId: plan.id,
    collectionId: plan.collectionId,
    collectionName: plan.collectionName,
    marketplace: plan.marketplace,
    launchDate: today,
    outcomeState: "partial",
    launchedItems: "",
    heldItems: "",
    blockedItems: "",
    earlyMarketObservation: "",
    productionIssues: "",
    contentIssues: "",
    fulfillmentIssues: "",
    competitorObservation: "",
    suspectedOutcome: "",
    nextDecision: "",
    learningNotes: "",
    followUpActions: "",
  };
}

export function finalizeLaunchReview(
  draft: LaunchReviewDraft,
  t: (key: string, vars?: Record<string, string>) => string,
  existingId?: string,
): MarketplaceLaunchReview {
  const base: MarketplaceLaunchReview = {
    ...draft,
    id: existingId ?? newLaunchReviewId(),
    createdAt: Date.now(),
    reviewedAt: Date.now(),
    learningReinforcement: [],
  };
  const flags = deriveReviewLearningFlags(base);
  const reinforcement = deriveReviewLearningReinforcement(base, flags, t);
  const learningNotes =
    draft.learningNotes.trim() ||
    reinforcement.join("\n") ||
    t("lrev.learn.default");

  return {
    ...base,
    learningNotes,
    learningReinforcement: reinforcement,
  };
}

export const LAUNCH_REVIEW_OUTCOME_OPTIONS: LaunchReviewOutcomeLabel[] = [
  "successful",
  "partial",
  "blocked",
  "paused",
  "needs_refresh",
  "needs_cleanup",
  "needs_followup",
];
