import type { CompetitiveGapAnalysis, OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";
import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";
import { newHeroBattlePlanId } from "./ids";
import type { HeroBattlePlan } from "./types";

function uniqCap(lines: readonly string[], max: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of lines) {
    const s = x.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export function buildHeroBattlePlan(
  envelope: CompetitorSerpEnvelope,
  ctx: {
    ourCard: OurCardCompetitiveSnapshot | null;
    gap: CompetitiveGapAnalysis | null;
    heroPlan: CompetitiveHeroImprovementPlan | null;
    archetype: HeroArchetypeIntelligenceReport | null;
    readability: HeroReadabilityIntelligenceReport | null;
    fatigue: HeroFatigueIntelligenceReport | null;
  },
  t: (key: string, vars?: Record<string, string>) => string,
): HeroBattlePlan {
  const snap = envelope.snapshot;
  const an = envelope.analysis;
  const n = snap.items.length;
  const topPat = an.dominantVisualPatterns[0]?.label ?? "—";
  const weakShare = an.weakVisualCompetitorSharePct;

  const competitorFieldSummary = [
    t("hbp.field.items", { n: String(n) }),
    t("hbp.field.pattern", { p: topPat }),
    t("hbp.field.weak_share", { pct: String(weakShare) }),
    ctx.archetype?.dominantSerpLines[0] ?? "",
    ctx.readability?.dominantFieldQualityLine ?? "",
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 900);

  const gap = ctx.gap;
  const read = ctx.readability;
  const fat = ctx.fatigue;
  const arch = ctx.archetype;
  const hip = ctx.heroPlan;
  const our = ctx.ourCard;

  const readPressure = read?.readabilityPressureIndex ?? 0;
  const readWeak = read != null && (readPressure >= 56 || /weak|critical|риск|слаб/i.test(`${read.readabilityRiskLine} ${read.readabilityGapLine}`));

  const fatigueIdx = fat?.fatiguePressureIndex ?? 0;
  const fatigueHigh = fat != null && (fatigueIdx >= 56 || /high|сроч|urgent/i.test(fat.refreshUrgencyLine));

  const overlapBlob = `${arch?.overlapRiskLine ?? ""} ${arch?.overlapSummary ?? ""}`;
  const overlapHigh = arch != null && (/high|высок|пересеч|совпад/i.test(overlapBlob) || (arch.dominantSerpArchetypes[0]?.sharePct ?? 0) >= 48);

  const premiumGapSignal =
    gap != null && gap.premiumGap.trim().length > 8 && /weak|низ|слишком|gap|proof|доказ/i.test(gap.premiumGap + gap.priceGap);

  const weakField = weakShare >= 34;

  let refreshStrategy: string;
  if (readWeak) refreshStrategy = t("hbp.strategy.readability_first");
  else if (fatigueHigh) refreshStrategy = t("hbp.strategy.fatigue_first");
  else if (overlapHigh) refreshStrategy = t("hbp.strategy.archetype_shift");
  else if (premiumGapSignal) refreshStrategy = t("hbp.strategy.premium_proof");
  else if (weakField) refreshStrategy = t("hbp.strategy.controlled_diff");
  else refreshStrategy = t("hbp.strategy.balanced");

  const readabilityDirective = read
    ? [read.practicalRecommendations[0], read.practicalRecommendations[1]].filter(Boolean).join(" · ").slice(0, 420) || read.readabilityPressureSummary
    : t("hbp.directive.readability_none");

  const fatigueDirective = fat
    ? `${fat.refreshUrgencyLine} · ${fat.refreshOpportunitySummary}`.slice(0, 420)
    : t("hbp.directive.fatigue_none");

  const recommendedArchetype = arch
    ? `${arch.recommendedDirectionLine}`.slice(0, 320)
    : hip?.recommendedHeroDirection?.slice(0, 220) ?? t("hbp.arch.default");

  let ourHeroDiagnosis = "";
  if (!our) ourHeroDiagnosis = t("hbp.diagnosis.no_our");
  else {
    const parts = [
      gap?.readabilityGap,
      gap?.visualGap,
      read?.readabilityGapLine,
      fat?.fieldVsOurFatigueLine,
      hip?.competitorSummary,
    ].filter((x): x is string => Boolean(x?.trim()));
    ourHeroDiagnosis = parts.length ? uniqCap(parts, 5).join(" · ").slice(0, 900) : t("hbp.diagnosis.notes_only");
  }

  const strongestAdvantage =
    (gap?.advantagePoints[0] ?? read?.practicalRecommendations.find((x) => /advantage|преим|сильн|edge/i.test(x))) ||
    arch?.underrepresentedLines[0] ||
    t("hbp.adv.default");

  const biggestWeakness =
    (gap?.weaknessPoints[0] ?? gap?.riskFlags[0]) ||
    arch?.overlapRiskLine ||
    read?.readabilityRiskLine ||
    fat?.visualBlindnessRiskLine ||
    t("hbp.weak.default");

  const promptDirection = [
    hip?.promptDirection,
    arch?.vokraPrimaryDirectionLine,
    read?.dominantFieldQualityLine,
    fat?.saturationPressureLine,
    refreshStrategy,
  ]
    .filter((x): x is string => Boolean(x?.trim()))
    .join(" · ")
    .slice(0, 1200);

  const negativeConstraints = uniqCap(
    [
      hip?.negativeConstraints ?? "",
      arch?.overlapRiskLine ?? "",
      read?.readabilityRiskLine ?? "",
      fat?.visualBlindnessRiskLine ?? "",
      ...(gap?.riskFlags ?? []),
    ],
    10,
  )
    .join(" · ")
    .slice(0, 1400);

  const nextActions = uniqCap(
    [
      ...(gap?.nextActions ?? []),
      ...(hip?.nextActions ?? []),
      ...(read?.practicalRecommendations.slice(0, 3) ?? []),
      ...(fat?.practicalRecommendations.slice(0, 3) ?? []),
      ...(arch?.practicalRecommendations.slice(0, 2) ?? []),
    ],
    14,
  );

  const riskFlags = uniqCap(
    [...(gap?.riskFlags ?? []), ...(hip?.riskFlags ?? []), arch?.overlapRiskLine ?? "", read?.readabilityRiskLine ?? "", fat?.visualBlindnessRiskLine ?? ""],
    14,
  );

  const confidenceNote = t("hbp.confidence.manual", { n: String(n) });

  return {
    id: newHeroBattlePlanId(),
    query: snap.query,
    marketplace: snap.marketplace,
    createdAt: Date.now(),
    sourceSerpSnapshotId: snap.id,
    sourceOurCardSnapshotId: our?.id ?? "",
    competitorFieldSummary,
    ourHeroDiagnosis,
    strongestAdvantage,
    biggestWeakness,
    recommendedArchetype,
    readabilityDirective,
    fatigueDirective,
    refreshStrategy,
    promptDirection,
    negativeConstraints,
    nextActions,
    riskFlags,
    confidenceNote,
  };
}
