import type { MarketplaceLaunchPlan } from "../types";

export const LAUNCH_REVIEW_MEMORY_SCHEMA = "vokra.launchReview.v1" as const;

/** Structured post-launch judgment — no marketplace API metrics. */
export type LaunchReviewOutcomeLabel =
  | "successful"
  | "partial"
  | "blocked"
  | "paused"
  | "needs_refresh"
  | "needs_cleanup"
  | "needs_followup";

export type MarketplaceLaunchReview = {
  id: string;
  sourceLaunchPlanId: string;
  collectionId: string;
  collectionName: string;
  marketplace: string;
  createdAt: number;
  launchDate: string;
  reviewedAt: number;
  outcomeState: LaunchReviewOutcomeLabel;
  launchedItems: string;
  heldItems: string;
  blockedItems: string;
  earlyMarketObservation: string;
  productionIssues: string;
  contentIssues: string;
  fulfillmentIssues: string;
  competitorObservation: string;
  suspectedOutcome: string;
  nextDecision: string;
  learningNotes: string;
  followUpActions: string;
  /** Transparent heuristic lines for the next launch cycle. */
  learningReinforcement: string[];
};

export type LaunchReviewMemoryPayload = {
  schema: typeof LAUNCH_REVIEW_MEMORY_SCHEMA;
  savedAt: number;
  review: MarketplaceLaunchReview;
  plan?: MarketplaceLaunchPlan | null;
};

export const LAUNCH_REVIEWS_STORAGE_KEY = "vokra.launchReviews.v1" as const;
