import type { OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import type { CompetitorSerpItem } from "../competitor-serp/types";
import type { SerpDerivedAnalysis } from "../competitor-serp/types";
import { classifyOurCard, dominantArchetypes } from "../hero-archetypes/classify";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";
import { compositeRowReadabilityScore, fieldAverageReadabilityScore } from "../hero-readability/readability";
import { semanticRepetitionScore } from "./repetition";
import { archetypeSaturationPressure, buildArchetypeSharesForFatigue, combinedSaturationFatigue } from "./saturation";
import { fatigueLevelFromIndex, lifecycleFromSignals } from "./lifecycle";
import { countHeroRefreshJobsInSession, refreshUrgencyIndex } from "./refresh";
import type { HeroFatigueEntity, HeroFatigueLevel, HeroLifecycleStage } from "./types";
import { newHeroFatigueIntelligenceId } from "./ids";

export function fieldFatigueIndex(items: readonly CompetitorSerpItem[], analysis: SerpDerivedAnalysis): number {
  const shares = buildArchetypeSharesForFatigue(items);
  const ap = archetypeSaturationPressure(shares);
  const satFat = combinedSaturationFatigue(analysis, ap);
  const sem = semanticRepetitionScore(items);
  return Math.round(Math.min(100, satFat * 0.45 + sem * 0.35 + ap * 0.2));
}

function ourAsItem(o: OurCardCompetitiveSnapshot): CompetitorSerpItem {
  return {
    id: o.id,
    position: 0,
    title: o.cardTitle,
    brand: "",
    price: o.price,
    rating: null,
    reviewCount: null,
    heroImageNote: o.heroImageNote,
    visualPattern: o.visualPattern,
    colorDominance: o.colorDominance,
    modelPresence: o.modelPresence,
    printReadability: o.printReadability,
    perceivedPremiumLevel: o.perceivedPremiumLevel,
    differentiationNote: o.differentiationNote,
  };
}

export function ourFatigueIndex(
  our: OurCardCompetitiveSnapshot | null,
  items: readonly CompetitorSerpItem[],
  analysis: SerpDerivedAnalysis,
  archetype: HeroArchetypeIntelligenceReport | null,
  readability: HeroReadabilityIntelligenceReport | null,
): number {
  const field = fieldFatigueIndex(items, analysis);
  if (!our) return Math.round(field * 0.92);
  const pseudo = ourAsItem(our);
  const shares = buildArchetypeSharesForFatigue(items);
  const domTop = dominantArchetypes(shares, 3)[0]?.archetype ?? null;
  const ours = classifyOurCard(our);
  const ourTop = ours[0]?.archetype ?? null;
  let overlap = 0;
  if (domTop && ourTop === domTop) overlap += 22;
  if (archetype?.overlapRiskLine && /high|высок|пересеч/i.test(archetype.overlapRiskLine)) overlap += 18;
  const readScore = compositeRowReadabilityScore(pseudo);
  const fieldRead = fieldAverageReadabilityScore(items);
  const readDrag = readScore >= fieldRead - 6 ? 10 : 0;
  const readPressure = readability?.readabilityPressureIndex ?? 44;
  const semBlend = semanticRepetitionScore([pseudo, ...items.slice(0, 10)]);
  return Math.round(Math.min(100, field * 0.36 + overlap + semBlend * 0.2 + readPressure * 0.14 + readDrag));
}

export function overlapStressFromArchetype(archetype: HeroArchetypeIntelligenceReport | null): number {
  if (!archetype?.dominantSerpArchetypes?.length) return 28;
  const top = archetype.dominantSerpArchetypes[0]?.sharePct ?? 0;
  let stress = Math.round(top * 0.55);
  if (archetype.overlapRiskLine && /high|высок|пересеч/i.test(archetype.overlapRiskLine)) stress += 18;
  return Math.min(100, stress);
}

export function buildOurFatigueEntity(
  our: OurCardCompetitiveSnapshot,
  args: {
    ourIdx: number;
    fieldIdx: number;
    lifecycle: HeroLifecycleStage;
    urgencyIdx: number;
    semanticField: number;
  },
  t: (key: string, vars?: Record<string, string>) => string,
): HeroFatigueEntity {
  const level: HeroFatigueLevel = fatigueLevelFromIndex(args.ourIdx);
  const rec: string[] = [];
  if (args.urgencyIdx >= 68) rec.push(t("hf.rec.full_hero"));
  else if (args.urgencyIdx >= 52) rec.push(t("hf.rec.partial_refresh"));
  if (args.ourIdx >= args.fieldIdx + 8) rec.push(t("hf.rec.archetype_shift"));
  if (args.ourIdx >= 58) rec.push(t("hf.rec.framing"));
  if (rec.length === 0) rec.push(t("hf.rec.maintain"));

  return {
    id: newHeroFatigueIntelligenceId(),
    fatigueLevel: level,
    repetitionPressure: t("hf.entity.rep", { idx: String(Math.min(100, args.ourIdx + 4)) }),
    archetypeExhaustion: t("hf.entity.arch_ex", { lvl: t(`hf.level.${level}`) }),
    semanticFatigue: t("hf.entity.sem", { idx: String(args.semanticField) }),
    visualBlindnessRisk: t("hf.entity.blind", { idx: String(Math.min(100, Math.round(args.ourIdx * 0.82 + 10))) }),
    refreshUrgency: t("hf.entity.urgency", { idx: String(args.urgencyIdx) }),
    heroLifecycleStage: args.lifecycle,
    saturationImpact: t("hf.entity.sat", { idx: String(Math.min(100, args.fieldIdx)) }),
    refreshOpportunity: t("hf.entity.opp", { stage: t(`hf.stage.${args.lifecycle}`) }),
    marketplacePressure: t("hf.entity.mp_sku", { sku: (our.skuCode || "—").slice(0, 32) }),
    recommendations: rec,
  };
}

export function heroNoteEchoFatigue(items: readonly CompetitorSerpItem[]): number {
  const notes = items.map((i) => i.heroImageNote.trim().toLowerCase()).filter(Boolean);
  if (notes.length < 4) return 10;
  const uniq = new Set(notes);
  const ratio = uniq.size / notes.length;
  return Math.round((1 - ratio) * 100);
}

export function computeLifecycleAndUrgency(args: {
  query: string;
  fatigueIdx: number;
  saturationFatigue: number;
  semanticRep: number;
  readabilityPressure: number;
  archetype: HeroArchetypeIntelligenceReport | null;
}): { lifecycle: HeroLifecycleStage; urgency: number } {
  const refreshJobCount = countHeroRefreshJobsInSession(args.query);
  const overlapStress = overlapStressFromArchetype(args.archetype);
  const urgency = refreshUrgencyIndex({
    fatigueIdx: args.fatigueIdx,
    readabilityPressure: args.readabilityPressure,
    overlapStress,
    semanticRep: args.semanticRep,
    refreshJobCount,
  });
  const lifecycle = lifecycleFromSignals({
    fatigueIdx: args.fatigueIdx,
    saturationFatigue: args.saturationFatigue,
    semanticRep: args.semanticRep,
    refreshQueueCount: refreshJobCount,
  });
  return { lifecycle, urgency };
}
