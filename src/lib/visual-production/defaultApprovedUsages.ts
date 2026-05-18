import type { VisualApprovedUsage, VisualProductionJobType, VisualReviewStatus } from "./types";

/** When approving from quick actions, seed usage chips if founder hasn't picked any yet. */
export function defaultApprovedUsagesWhenEmpty(
  jobType: VisualProductionJobType,
  reviewStatus: VisualReviewStatus,
): VisualApprovedUsage[] {
  if (reviewStatus === "approved_marketplace") {
    if (
      jobType === "hero_visual" ||
      jobType === "hero_test_variant" ||
      jobType === "readability_test" ||
      jobType === "premium_test" ||
      jobType === "framing_test" ||
      jobType === "refresh_test"
    )
      return ["wb_hero", "ozon_hero"];
    if (jobType === "detail_shot" || jobType === "size_grid_visual") return ["rich_content", "wb_hero"];
    if (jobType === "support_visual") return ["rich_content"];
    if (jobType === "reels_concept") return ["reels"];
    if (jobType === "campaign_visual") return ["campaign", "rich_content"];
    if (jobType === "exhibition_visual") return ["exhibition", "rich_content"];
    if (jobType === "corporate_merch_visual") return ["corporate_merch", "rich_content"];
    return ["rich_content"];
  }
  if (reviewStatus === "approved_campaign") {
    if (jobType === "reels_concept") return ["reels", "campaign"];
    if (jobType === "exhibition_visual") return ["exhibition", "campaign"];
    if (jobType === "corporate_merch_visual") return ["corporate_merch", "campaign"];
    if (
      jobType === "hero_visual" ||
      jobType === "hero_test_variant" ||
      jobType === "readability_test" ||
      jobType === "premium_test" ||
      jobType === "framing_test" ||
      jobType === "refresh_test"
    )
      return ["campaign", "rich_content"];
    return ["campaign", "rich_content"];
  }
  return [];
}
