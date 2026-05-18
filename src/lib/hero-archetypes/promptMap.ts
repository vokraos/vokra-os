import type { HeroPromptArchetype } from "../prompt-composer/types";
import type { ArchetypeShare } from "./types";

export function suggestedPromptArchFromShares(shares: readonly ArchetypeShare[]): HeroPromptArchetype {
  const top = shares[0]?.archetype;
  const pc = shares.find((s) => s.archetype === "premium_cinematic")?.sharePct ?? 0;
  if (top === "clean_marketplace" || top === "mass_market_bright" || top === "hyper_commercial") {
    if (pc < 16) return "cinematic_movement_hero";
    return "static_luxury_hero";
  }
  if (top === "dark_brutal") return "cinematic_movement_hero";
  if (top === "luxury_minimal") return "static_luxury_hero";
  if (top === "emotional_lifestyle") return "cinematic_movement_hero";
  return "clean_marketplace_hero";
}
