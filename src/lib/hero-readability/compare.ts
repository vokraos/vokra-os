import type { OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import type { CompetitorSerpItem } from "../competitor-serp/types";
import { printScoreFromLabel } from "../competitor-serp/analyze";
import { compositeRowReadabilityScore, fieldAverageReadabilityScore, levelFromScore } from "./readability";
import { scoreHierarchyClarity } from "./hierarchy";

export function compareOurReadabilityVsSerp(
  our: OurCardCompetitiveSnapshot | null,
  items: readonly CompetitorSerpItem[],
  t: (key: string, vars?: Record<string, string>) => string,
): {
  ourLines: string[];
  gapLine: string;
  mobileLine: string;
  riskLine: string;
} {
  if (!our) {
    return {
      ourLines: [t("hr.our.empty")],
      gapLine: t("hr.gap.no_our"),
      mobileLine: t("hr.mobile.no_our"),
      riskLine: t("hr.risk.no_our"),
    };
  }
  const fieldAvg = fieldAverageReadabilityScore(items);
  const pseudo: CompetitorSerpItem = {
    id: our.id,
    position: 0,
    title: our.cardTitle,
    brand: "",
    price: our.price,
    rating: null,
    reviewCount: null,
    heroImageNote: our.heroImageNote,
    visualPattern: our.visualPattern,
    colorDominance: our.colorDominance,
    modelPresence: our.modelPresence,
    printReadability: our.printReadability,
    perceivedPremiumLevel: our.perceivedPremiumLevel,
    differentiationNote: our.differentiationNote,
  };

  const ourScore = compositeRowReadabilityScore(pseudo);
  const ourLevel = levelFromScore(ourScore);
  const ourPrint = printScoreFromLabel(our.printReadability) ?? printScoreFromLabel(our.heroImageNote) ?? 50;
  const domPattern = items.length
    ? [...items].sort((a, b) => compositeRowReadabilityScore(b) - compositeRowReadabilityScore(a))[0]!
    : null;
  const domHier = domPattern ? scoreHierarchyClarity(`${domPattern.heroImageNote} ${domPattern.visualPattern}`) : 56;
  const ourHier = scoreHierarchyClarity(`${our.heroImageNote} ${our.visualPattern}`);

  const ourLines = [
    t("hr.our.level", { level: t(`hr.level.${ourLevel}`), score: String(ourScore) }),
    t("hr.our.print", { score: String(ourPrint) }),
    t("hr.our.hier_vs_field", { ours: String(ourHier), field: String(domHier) }),
  ];

  let gapLine: string;
  if (ourScore >= fieldAvg + 8) gapLine = t("hr.gap.ahead", { ours: String(ourScore), field: String(fieldAvg) });
  else if (ourScore <= fieldAvg - 8) gapLine = t("hr.gap.behind", { ours: String(ourScore), field: String(fieldAvg) });
  else gapLine = t("hr.gap.neutral", { ours: String(ourScore), field: String(fieldAvg) });

  const mobileLine =
    ourScore >= 64 && ourHier >= 60
      ? t("hr.mobile.advantage_possible")
      : ourHier < 48
        ? t("hr.mobile.hierarchy_risk")
        : t("hr.mobile.standard");

  let riskLine: string;
  if (ourScore < 44) riskLine = t("hr.risk.critical_lane");
  else if (ourPrint < 44) riskLine = t("hr.risk.print_lane");
  else if (ourHier < 44) riskLine = t("hr.risk.hierarchy_lane");
  else if (ourScore < fieldAvg - 5) riskLine = t("hr.risk.vs_field");
  else riskLine = t("hr.risk.controlled");

  return { ourLines, gapLine, mobileLine, riskLine };
}
