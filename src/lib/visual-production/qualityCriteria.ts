import type { PromptPackKind } from "../prompt-pack/types";
import type { VisualProductionJobType } from "./types";

function marketplaceHeroCriteria(): string[] {
  return [
    "Product readable",
    "Print readable",
    "Silhouette clear",
    "Premium perception",
    "Low visual noise",
    "Mobile thumbnail safe",
  ];
}

function exhibitionCriteria(): string[] {
  return [
    "Booth / capsule visible",
    "VOKRA branding subtle",
    "Premium B2B impression",
    "DTF capability visible",
    "Realistic garments",
  ];
}

function corporateCriteria(): string[] {
  return [
    "Modern staffwear feel",
    "Subtle branding",
    "Production realism",
    "B2B commercial clarity",
  ];
}

function defaultCommercialCriteria(): string[] {
  return [
    "Print readable at mobile crop",
    "Silhouette legible",
    "Premium perception",
    "Low clutter / low noise",
    "DTF-realistic finish",
  ];
}

/** Quality checklist per job lane and pack context (English — operational clarity). */
export function qualityCriteriaForJob(
  jobType: VisualProductionJobType,
  packKind: PromptPackKind,
): readonly string[] {
  if (packKind === "exhibition_capsule" || jobType === "exhibition_visual") {
    return exhibitionCriteria();
  }
  if (packKind === "corporate_merch" || jobType === "corporate_merch_visual") {
    return corporateCriteria();
  }
  if (jobType === "hero_visual" && (packKind === "marketplace_launch" || packKind === "campaign")) {
    return marketplaceHeroCriteria();
  }
  if (jobType === "size_grid_visual") {
    return [
      ...marketplaceHeroCriteria(),
      "Size steps legible",
      "Consistent lighting across grid",
    ];
  }
  if (jobType === "reels_concept") {
    return [
      "Vertical-safe framing",
      "Print readable in first 2s",
      "Beat-friendly pacing",
      "Low motion blur on garment",
    ];
  }
  return defaultCommercialCriteria();
}
