import { pushHeroPlanComposerPayload } from "../hero-improvement-plan";
import type { HeroPromptArchetype } from "../prompt-composer/types";
import type { HeroReadabilityIntelligenceReport } from "./types";

export function pushReadabilityIntelligenceToComposer(
  report: HeroReadabilityIntelligenceReport,
  corridor: string,
  suggestedHeroArch: HeroPromptArchetype,
): void {
  const recommended = `${report.readabilityGapLine} · ${report.mobileClarityLine}`.slice(0, 600);
  const promptDir = `${report.dominantFieldQualityLine} ${report.readabilityPressureSummary}`.slice(0, 520);
  const neg = `${report.readabilityRiskLine} · ${report.practicalRecommendations.slice(0, 4).join(" · ")}`.slice(0, 1100);
  const printLine = report.ourReadabilityEntity
    ? `${report.ourReadabilityEntity.printVisibility} · ${report.ourReadabilityEntity.focalHierarchy}`.slice(0, 220)
    : report.ourReadabilityLines.join(" · ").slice(0, 220);
  pushHeroPlanComposerPayload({
    query: report.query,
    marketplace: report.marketplace,
    recommendedHeroDirection: recommended,
    promptDirection: promptDir,
    negativeConstraints: neg,
    corridor: corridor.trim() || "archive_luxury",
    suggestedHeroArch,
    garmentFocusLine: `${corridor}: ${report.dominantFieldQualityLine}`.slice(0, 220),
    printFocusLine: printLine,
    source: "readability",
  });
}
