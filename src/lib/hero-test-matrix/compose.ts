import type { CompetitiveGapAnalysis } from "../competitive-gap/types";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { HeroBattlePlan } from "../hero-battle-plan/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";
import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";
import { newHeroTestMatrixId, newHeroTestVariantId } from "./ids";
import type { HeroTestMatrix, HeroTestVariant, HeroTestVariable } from "./types";
import { allVariablesExcept, formatChangedVariables } from "./variables";

type VariantDraft = {
  nameKey: string;
  vars: [HeroTestVariable] | [HeroTestVariable, HeroTestVariable];
  hypothesisKey: string;
  visualKey: string;
  readabilityKey: string;
  archetypeKey: string;
  fatigueKey: string;
  premiumKey: string;
  dangerKeys: string[];
  jobKind: HeroTestVariant["visualJobKind"];
  priority: number;
};

function buildVariant(
  draft: VariantDraft,
  baseline: string,
  t: (key: string, vars?: Record<string, string>) => string,
): HeroTestVariant {
  const changed = draft.vars;
  return {
    id: newHeroTestVariantId(),
    variantName: t(draft.nameKey),
    changedVariable: formatChangedVariables(changed, t),
    unchangedVariables: allVariablesExcept(changed, t),
    hypothesis: t(draft.hypothesisKey),
    visualDirection: t(draft.visualKey, { baseline: baseline.slice(0, 120) }),
    readabilityGoal: t(draft.readabilityKey),
    archetypeDirection: t(draft.archetypeKey),
    fatigueGoal: t(draft.fatigueKey),
    premiumGoal: t(draft.premiumKey),
    dangerZones: draft.dangerKeys.map((k) => t(k)),
    visualJobKind: draft.jobKind,
  };
}

