import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import type { HeroPromptArchetype } from "../prompt-composer/types";
import { newHeroImprovementPlanId } from "./ids";
import type { CompetitiveHeroImprovementPlan } from "./types";

export function deriveCompetitiveHeroImprovementPlan(
  envelope: CompetitorSerpEnvelope,
  corridor: string,
  t: (key: string, vars?: Record<string, string>) => string,
): CompetitiveHeroImprovementPlan {
  const { snapshot, analysis: a } = envelope;
  const topP = a.dominantVisualPatterns[0]?.label ?? "—";
  const topC = a.dominantColors[0]?.label ?? "—";
  const lowPrint = a.printReadabilityBuckets.find((b) => b.bucket === "low")?.sharePct ?? 0;
  const modelPct = Number.parseInt(a.modelUsageVars.pct ?? "0", 10) || 0;
  const notesBlob = snapshot.items.map((i) => i.heroImageNote).join(" ");

  const competitorSummary = t("heroPlan.summary", {
    query: snapshot.query,
    n: String(a.itemCount),
    topPattern: topP,
    topColor: topC,
    modelPct: String(modelPct),
    prem: String(a.premiumPerceptionIndex),
    sat: String(a.saturationSignal),
  });

  const visualWeaknesses: string[] = [];
  if (lowPrint >= 35) visualWeaknesses.push(t("heroPlan.weak.print", { pct: String(lowPrint) }));
  if (a.premiumPerceptionIndex < 42) visualWeaknesses.push(t("heroPlan.weak.premium", { idx: String(a.premiumPerceptionIndex) }));
  if (modelPct >= 48 && /front|фронт|straight|head-on/i.test(notesBlob)) visualWeaknesses.push(t("heroPlan.weak.frontal"));
  const pat0 = a.dominantVisualPatterns[0]?.sharePct ?? 0;
  if (pat0 >= 40) visualWeaknesses.push(t("heroPlan.weak.homogeneous", { pct: String(pat0) }));
  if (visualWeaknesses.length === 0) visualWeaknesses.push(t("heroPlan.weak.generic"));

  let suggested: HeroPromptArchetype = "clean_marketplace_hero";
  let recommended = t("heroPlan.dir.clean_shelf");

  if (a.differentiationGapKeys.includes("serp.gap.weak_visual_pocket") && a.premiumPerceptionIndex >= 44) {
    suggested = "cinematic_movement_hero";
    recommended = t("heroPlan.dir.contrast_gap");
  } else if (a.differentiationGapKeys.includes("serp.gap.hero_frontal_cluster") || (modelPct >= 50 && lowPrint < 38)) {
    suggested = "cinematic_movement_hero";
    recommended = t("heroPlan.dir.cinematic_diagonal");
  } else if (lowPrint >= 35) {
    suggested = "clean_marketplace_hero";
    recommended = t("heroPlan.dir.readable_print_forward");
  } else if (a.differentiationGapKeys.includes("serp.gap.premium_ceiling_low") || a.premiumPerceptionIndex < 40) {
    suggested = "static_luxury_hero";
    recommended = t("heroPlan.dir.premium_lighting");
  }

  const differentiationOpportunity = a.differentiationGapKeys.some((k) => k !== "serp.gap.none_explicit")
    ? t("heroPlan.diff.from_gaps")
    : t("heroPlan.diff.default");

  const marketplaceConstraints: string[] = [];
  if (snapshot.marketplace === "ozon" || snapshot.marketplace.includes("ozon")) marketplaceConstraints.push(t("heroPlan.market.ozon"));
  else marketplaceConstraints.push(t("heroPlan.market.wb"));
  if (a.priceBand.low != null && a.priceBand.high != null) {
    marketplaceConstraints.push(
      t("heroPlan.market.price_band", {
        low: String(Math.round(a.priceBand.low)),
        high: String(Math.round(a.priceBand.high)),
      }),
    );
  }
  if (a.averagePrice != null && a.priceBand.low != null && a.priceBand.high != null) {
    const mid = (a.priceBand.low + a.priceBand.high) / 2;
    if (a.averagePrice > mid * 1.12) {
      marketplaceConstraints.push(t("heroPlan.market.premium_proof_when_price_high", { price: String(Math.round(a.averagePrice)) }));
    }
  }

  const promptDirection = t("heroPlan.prompt.block", {
    direction: recommended,
    corridor: corridor.trim() || "—",
    query: snapshot.query,
  });

  const negParts: string[] = [t("heroPlan.neg.busy_thumbnail")];
  if (lowPrint < 28) negParts.unshift(t("heroPlan.neg.muddy_print"));
  if (suggested === "cinematic_movement_hero") negParts.push(t("heroPlan.neg.fake_hdr"));
  const negativeConstraints = negParts.join(" · ");

  const riskFlags: string[] = [];
  if (a.saturationSignal > 72) riskFlags.push(t("heroPlan.risk.field_dense"));
  if (a.strongVisualCompetitorSharePct > 55) riskFlags.push(t("heroPlan.risk.strong_visual_bar"));
  if (riskFlags.length === 0) riskFlags.push(t("heroPlan.risk.standard"));

  const expectedEffect = t("heroPlan.effect.structural");

  const nextActions = [t("heroPlan.next.prompt"), t("heroPlan.next.visual_queue"), t("heroPlan.next.compare_thumb")];

  return {
    id: newHeroImprovementPlanId(),
    sourceSerpSnapshotId: snapshot.id,
    query: snapshot.query,
    marketplace: snapshot.marketplace,
    corridor: corridor.trim() || "unassigned",
    createdAt: Date.now(),
    competitorSummary,
    visualWeaknesses,
    differentiationOpportunity,
    recommendedHeroDirection: recommended,
    marketplaceConstraints,
    promptDirection,
    negativeConstraints,
    riskFlags,
    expectedEffect,
    nextActions,
    suggestedHeroArch: suggested,
  };
}
