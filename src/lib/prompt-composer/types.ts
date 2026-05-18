import type { VisualCorridorId } from "../visual-intelligence/types";

/** Modular prompt stack — order matters for assembly */
export type PromptLayerId =
  | "corridor"
  | "visual_mood"
  | "composition"
  | "lighting"
  | "model_direction"
  | "garment_focus"
  | "marketplace_logic"
  | "camera_logic"
  | "premium_perception"
  | "dtf_compatibility"
  | "brand_dna"
  | "negative_constraints";

export type MarketplacePromptType =
  | "wb_hero_card"
  | "ozon_hero_card"
  | "premium_editorial"
  | "reels_visual"
  | "campaign_visual"
  | "launch_teaser"
  | "detail_shot"
  | "size_grid"
  | "lifestyle_visual"
  | "corporate_capsule_visual";

export type MarketplaceTarget = "wb" | "ozon" | "neutral";

export type HeroPromptArchetype =
  | "static_luxury_hero"
  | "cinematic_movement_hero"
  | "brutalist_studio_hero"
  | "architectural_street_hero"
  | "clean_marketplace_hero";

export type ComposerPhysicsInput = {
  thumbnailReadability: number;
  mobileContrast: number;
  heroFocus: number;
  printDominance: number;
  silhouetteRecognition: number;
  visualNoise: number;
  conversionClarity: number;
  visualFatigue: number;
  overlapSaturation: number;
};

export type PromptComposerInput = {
  corridorId: VisualCorridorId;
  promptType: MarketplacePromptType;
  marketplaceTarget: MarketplaceTarget;
  visualMood: string;
  garmentFocus: string;
  printFocus: string;
  heroArchetype: HeroPromptArchetype;
  brandDnaLine: string;
  physics: ComposerPhysicsInput;
  fatigueScore: number;
  premiumPerception: number;
  /** Optional collection / SKU anchor for export metadata */
  collectionName?: string;
};

export type PromptOutputPack = {
  short: string;
  fullCinematic: string;
  marketplaceOptimized: string;
  editorial: string;
  reelsDirection: string;
};

export type ComposedPromptBundle = {
  schema: "vokra.promptComposer.v1";
  generatedAt: number;
  input: PromptComposerInput;
  layers: Record<PromptLayerId, string>;
  negatives: readonly string[];
  outputs: PromptOutputPack;
  refreshNotes: readonly string[];
};
