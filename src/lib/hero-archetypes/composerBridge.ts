import { pushHeroPlanComposerPayload } from "../hero-improvement-plan";
import type { HeroPromptArchetype } from "../prompt-composer/types";
import type { HeroArchetypeIntelligenceReport } from "./types";

export function pushArchetypeIntelligenceToComposer(
  report: HeroArchetypeIntelligenceReport,
  corridor: string,
  suggestedHeroArch: HeroPromptArchetype,
): void {
  const recommended = `${report.recommendedDirectionLine} · ${report.vokraPrimaryDirectionLine}`.slice(0, 600);
  const promptDir = `${report.saturationSummary} ${report.overlapSummary}`.slice(0, 500);
  const neg = `${report.overlapRiskLine} · ${report.practicalRecommendations.slice(0, 3).join(" · ")}`.slice(0, 1100);
  pushHeroPlanComposerPayload({
    query: report.query,
    marketplace: report.marketplace,
    recommendedHeroDirection: recommended,
    promptDirection: promptDir,
    negativeConstraints: neg,
    corridor: corridor.trim() || "archive_luxury",
    suggestedHeroArch,
    garmentFocusLine: `${corridor}: ${report.recommendedDirectionLine}`.slice(0, 220),
    printFocusLine: report.vokraFitLines.join(" · ").slice(0, 220),
    source: "archetype",
  });
}
