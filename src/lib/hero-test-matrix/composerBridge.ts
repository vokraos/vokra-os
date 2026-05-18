import { pushHeroPlanComposerPayload } from "../hero-improvement-plan";
import type { HeroPromptArchetype } from "../prompt-composer/types";
import type { HeroTestMatrix, HeroTestVariant } from "./types";

export function pushTestMatrixVariantToComposer(
  matrix: HeroTestMatrix,
  variant: HeroTestVariant,
  corridor: string,
  suggestedHeroArch: HeroPromptArchetype,
): void {
  pushHeroPlanComposerPayload({
    query: matrix.query,
    marketplace: matrix.marketplace,
    recommendedHeroDirection: `${variant.variantName} · ${variant.hypothesis}`.slice(0, 600),
    promptDirection: [
      variant.visualDirection,
      `Changed: ${variant.changedVariable}`,
      matrix.baselineHeroDirection,
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 1200),
    negativeConstraints: [...variant.dangerZones, ...matrix.riskNotes].join(" · ").slice(0, 1400),
    corridor: corridor.trim() || "archive_luxury",
    suggestedHeroArch,
    garmentFocusLine: variant.archetypeDirection.slice(0, 220),
    printFocusLine: `${variant.readabilityGoal} · ${variant.premiumGoal}`.slice(0, 220),
    source: "test_matrix" as const,
    variantHypothesis: variant.hypothesis,
    changedVariable: variant.changedVariable,
    readabilityGoal: variant.readabilityGoal,
    archetypeDirection: variant.archetypeDirection,
    premiumDirection: variant.premiumGoal,
  });
}