export function buildHeroTestMatrix(
  battlePlan: HeroBattlePlan,
  ctx: {
    gap: CompetitiveGapAnalysis | null;
    archetype: HeroArchetypeIntelligenceReport | null;
    readability: HeroReadabilityIntelligenceReport | null;
    fatigue: HeroFatigueIntelligenceReport | null;
  },
  t: (key: string, vars?: Record<string, string>) => string,
): HeroTestMatrix {
  const baselineHeroDirection = [
    battlePlan.recommendedArchetype,
    battlePlan.refreshStrategy,
    battlePlan.promptDirection,
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 900);

  const read = ctx.readability;
  const fat = ctx.fatigue;
  const arch = ctx.archetype;
  const gap = ctx.gap;

  const readPressure = read?.readabilityPressureIndex ?? 0;
  const readWeak =
    read != null &&
    (readPressure >= 56 || /weak|critical|риск|слаб/i.test(`${read.readabilityRiskLine} ${read.readabilityGapLine}`));

  const fatigueIdx = fat?.fatiguePressureIndex ?? 0;
  const fatigueHigh = fat != null && (fatigueIdx >= 56 || /high|сроч|urgent/i.test(fat.refreshUrgencyLine));

  const overlapBlob = `${arch?.overlapRiskLine ?? ""} ${arch?.overlapSummary ?? ""}`;
  const overlapHigh =
    arch != null && (/high|высок|пересеч|совпад/i.test(overlapBlob) || (arch.dominantSerpArchetypes[0]?.sharePct ?? 0) >= 48);

  const premiumGapSignal =
    gap != null &&
    gap.premiumGap.trim().length > 8 &&
    /weak|низ|слишком|gap|proof|доказ/i.test(gap.premiumGap + gap.priceGap);

  const drafts: VariantDraft[] = [];

  if (readWeak) {
    drafts.push({
      nameKey: "htm.variant.readability.name",
      vars: ["typography_emphasis", "contrast_intensity"],
      hypothesisKey: "htm.variant.readability.hypothesis",
      visualKey: "htm.variant.readability.visual",
      readabilityKey: "htm.variant.readability.readability_goal",
      archetypeKey: "htm.variant.readability.archetype",
      fatigueKey: "htm.variant.readability.fatigue",
      premiumKey: "htm.variant.readability.premium",
      dangerKeys: ["htm.variant.readability.danger1", "htm.variant.readability.danger2"],
      jobKind: "readability_test",
      priority: 1,
    });
  }

  if (overlapHigh) {
    drafts.push({
      nameKey: "htm.variant.diff.name",
      vars: ["framing", "emotional_tone"],
      hypothesisKey: "htm.variant.diff.hypothesis",
      visualKey: "htm.variant.diff.visual",
      readabilityKey: "htm.variant.diff.readability_goal",
      archetypeKey: "htm.variant.diff.archetype",
      fatigueKey: "htm.variant.diff.fatigue",
      premiumKey: "htm.variant.diff.premium",
      dangerKeys: ["htm.variant.diff.danger1", "htm.variant.diff.danger2"],
      jobKind: "framing_test",
      priority: 2,
    });
  }

  if (fatigueHigh) {
    drafts.push({
      nameKey: "htm.variant.refresh.name",
      vars: ["framing", "background_complexity"],
      hypothesisKey: "htm.variant.refresh.hypothesis",
      visualKey: "htm.variant.refresh.visual",
      readabilityKey: "htm.variant.refresh.readability_goal",
      archetypeKey: "htm.variant.refresh.archetype",
      fatigueKey: "htm.variant.refresh.fatigue",
      premiumKey: "htm.variant.refresh.premium",
      dangerKeys: ["htm.variant.refresh.danger1", "htm.variant.refresh.danger2"],
      jobKind: "refresh_test",
      priority: 3,
    });
  }

  if (premiumGapSignal) {
    drafts.push({
      nameKey: "htm.variant.premium.name",
      vars: ["premium_proof_visibility", "print_scale"],
      hypothesisKey: "htm.variant.premium.hypothesis",
      visualKey: "htm.variant.premium.visual",
      readabilityKey: "htm.variant.premium.readability_goal",
      archetypeKey: "htm.variant.premium.archetype",
      fatigueKey: "htm.variant.premium.fatigue",
      premiumKey: "htm.variant.premium.premium",
      dangerKeys: ["htm.variant.premium.danger1", "htm.variant.premium.danger2"],
      jobKind: "premium_test",
      priority: 4,
    });
  }

  drafts.push({
    nameKey: "htm.variant.controlled.name",
    vars: ["print_scale"],
    hypothesisKey: "htm.variant.controlled.hypothesis",
    visualKey: "htm.variant.controlled.visual",
    readabilityKey: "htm.variant.controlled.readability_goal",
    archetypeKey: "htm.variant.controlled.archetype",
    fatigueKey: "htm.variant.controlled.fatigue",
    premiumKey: "htm.variant.controlled.premium",
    dangerKeys: ["htm.variant.controlled.danger1"],
    jobKind: "hero_test_variant",
    priority: 5,
  });

  if (!readWeak && !overlapHigh) {
    drafts.push({
      nameKey: "htm.variant.hierarchy.name",
      vars: ["typography_emphasis"],
      hypothesisKey: "htm.variant.hierarchy.hypothesis",
      visualKey: "htm.variant.hierarchy.visual",
      readabilityKey: "htm.variant.hierarchy.readability_goal",
      archetypeKey: "htm.variant.hierarchy.archetype",
      fatigueKey: "htm.variant.hierarchy.fatigue",
      premiumKey: "htm.variant.hierarchy.premium",
      dangerKeys: ["htm.variant.hierarchy.danger1"],
      jobKind: "readability_test",
      priority: 6,
    });
  }

  if (!fatigueHigh) {
    drafts.push({
      nameKey: "htm.variant.cinematic.name",
      vars: ["lighting", "framing"],
      hypothesisKey: "htm.variant.cinematic.hypothesis",
      visualKey: "htm.variant.cinematic.visual",
      readabilityKey: "htm.variant.cinematic.readability_goal",
      archetypeKey: "htm.variant.cinematic.archetype",
      fatigueKey: "htm.variant.cinematic.fatigue",
      premiumKey: "htm.variant.cinematic.premium",
      dangerKeys: ["htm.variant.cinematic.danger1", "htm.variant.cinematic.danger2"],
      jobKind: "framing_test",
      priority: 7,
    });
  }

  drafts.sort((a, b) => a.priority - b.priority);

  const seen = new Set<string>();
  const testVariants: HeroTestVariant[] = [];
  for (const d of drafts) {
    const key = d.vars.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    testVariants.push(buildVariant(d, baselineHeroDirection, t));
    if (testVariants.length >= 4) break;
  }

  const focusParts: string[] = [];
  if (readWeak) focusParts.push(t("htm.focus.readability"));
  if (overlapHigh) focusParts.push(t("htm.focus.differentiation"));
  if (fatigueHigh) focusParts.push(t("htm.focus.refresh"));
  if (premiumGapSignal) focusParts.push(t("htm.focus.premium"));
  if (!focusParts.length) focusParts.push(t("htm.focus.controlled"));

  const testingFocus = focusParts.join(" · ").slice(0, 480);

  const riskNotes = [
    battlePlan.negativeConstraints.slice(0, 200),
    arch?.overlapRiskLine ?? "",
    read?.readabilityRiskLine ?? "",
    fat?.visualBlindnessRiskLine ?? "",
    t("htm.risk.no_ab"),
  ].filter((x) => x.trim());

  const marketplaceConstraints = [
    t("htm.constraint.thumb"),
    t("htm.constraint.vokra"),
    t("htm.constraint.one_change"),
    battlePlan.marketplace === "ozon" || battlePlan.marketplace.toLowerCase().includes("ozon")
      ? t("htm.constraint.ozon")
      : t("htm.constraint.wb"),
  ];

  const rolloutRecommendation = testVariants.map((v, i) =>
    t("htm.rollout.line", { order: String(i + 1), name: v.variantName, variable: v.changedVariable }),
  );

  return {
    id: newHeroTestMatrixId(),
    sourceBattlePlanId: battlePlan.id,
    query: battlePlan.query,
    marketplace: battlePlan.marketplace,
    createdAt: Date.now(),
    baselineHeroDirection,
    testVariants,
    testingFocus,
    riskNotes: [...new Set(riskNotes)].slice(0, 8),
    marketplaceConstraints,
    rolloutRecommendation,
    confidenceNote: t("htm.confidence.manual", { n: String(testVariants.length) }),
  };
}
