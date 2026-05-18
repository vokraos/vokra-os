import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import { premiumScoreFromLabel, printScoreFromLabel } from "../competitor-serp/analyze";
import { newCompetitiveGapAnalysisId } from "./ids";
import type { CompetitiveGapAnalysis, OurCardCompetitiveSnapshot } from "./types";

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[,;/|\s]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 2);
}

function labelRelates(a: string, b: string): boolean {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (!la || !lb) return false;
  if (la.includes(lb) || lb.includes(la)) return true;
  const ta = new Set(tokens(a));
  for (const x of tokens(b)) {
    if (ta.has(x)) return true;
  }
  return false;
}

function parseBrandFit(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const n = Number.parseInt(s.replace(/\D/g, ""), 10);
  if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  return premiumScoreFromLabel(s);
}

export function deriveCompetitiveGapAnalysis(
  envelope: CompetitorSerpEnvelope,
  our: OurCardCompetitiveSnapshot,
  t: (key: string, vars?: Record<string, string>) => string,
): CompetitiveGapAnalysis {
  const a = envelope.analysis;
  const snap = envelope.snapshot;
  const avg = a.averagePrice;
  const mid =
    a.priceBand.low != null && a.priceBand.high != null ? Math.round((a.priceBand.low + a.priceBand.high) / 2) : avg;
  const ourPrice = our.price;
  const ourPrem = premiumScoreFromLabel(our.perceivedPremiumLevel) ?? premiumScoreFromLabel(our.heroImageNote) ?? 48;
  const ourPrint = printScoreFromLabel(our.printReadability) ?? printScoreFromLabel(our.heroImageNote) ?? 50;
  const fieldPrem = a.premiumPerceptionIndex;
  const lowPrintShare = a.printReadabilityBuckets.find((b) => b.bucket === "low")?.sharePct ?? 0;
  const topPat = a.dominantVisualPatterns[0]?.label ?? "";
  const topPatShare = a.dominantVisualPatterns[0]?.sharePct ?? 0;
  const topCol = a.dominantColors[0]?.label ?? "";
  const topColShare = a.dominantColors[0]?.sharePct ?? 0;
  const sat = a.saturationSignal;
  const brandFitN = parseBrandFit(our.brandFit) ?? 50;
  const hasGaps = a.differentiationGapKeys.some((k) => k !== "serp.gap.none_explicit");

  let priceGap: string;
  if (ourPrice == null) {
    priceGap = t("gap.price.ours_unknown");
  } else if (avg == null) {
    priceGap = t("gap.price.field_unknown", { ours: String(Math.round(ourPrice)) });
  } else {
    const diffPct = avg === 0 ? 0 : Math.round(((ourPrice - avg) / avg) * 100);
    priceGap = t("gap.price.vs_avg", { ours: String(Math.round(ourPrice)), avg: String(avg), diff: String(diffPct) });
  }

  const patternCluster = topPatShare >= 38 && labelRelates(our.visualPattern, topPat);
  const colorCluster = topColShare >= 35 && labelRelates(our.colorDominance, topCol);

  let visualGap: string;
  if (!our.visualPattern.trim()) {
    visualGap = t("gap.visual.no_pattern");
  } else if (patternCluster && colorCluster) {
    visualGap = t("gap.visual.pattern_color_cluster", { pattern: topPat || "—", color: topCol || "—" });
  } else if (patternCluster) {
    visualGap = t("gap.visual.pattern_cluster", { pattern: topPat || "—", share: String(topPatShare) });
  } else if (colorCluster) {
    visualGap = t("gap.visual.color_cluster", { color: topCol || "—" });
  } else {
    visualGap = t("gap.visual.different_shape", { ours: our.visualPattern.slice(0, 80) });
  }

  const premDelta = ourPrem - fieldPrem;
  let premiumGap: string;
  if (premDelta >= 8) {
    premiumGap = t("gap.premium.ahead", { ours: String(ourPrem), field: String(fieldPrem) });
  } else if (premDelta <= -10) {
    premiumGap = t("gap.premium.behind", { ours: String(ourPrem), field: String(fieldPrem) });
  } else {
    premiumGap = t("gap.premium.neutral", { ours: String(ourPrem), field: String(fieldPrem) });
  }

  let readabilityGap: string;
  if (lowPrintShare >= 32 && ourPrint >= 62) {
    readabilityGap = t("gap.readability.advantage_vs_field", { lowShare: String(lowPrintShare), ours: String(ourPrint) });
  } else if (ourPrint < 46 && lowPrintShare < 28) {
    readabilityGap = t("gap.readability.weak_vs_strict_field", { ours: String(ourPrint) });
  } else if (ourPrint < 42) {
    readabilityGap = t("gap.readability.hero_refresh", { ours: String(ourPrint) });
  } else {
    readabilityGap = t("gap.readability.mid", { ours: String(ourPrint), lowShare: String(lowPrintShare) });
  }

  let differentiationGap: string;
  if (!our.differentiationNote.trim() && hasGaps) {
    differentiationGap = t("gap.diff.empty_note");
  } else if (patternCluster) {
    differentiationGap = t("gap.diff.pattern_same_as_mass", { pattern: topPat || "—" });
  } else if (our.differentiationNote.trim().length < 12) {
    differentiationGap = t("gap.diff.thin_note");
  } else {
    differentiationGap = t("gap.diff.ok");
  }

  const saturationFit = t("gap.sat.fit", { sat: String(sat), brandFit: String(brandFitN) });

  const advantagePoints: string[] = [];
  const weaknessPoints: string[] = [];
  const riskFlags: string[] = [];
  const recommendedChanges: string[] = [];
  const nextActions: string[] = [];

  if (lowPrintShare >= 30 && ourPrint >= 58) {
    advantagePoints.push(t("gap.adv.print_vs_weak_field"));
  }
  if (premDelta >= 6) {
    advantagePoints.push(t("gap.adv.premium_signal"));
  }
  if (!patternCluster && our.visualPattern.trim().length > 3) {
    advantagePoints.push(t("gap.adv.visual_not_dom_clone"));
  }

  if (ourPrint < 48) {
    weaknessPoints.push(t("gap.weak.print_low"));
    recommendedChanges.push(t("gap.rec.print_refresh"));
  }
  if (premDelta <= -8) {
    weaknessPoints.push(t("gap.weak.premium_vs_field"));
    recommendedChanges.push(t("gap.rec.premium_proof"));
  }
  if (ourPrice != null && mid != null && ourPrice > mid * 1.12 && ourPrem < fieldPrem + 6) {
    weaknessPoints.push(t("gap.weak.price_premium_proof"));
    riskFlags.push(t("gap.risk.price_premium"));
    recommendedChanges.push(t("gap.rec.price_proof"));
  }
  if (patternCluster) {
    weaknessPoints.push(t("gap.weak.visual_cluster"));
    riskFlags.push(t("gap.risk.pattern_overlap"));
    recommendedChanges.push(t("gap.rec.break_pattern"));
  }
  if (colorCluster) {
    riskFlags.push(t("gap.risk.color_overlap"));
    recommendedChanges.push(t("gap.rec.color_shift"));
  }
  if (sat > 72 && brandFitN < 48) {
    riskFlags.push(t("gap.risk.dense_field_brand"));
  }
  if (advantagePoints.length === 0) {
    advantagePoints.push(t("gap.adv.generic_discipline"));
  }
  if (weaknessPoints.length === 0) {
    weaknessPoints.push(t("gap.weak.no_sharp_fail"));
  }
  if (riskFlags.length === 0) {
    riskFlags.push(t("gap.risk.standard"));
  }
  if (recommendedChanges.length === 0) {
    recommendedChanges.push(t("gap.rec.tighten_thumb"));
  }

  nextActions.push(t("gap.next.hero_plan"));
  nextActions.push(t("gap.next.prompt"));
  nextActions.push(t("gap.next.visual"));
  nextActions.push(t("gap.next.assortment"));

  return {
    id: newCompetitiveGapAnalysisId(),
    sourceSerpSnapshotId: snap.id,
    ourCardSnapshotId: our.id,
    query: snap.query,
    marketplace: snap.marketplace,
    createdAt: Date.now(),
    priceGap,
    visualGap,
    premiumGap,
    readabilityGap,
    differentiationGap,
    saturationFit,
    riskFlags,
    advantagePoints,
    weaknessPoints,
    recommendedChanges,
    nextActions,
  };
}
