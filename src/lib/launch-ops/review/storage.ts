import { lsGet, lsSet } from "../../storage";
import { LAUNCH_REVIEWS_STORAGE_KEY, type MarketplaceLaunchReview } from "./types";

type Root = {
  schema: typeof LAUNCH_REVIEWS_STORAGE_KEY;
  byPlanId: Record<string, MarketplaceLaunchReview>;
  byCollectionId: Record<string, string>;
};

function parseRoot(): Root {
  const raw = lsGet(LAUNCH_REVIEWS_STORAGE_KEY);
  if (!raw) {
    return { schema: LAUNCH_REVIEWS_STORAGE_KEY, byPlanId: {}, byCollectionId: {} };
  }
  try {
    const o = JSON.parse(raw) as Root;
    return o?.byPlanId ? o : { schema: LAUNCH_REVIEWS_STORAGE_KEY, byPlanId: {}, byCollectionId: {} };
  } catch {
    return { schema: LAUNCH_REVIEWS_STORAGE_KEY, byPlanId: {}, byCollectionId: {} };
  }
}

function saveRoot(r: Root) {
  try {
    lsSet(LAUNCH_REVIEWS_STORAGE_KEY, JSON.stringify(r));
  } catch {
    /* quota */
  }
}

export function saveLaunchReview(review: MarketplaceLaunchReview): void {
  const r = parseRoot();
  r.byPlanId[review.sourceLaunchPlanId] = review;
  r.byCollectionId[review.collectionId] = review.sourceLaunchPlanId;
  saveRoot(r);
}

export function loadLaunchReviewForPlan(planId: string): MarketplaceLaunchReview | null {
  return parseRoot().byPlanId[planId] ?? null;
}

export function loadLatestLaunchReviewForCollection(collectionId: string): MarketplaceLaunchReview | null {
  const r = parseRoot();
  const planId = r.byCollectionId[collectionId];
  if (!planId) return null;
  return r.byPlanId[planId] ?? null;
}
