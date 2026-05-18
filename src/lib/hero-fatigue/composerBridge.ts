import { pushHeroPlanComposerPayload } from "../hero-improvement-plan";
import type { HeroPromptArchetype } from "../prompt-composer/types";
import type { HeroFatigueIntelligenceReport } from "./types";

export function pushFatigueIntelligenceToComposer(
  report: HeroFatigueIntelligenceReport,
  corridor: string,
  suggestedHeroArch: HeroPromptArchetype,
): void {
  const recommended = `${report.refreshUrgencyLine} · ${report.lifecycleStageLine}`.slice(0, 600);
  const promptDir = `${report.saturationPressureLine} ${report.refreshOpportunitySummary}`.slice(0, 520);
  const neg = `${report.visualBlindnessRiskLine} · ${report.practicalRecommendations.slice(0, 4).join(" · ")}`.slice(0, 1100);
  pushHeroPlanComposerPayload({
    query: report.query,
    marketplace: report.marketplace,
    recommendedHeroDirection: recommended,
    promptDirection: promptDir,
    negativeConstraints: neg,
    corridor: corridor.trim() || "archive_luxury",
    suggestedHeroArch,
    garmentFocusLine: `${corridor}: ${report.dominantFatigueLines[0] ?? report.refreshOpportunitySummary}`.slice(0, 220),
    printFocusLine: report.refreshTimingLine.slice(0, 220),
    source: "fatigue",
  });
}
