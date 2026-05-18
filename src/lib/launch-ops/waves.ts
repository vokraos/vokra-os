import {
  deriveReviewLearningFlags,
  shouldForceArchiveRefresh,
  shouldHoldExpansion,
  type ReviewLearningFlags,
} from "./review/learning";
import type { MarketplaceLaunchReview } from "./review/types";
import type { LaunchOpsGatherContext, LaunchReadinessLevel, LaunchWavePlan } from "./types";

function wave(
  kind: LaunchWavePlan["kind"],
  order: number,
  title: string,
  reason: string,
  skuNote: string,
  status: LaunchWavePlan["status"],
): LaunchWavePlan {
  return { kind, sequenceOrder: order, title, reason, skuNote, status };
}

export function buildLaunchWaves(
  ctx: LaunchOpsGatherContext,
  readiness: LaunchReadinessLevel,
  t: (key: string, vars?: Record<string, string>) => string,
  review: MarketplaceLaunchReview | null = ctx.latestLaunchReview,
  reviewFlags: ReviewLearningFlags | null = review ? deriveReviewLearningFlags(review) : null,
): {
  hero: LaunchWavePlan;
  support: LaunchWavePlan;
  expansion: LaunchWavePlan;
  archiveRefresh: LaunchWavePlan;
} {
  const heroes = ctx.collection?.heroProducts.length ?? 0;
  const support = ctx.collection?.skuClusters.find((c) => c.role === "support")?.count ?? 0;
  const fatigued = ctx.visualFatigue > 52;

  const heroBlocked = readiness === "blocked" || !ctx.heroWinnerExists;
  const heroStatus: LaunchWavePlan["status"] = heroBlocked
    ? "blocked"
    : ctx.heroLaunchPackage
      ? "ready"
      : "in_progress";

  const supportBlocked = heroStatus !== "ready";
  const supportStatus: LaunchWavePlan["status"] = supportBlocked
    ? "blocked"
    : readiness === "fragile"
      ? "pending"
      : heroStatus === "ready"
        ? "ready"
        : "pending";

  const expansionHeld = shouldHoldExpansion(review, reviewFlags);
  const expansionReady = !expansionHeld && (readiness === "ready" || readiness === "expansion_ready");
  const expansionStatus: LaunchWavePlan["status"] = expansionHeld
    ? "hold"
    : expansionReady
      ? "ready"
      : readiness === "operational"
        ? "pending"
        : "blocked";

  const archiveStatus: LaunchWavePlan["status"] = shouldForceArchiveRefresh(review, reviewFlags, ctx.visualFatigue)
    ? "ready"
    : fatigued
      ? "ready"
      : "pending";

  return {
    hero: wave(
      "hero",
      1,
      t("lops.wave.hero.title"),
      t("lops.wave.hero.reason"),
      t("lops.wave.hero.sku", { n: String(heroes) }),
      heroStatus,
    ),
    support: wave(
      "support",
      2,
      t("lops.wave.support.title"),
      t("lops.wave.support.reason"),
      t("lops.wave.support.sku", { n: String(support) }),
      supportStatus,
    ),
    expansion: wave(
      "expansion",
      3,
      t("lops.wave.expansion.title"),
      t("lops.wave.expansion.reason"),
      t("lops.wave.expansion.sku"),
      expansionStatus,
    ),
    archiveRefresh: wave(
      "archive_refresh",
      4,
      t("lops.wave.archive.title"),
      t("lops.wave.archive.reason"),
      t("lops.wave.archive.sku"),
      archiveStatus,
    ),
  };
}
