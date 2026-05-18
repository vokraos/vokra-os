import { pushHeroPlanComposerPayload } from "../hero-improvement-plan";
import type { HeroPromptArchetype } from "../prompt-composer/types";
import type { CompetitiveGapAnalysis } from "./types";
import type { OurCardCompetitiveSnapshot } from "./types";

export function pushGapAnalysisToComposer(
  gap: CompetitiveGapAnalysis,
  our: OurCardCompetitiveSnapshot,
  corridor: string,
  suggestedHeroArch: HeroPromptArchetype,
): void {
  const direction = gap.recommendedChanges.join(" · ").slice(0, 600);
  const promptDir = `${gap.readabilityGap} ${gap.premiumGap}`.slice(0, 500);
  const neg = `${gap.riskFlags.join(" · ")} · avoid CTR claims`.slice(0, 1100);
  pushHeroPlanComposerPayload({
    query: gap.query,
    marketplace: gap.marketplace,
    recommendedHeroDirection: direction,
    promptDirection: promptDir,
    negativeConstraints: neg,
    corridor: corridor.trim() || "archive_luxury",
    suggestedHeroArch,
    garmentFocusLine: `${corridor}: ${gap.visualGap}`.slice(0, 220),
    printFocusLine: `${our.cardTitle} · ${gap.readabilityGap}`.slice(0, 220),
    source: "gap",
  });
}
