import type { OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import type { CompetitorSerpItem } from "../competitor-serp/types";
import type { SerpDerivedAnalysis } from "../competitor-serp/types";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";
import { fieldFatigueIndex, ourFatigueIndex } from "./fatigue";

export function compareOurVsFieldFatigue(
  our: OurCardCompetitiveSnapshot | null,
  items: readonly CompetitorSerpItem[],
  analysis: SerpDerivedAnalysis,
  archetype: HeroArchetypeIntelligenceReport | null,
  readability: HeroReadabilityIntelligenceReport | null,
  t: (key: string, vars?: Record<string, string>) => string,
): { fieldLine: string; ourLine: string | null; gapLine: string; timingLine: string; blindnessLine: string } {
  const fieldIdx = fieldFatigueIndex(items, analysis);
  const ourIdx = our ? ourFatigueIndex(our, items, analysis, archetype, readability) : null;
  const fieldLine = t("hf.cmp.field", { idx: String(fieldIdx) });
  const ourLine = ourIdx != null ? t("hf.cmp.our", { idx: String(ourIdx) }) : null;
  let gapLine: string;
  if (ourIdx == null) gapLine = t("hf.cmp.no_our");
  else if (ourIdx >= fieldIdx + 10) gapLine = t("hf.cmp.ahead_fatigue", { our: String(ourIdx), field: String(fieldIdx) });
  else if (ourIdx <= fieldIdx - 10) gapLine = t("hf.cmp.behind_fatigue", { our: String(ourIdx), field: String(fieldIdx) });
  else gapLine = t("hf.cmp.neutral", { our: String(ourIdx), field: String(fieldIdx) });

  let timingLine: string;
  if (fieldIdx >= 72) timingLine = t("hf.cmp.timing_now");
  else if (fieldIdx >= 54) timingLine = t("hf.cmp.timing_soon");
  else timingLine = t("hf.cmp.timing_watch");

  const blind = ourIdx != null ? Math.min(100, Math.round(ourIdx * 0.75 + (fieldIdx > 60 ? 14 : 0))) : fieldIdx;
  const blindnessLine =
    blind >= 68 ? t("hf.cmp.blind_high", { idx: String(blind) }) : blind >= 48 ? t("hf.cmp.blind_mid", { idx: String(blind) }) : t("hf.cmp.blind_low", { idx: String(blind) });

  return { fieldLine, ourLine, gapLine, timingLine, blindnessLine };
}
