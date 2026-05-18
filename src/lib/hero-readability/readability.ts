import type { CompetitorSerpItem } from "../competitor-serp/types";
import { printScoreFromLabel, premiumScoreFromLabel } from "../competitor-serp/analyze";
import type { OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import { scoreContrastStrength } from "./contrast";
import { scoreHierarchyClarity } from "./hierarchy";
import { scoreVisualNoise } from "./noise";
import type { HeroReadabilityEntity, HeroReadabilityLevel } from "./types";
import { newHeroReadabilityIntelligenceId } from "./ids";

export function levelFromScore(score: number): HeroReadabilityLevel {
  if (score >= 82) return "excellent";
  if (score >= 68) return "strong";
  if (score >= 52) return "acceptable";
  if (score >= 36) return "weak";
  return "critical";
}

function mobileThumbnailScore(it: CompetitorSerpItem): number {
  const blob = `${it.title} ${it.heroImageNote} ${it.visualPattern}`.toLowerCase();
  let s = 62;
  if (/fine\s*print|мелк|tiny\s*type|мелкий\s*текст/i.test(blob)) s -= 22;
  if (/one\s*hero|один\s*герой|single\s*subject/i.test(blob)) s += 14;
  if (/busy|шум|collage/i.test(blob)) s -= 12;
  if (it.title.length > 72) s -= 8;
  return Math.max(0, Math.min(100, s));
}

export function compositeRowReadabilityScore(it: CompetitorSerpItem): number {
  const print = printScoreFromLabel(it.printReadability) ?? printScoreFromLabel(it.heroImageNote) ?? 52;
  const hier = scoreHierarchyClarity(`${it.heroImageNote} ${it.visualPattern}`);
  const noise = scoreVisualNoise(`${it.heroImageNote} ${it.visualPattern} ${it.title}`);
  const contrast = scoreContrastStrength(`${it.colorDominance} ${it.heroImageNote} ${it.visualPattern}`);
  const mobile = mobileThumbnailScore(it);
  const raw = 0.36 * print + 0.22 * hier + 0.18 * (100 - noise) + 0.14 * contrast + 0.1 * mobile;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

export function aggregateReadabilityLevels(items: readonly CompetitorSerpItem[]): Map<HeroReadabilityLevel, number> {
  const m = new Map<HeroReadabilityLevel, number>();
  for (const it of items) {
    const lv = levelFromScore(compositeRowReadabilityScore(it));
    m.set(lv, (m.get(lv) ?? 0) + 1);
  }
  return m;
}

export function dominantReadabilityLevel(
  items: readonly CompetitorSerpItem[],
): { level: HeroReadabilityLevel; sharePct: number } | null {
  if (!items.length) return null;
  const counts = aggregateReadabilityLevels(items);
  let best: HeroReadabilityLevel = "acceptable";
  let max = -1;
  for (const [lv, c] of counts) {
    if (c > max) {
      max = c;
      best = lv;
    }
  }
  return { level: best, sharePct: Math.round((100 * max) / items.length) };
}

export function overloadedHeroSharePct(items: readonly CompetitorSerpItem[]): number {
  if (!items.length) return 0;
  let n = 0;
  for (const it of items) {
    const noise = scoreVisualNoise(`${it.heroImageNote} ${it.visualPattern} ${it.title}`);
    if (noise >= 62) n += 1;
  }
  return Math.round((100 * n) / items.length);
}

export function premiumReadabilitySharePct(items: readonly CompetitorSerpItem[]): number {
  if (!items.length) return 0;
  let n = 0;
  for (const it of items) {
    const p = printScoreFromLabel(it.printReadability) ?? printScoreFromLabel(it.heroImageNote) ?? 0;
    const pr = premiumScoreFromLabel(it.perceivedPremiumLevel) ?? premiumScoreFromLabel(it.heroImageNote) ?? 0;
    if (p >= 72 && pr >= 58) n += 1;
  }
  return Math.round((100 * n) / items.length);
}

export function fieldAverageReadabilityScore(items: readonly CompetitorSerpItem[]): number {
  if (!items.length) return 50;
  const sum = items.reduce((a, it) => a + compositeRowReadabilityScore(it), 0);
  return Math.round(sum / items.length);
}

export function buildOurReadabilityEntity(
  our: OurCardCompetitiveSnapshot,
  fieldAvg: number,
  t: (key: string, vars?: Record<string, string>) => string,
): HeroReadabilityEntity {
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
  const score = compositeRowReadabilityScore(pseudo);
  const level = levelFromScore(score);
  const print = printScoreFromLabel(our.printReadability) ?? printScoreFromLabel(our.heroImageNote) ?? 50;
  const hier = scoreHierarchyClarity(`${our.heroImageNote} ${our.visualPattern}`);
  const noise = scoreVisualNoise(`${our.heroImageNote} ${our.visualPattern} ${our.cardTitle}`);
  const contrast = scoreContrastStrength(`${our.colorDominance} ${our.heroImageNote} ${our.visualPattern}`);
  const mobile = mobileThumbnailScore(pseudo);

  const noiseLabel = noise >= 62 ? t("hr.entity.noise.high") : noise >= 42 ? t("hr.entity.noise.mid") : t("hr.entity.noise.low");
  const contrastLabel =
    contrast >= 74 ? t("hr.entity.contrast.strong") : contrast >= 52 ? t("hr.entity.contrast.mid") : t("hr.entity.contrast.soft");
  const hierLabel =
    hier >= 76 ? t("hr.entity.hier.clear") : hier >= 52 ? t("hr.entity.hier.ok") : t("hr.entity.hier.cluttered");
  const printLabel =
    print >= 72 ? t("hr.entity.print.strong") : print >= 48 ? t("hr.entity.print.mid") : t("hr.entity.print.weak");
  const thumbLabel =
    score >= 68 ? t("hr.entity.thumb.strong") : score >= 48 ? t("hr.entity.thumb.ok") : t("hr.entity.thumb.risk");

  const rec: string[] = [];
  if (print < 58) rec.push(t("hr.rec.print_scale"));
  if (noise >= 52) rec.push(t("hr.rec.reduce_noise"));
  if (contrast < 52) rec.push(t("hr.rec.contrast"));
  if (hier < 52) rec.push(t("hr.rec.hierarchy"));
  if (mobile < 52) rec.push(t("hr.rec.mobile_first"));
  if (rec.length === 0) rec.push(t("hr.rec.maintain"));

  return {
    id: newHeroReadabilityIntelligenceId(),
    readabilityLevel: level,
    printVisibility: printLabel,
    thumbnailClarity: thumbLabel,
    focalHierarchy: hierLabel,
    contrastStrength: contrastLabel,
    noiseDensity: noiseLabel,
    mobileVisibility:
      mobile >= 62 ? t("hr.entity.mobile.strong") : mobile >= 48 ? t("hr.entity.mobile.ok") : t("hr.entity.mobile.weak"),
    visualCompetition: t("hr.entity.competition.standard"),
    readabilityPressure: t("hr.entity.pressure.line", { score: String(Math.round(100 - score)) }),
    readabilityAdvantage:
      score >= fieldAvg + 6 ? t("hr.entity.adv.above_notes") : t("hr.entity.adv.neutral"),
    readabilityWeakness:
      score < 52 ? t("hr.entity.weak.below_bar") : score < 68 ? t("hr.entity.weak.watch") : t("hr.entity.weak.none"),
    marketplaceFit:
      score >= 60 ? t("hr.entity.mp.ok") : score >= 44 ? t("hr.entity.mp.tighten") : t("hr.entity.mp.risk"),
    recommendations: rec,
  };
}
