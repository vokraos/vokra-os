/** Phase 13 — Visual Intelligence Core (strategy architecture, no image generation). */

export type VisualCorridorId =
  | "archive_luxury"
  | "quiet_streetwear"
  | "brutal_monochrome"
  | "washed_vintage"
  | "corporate_futurewear"
  | "premium_basics"
  | "dark_editorial"
  | "cinematic_utility";

export type CampaignVisualRole = "hero_window" | "support_matrix" | "reels_pressure" | "thumbnail_war";

export type VisualDirectionEntity = {
  id: string;
  name: string;
  corridor: VisualCorridorId;
  visualMood: string;
  premiumLevel: number;
  marketplaceFit: number;
  dtfCompatibility: number;
  fatigueRisk: number;
  heroSuitability: number;
  campaignRole: CampaignVisualRole;
};

export type HeroCompositionType =
  | "static_luxury_hero"
  | "cinematic_movement_hero"
  | "brutalist_studio_hero"
  | "architectural_street_hero"
  | "clean_marketplace_hero";

export type HeroVisualEntity = {
  id: string;
  compositionType: HeroCompositionType;
  modelFraming: string;
  garmentVisibility: number;
  printVisibility: number;
  readability: number;
  ctrSuitability: number;
  premiumPerception: number;
  refreshAge: number;
  overlapRisk: number;
};

export type VisualCorridorGrammar = {
  id: VisualCorridorId;
  labelRu: string;
  labelEn: string;
  /** Short grammar lines for operators / future prompt composer */
  grammarLines: readonly string[];
};

export type CampaignVisualEntity = {
  id: string;
  heroVisualId: string;
  supportVisualIds: readonly string[];
  reelsDirection: string;
  thumbnailLogic: string;
  backgroundStyle: string;
  castingLogic: string;
  visualPacing: string;
};

/** Marketplace visual physics — scores 0–100 where applicable */
export type MarketplaceVisualPhysics = {
  thumbnailReadability: number;
  mobileContrast: number;
  heroFocus: number;
  printDominance: number;
  silhouetteRecognition: number;
  visualNoise: number;
  conversionClarity: number;
  visualFatigue: number;
  overlapSaturation: number;
  /** Operator-facing diagnostics (RU primary in snapshot strings) */
  diagnosticsRu: readonly string[];
};

export type VisualFatigueState = {
  score: number;
  refreshAge: number;
  overlapPressure: number;
  compositionRepetition: number;
  corridorDuplication: number;
  heroFatigue: number;
  visualSaturation: number;
  signalsRu: readonly string[];
  signalsEn: readonly string[];
};

export type VisualMemoryCategory =
  | "hero_success"
  | "wave_failure"
  | "fatigue_history"
  | "overlap_event"
  | "campaign_recovery"
  | "premium_win";

export type VisualMemoryLedgerItem = {
  id: string;
  category: VisualMemoryCategory;
  labelRu: string;
  labelEn: string;
  /** Deterministic narrative line derived from OS tick (not random moodboard copy) */
  noteRu: string;
  noteEn: string;
  severity: "info" | "watch" | "critical";
};

export type PromptFoundationSlot =
  | "corridor"
  | "visual_mood"
  | "composition"
  | "lighting"
  | "model_style"
  | "garment_focus"
  | "marketplace_logic"
  | "cinematic_direction"
  | "dtf_compatibility"
  | "premium_level";

/** Structural slots for a future Prompt Composer Engine — no prompt text generation here */
export type PromptFoundationTemplate = {
  schema: "vokra.promptFoundation.v1";
  slots: Record<PromptFoundationSlot, string>;
  /** Ordering hint for composer */
  slotOrder: readonly PromptFoundationSlot[];
};

export type VisualStrategySnapshot = {
  generatedAt: number;
  pulseSeed: number;
  locale: "ru" | "en";
  corridors: readonly VisualCorridorGrammar[];
  activeDirections: readonly VisualDirectionEntity[];
  heroVisual: HeroVisualEntity;
  campaign: CampaignVisualEntity;
  physics: MarketplaceVisualPhysics;
  fatigue: VisualFatigueState;
  memoryLedger: readonly VisualMemoryLedgerItem[];
  promptFoundation: PromptFoundationTemplate;
  integrationDigestRu: readonly string[];
  integrationDigestEn: readonly string[];
};
