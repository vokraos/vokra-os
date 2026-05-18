import type { LaunchWaveOperationalEntity } from "../marketplace-operations/types";
import type { MarketplaceLaunchReview } from "../launch-ops/review/types";

const MS_21D = 21 * 24 * 60 * 60 * 1000;
const MS_45D = 45 * 24 * 60 * 60 * 1000;

export function computeSpacingQuality(args: {
  waves: LaunchWaveOperationalEntity[];
  reviews: MarketplaceLaunchReview[];
  corridorSkuTotal: number;
}): number {
  const { waves, reviews, corridorSkuTotal } = args;
  if (!waves.length && !reviews.length) return corridorSkuTotal > 8 ? 45 : 60;

  let score = 70;
  const hot = waves.filter((w) => ["assembling", "ready", "launched"].includes(w.launchStatus));
  if (hot.length >= 3) score -= 28;
  else if (hot.length === 2) score -= 14;
  else if (hot.length === 1 && hot[0]!.launchStatus === "launched") score += 8;

  const now = Date.now();
  const recentReviews = reviews.filter((r) => now - r.reviewedAt < MS_45D);
  if (recentReviews.length >= 2) {
    const gaps = recentReviews
      .map((r) => r.reviewedAt)
      .sort((a, b) => a - b)
      .slice(1)
      .map((t, i) => t - recentReviews[i]!.reviewedAt);
    const minGap = gaps.length ? Math.min(...gaps) : MS_45D;
    if (minGap < MS_21D) score -= 22;
    else if (minGap > MS_45D) score += 10;
  }

  if (corridorSkuTotal >= 12 && hot.length <= 1) score += 12;
  return Math.round(Math.max(8, Math.min(100, score)));
}

export function launchTimingLabelKey(spacingQuality: number, overlapPressure: number): string {
  if (overlapPressure >= 55) return "mtm.launch.overlap";
  if (spacingQuality >= 68) return "mtm.launch.wellSpaced";
  if (spacingQuality >= 45) return "mtm.launch.tight";
  return "mtm.launch.holdSpacing";
}
