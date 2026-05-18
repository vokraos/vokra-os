import type { LaunchBlocker, LaunchReadinessLevel } from "../types";
import type { MarketplaceLaunchReview } from "./types";

export type ReviewLearningFlags = {
  packagingRisk: boolean;
  contentBlocker: boolean;
  fulfillmentRisk: boolean;
  competitorFollowUp: boolean;
  refreshWave: boolean;
  expansionHold: boolean;
  carryHeldItems: boolean;
};

export function deriveReviewLearningFlags(review: MarketplaceLaunchReview): ReviewLearningFlags {
  const prod = review.productionIssues.toLowerCase();
  const content = review.contentIssues.toLowerCase();
  const fulfill = review.fulfillmentIssues.toLowerCase();
  const comp = review.competitorObservation.trim();
  const held = review.heldItems.trim();

  return {
    packagingRisk: /packag|упаков|dtf|print|печат/i.test(prod),
    contentBlocker: content.length > 12 || review.outcomeState === "needs_cleanup",
    fulfillmentRisk: fulfill.length > 12 || /fbo|fbs|склад|fulfill/i.test(fulfill),
    competitorFollowUp: comp.length > 16,
    refreshWave:
      review.outcomeState === "needs_refresh" ||
      /refresh|обнов|fatigue|устал/i.test(review.earlyMarketObservation + review.suspectedOutcome),
    expansionHold:
      review.outcomeState === "partial" ||
      review.outcomeState === "paused" ||
      review.outcomeState === "blocked",
    carryHeldItems: held.length > 8 && review.outcomeState === "partial",
  };
}

export function deriveReviewLearningReinforcement(
  review: MarketplaceLaunchReview,
  flags: ReviewLearningFlags,
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const lines: string[] = [];
  const push = (key: string, vars?: Record<string, string>) => lines.push(t(key, vars));

  push("lrev.learn.outcome", { state: t(`lrev.state.${review.outcomeState}`) });

  if (flags.packagingRisk) push("lrev.learn.packaging");
  if (flags.contentBlocker) push("lrev.learn.content");
  if (flags.fulfillmentRisk) push("lrev.learn.fulfillment");
  if (flags.competitorFollowUp) push("lrev.learn.competitor");
  if (flags.refreshWave) push("lrev.learn.refresh");
  if (flags.expansionHold) push("lrev.learn.expansionHold");
  if (flags.carryHeldItems) push("lrev.learn.carryHeld", { items: review.heldItems.slice(0, 100) });

  if (review.productionIssues.trim()) {
    push("lrev.learn.echoProduction", { note: review.productionIssues.slice(0, 120) });
  }
  if (review.contentIssues.trim()) {
    push("lrev.learn.echoContent", { note: review.contentIssues.slice(0, 120) });
  }

  const seen = new Set<string>();
  return lines.filter((x) => {
    if (seen.has(x)) return false;
    seen.add(x);
    return true;
  }).slice(0, 10);
}

export function mergeReviewIntoBlockers(
  blockers: LaunchBlocker[],
  review: MarketplaceLaunchReview | null,
  flags: ReviewLearningFlags | null,
  t: (key: string, vars?: Record<string, string>) => string,
): LaunchBlocker[] {
  if (!review || !flags) return blockers;
  const out = [...blockers];
  const push = (id: string, labelKey: string, severity: LaunchBlocker["severity"], source: string) => {
    if (out.some((b) => b.id === id)) return;
    out.push({ id, label: t(labelKey, { name: review.collectionName }), severity, source });
  };

  if (flags.packagingRisk) push("rev_packaging", "lrev.blocker.packaging", "medium", "launch_review");
  if (flags.contentBlocker) push("rev_content", "lrev.blocker.content", "high", "launch_review");
  if (flags.fulfillmentRisk) push("rev_fulfillment", "lrev.blocker.fulfillment", "medium", "launch_review");
  if (review.outcomeState === "blocked") push("rev_blocked", "lrev.blocker.priorBlocked", "high", "launch_review");

  return out.slice(0, 14);
}

export function mergeReviewIntoRecommendations(
  lines: string[],
  review: MarketplaceLaunchReview | null,
  flags: ReviewLearningFlags | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  if (!review || !flags) return lines;
  const out = [...lines];
  const push = (key: string, vars?: Record<string, string>) => {
    const line = t(key, vars);
    if (!out.includes(line)) out.push(line);
  };

  if (flags.carryHeldItems) push("lrev.rec.carryHeld");
  if (flags.competitorFollowUp) push("lrev.rec.competitiveMap");
  if (flags.refreshWave) push("lrev.rec.refreshWave");
  if (flags.contentBlocker) push("lrev.rec.cardProduction");
  if (flags.packagingRisk) push("lrev.rec.productionCheck");
  if (review.nextDecision.trim()) push("lrev.rec.nextDecision", { decision: review.nextDecision.slice(0, 120) });

  return out.slice(0, 10);
}

export function adjustReadinessForReview(
  level: LaunchReadinessLevel,
  score: number,
  review: MarketplaceLaunchReview | null,
): { level: LaunchReadinessLevel; score: number } {
  if (!review) return { level, score };
  let s = score;
  if (review.outcomeState === "blocked") s -= 12;
  if (review.outcomeState === "partial") s -= 6;
  if (review.outcomeState === "needs_cleanup") s -= 8;
  if (review.outcomeState === "needs_refresh") s -= 4;
  s = Math.max(0, Math.min(100, s));

  let next = level;
  if (review.outcomeState === "blocked" && s < 48) next = "blocked";
  else if (review.outcomeState === "partial" && s < 58) next = "fragile";
  else if (review.outcomeState === "needs_cleanup" && s < 62) next = "fragile";

  return { level: next, score: s };
}

export function shouldForceArchiveRefresh(
  review: MarketplaceLaunchReview | null,
  flags: ReviewLearningFlags | null,
  visualFatigue: number,
): boolean {
  if (flags?.refreshWave) return true;
  if (review?.outcomeState === "needs_refresh") return true;
  return visualFatigue > 52;
}

export function shouldHoldExpansion(
  review: MarketplaceLaunchReview | null,
  flags: ReviewLearningFlags | null,
): boolean {
  if (!review || !flags) return false;
  return flags.expansionHold || review.outcomeState === "blocked" || review.outcomeState === "paused";
}
