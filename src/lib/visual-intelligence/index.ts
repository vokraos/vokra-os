export type {
  VisualCorridorId,
  VisualDirectionEntity,
  HeroVisualEntity,
  HeroCompositionType,
  VisualCorridorGrammar,
  CampaignVisualEntity,
  CampaignVisualRole,
  MarketplaceVisualPhysics,
  VisualFatigueState,
  VisualMemoryLedgerItem,
  VisualMemoryCategory,
  PromptFoundationSlot,
  PromptFoundationTemplate,
  VisualStrategySnapshot,
} from "./types";
export { VISUAL_CORRIDOR_CATALOG, corridorByIndex, visualCorridorFromMarketplaceCorridorId } from "./corridors";
export { VOKRA_VISUAL_DNA_TRAITS, GENERIC_MARKETPLACE_VISUAL_TRAPS, vokraVsGenericDigestRu, vokraVsGenericDigestEn } from "./dna";
export { buildMarketplaceVisualPhysics } from "./marketplace-physics";
export { buildHeroVisualEntity } from "./hero-system";
export { buildVisualFatigueState } from "./fatigue-engine";
export { buildCampaignVisualEntity } from "./campaign-structure";
export { buildPromptFoundationTemplate, PROMPT_FOUNDATION_ORDER } from "./prompt-foundation";
export { buildVisualDirectionEntity, buildVisualStrategySnapshot, type VisualStrategySnapshotInput } from "./snapshot";
export { useVisualStrategySnapshot } from "./useVisualStrategySnapshot";
