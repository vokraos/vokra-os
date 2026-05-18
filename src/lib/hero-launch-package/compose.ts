import type { CompetitiveGapAnalysis } from "../competitive-gap/types";
import type { HeroBattlePlan } from "../hero-battle-plan/types";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { CardProductionPlan } from "../card-production/types";
import { loadCardProductionBoardFromSession } from "../card-production/sessionStorage";
import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";
import type { HeroTestMatrix } from "../hero-test-matrix/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";
import type { HeroTestResultsBundle } from "../hero-test-results/types";
import type { VisualAssetEntity } from "../visual-assets/types";
import { loadVisualAssetRegistryFromSession } from "../visual-assets/sessionStorage";
import { newHeroLaunchPackageId, resultBundleId } from "./ids";
import type { HeroLaunchPackage, HeroLaunchReadiness } from "./types";

function findAsset(assetId: string | null): VisualAssetEntity | null {
  if (!assetId) return null;
  const reg = loadVisualAssetRegistryFromSession();
  return reg?.assets.find((a) => a.id === assetId) ?? null;
}

function findCardPlanForAsset(assetId: string | null): CardProductionPlan | null {
  if (!assetId) return null;
  const board = loadCardProductionBoardFromSession();
  if (!board?.plans?.length) return null;
  return (
    board.plans.find(
      (p) => p.heroVisualId === assetId || p.sourceVisualAssetIds.includes(assetId),
    ) ?? null
  );
}

function uniq(lines: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of lines) {
    const s = x.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function buildHeroLaunchPackage(
  matrix: HeroTestMatrix,
  bundle: HeroTestResultsBundle,
  ctx: {
    battlePlan: HeroBattlePlan | null;
    gap: CompetitiveGapAnalysis | null;
    archetype: HeroArchetypeIntelligenceReport | null;
    readability: HeroReadabilityIntelligenceReport | null;
    fatigue: HeroFatigueIntelligenceReport | null;
  },
  t: (key: string, vars?: Record<string, string>) => string,
): HeroLaunchPackage | null {
  const winnerId = bundle.winnerVariantId;
  if (!winnerId) return null;

  const variant = matrix.testVariants.find((v) => v.id === winnerId);
  const winner = bundle.results.find((r) => r.sourceVariantId === winnerId);
  if (!variant || !winner) return null;

  const assetId = bundle.registeredAssetId;
  const asset = findAsset(assetId);
  const cardPlan = findCardPlanForAsset(assetId);
  const cardPlanId = cardPlan?.id ?? null;

  const heroDirection = [
    bundle.winnerSummary,
    variant.visualDirection,
    matrix.baselineHeroDirection,
    ctx.battlePlan?.recommendedArchetype ?? "",
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 1400);

  const whyWinner = uniq([
    winner.whySelected,
    winner.selectedVisualNote,
    bundle.winnerSummary,
    winner.decisionConfidence ? t("hlp.why.confidence", { note: winner.decisionConfidence }) : "",
  ])
    .join(" · ")
    .slice(0, 1200);

  const sourcePrompt = [
    variant.hypothesis,
    `Changed: ${variant.changedVariable}`,
    variant.visualDirection,
    ctx.battlePlan?.promptDirection ?? "",
    asset?.sourcePrompt ?? "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000);

  const targetUsage = t(`htr.finalUse.${winner.finalUse}`);

  const cardUpdateChecklist = [
    t("hlp.checklist.hero_image"),
    t("hlp.checklist.print_readability"),
    t("hlp.checklist.mobile_thumb"),
    t("hlp.checklist.title_query"),
    t("hlp.checklist.rich_consistency"),
    t("hlp.checklist.size_grid"),
    t("hlp.checklist.asset_status"),
    t("hlp.checklist.launch_date"),
  ];

  const seoNotes = uniq([
    t("hlp.seo.query", { query: matrix.query }),
    ctx.gap?.readabilityGap ?? "",
    ctx.readability?.readabilityGapLine ?? "",
    ctx.battlePlan?.readabilityDirective ?? "",
    ctx.gap?.visualGap ?? "",
    ...(cardPlan?.primaryKeywords?.slice(0, 4).map((k) => t("hlp.seo.keyword", { kw: k })) ?? []),
    cardPlan?.seoCluster ? t("hlp.seo.cluster", { cluster: cardPlan.seoCluster }) : "",
  ]).slice(0, 12);

  const titleNotes = uniq([
    cardPlan?.wbTitle ? t("hlp.title.wb", { title: cardPlan.wbTitle }) : "",
    cardPlan?.ozonTitle ? t("hlp.title.ozon", { title: cardPlan.ozonTitle }) : "",
    t("hlp.title.align", { query: matrix.query }),
    ctx.gap?.priceGap ? t("hlp.title.price", { note: ctx.gap.priceGap }) : "",
    ctx.gap?.premiumGap ? t("hlp.title.premium", { note: ctx.gap.premiumGap }) : "",
  ]).slice(0, 10);

  const richContentNotes = uniq([
    variant.readabilityGoal,
    variant.premiumGoal,
    ctx.archetype?.recommendedDirectionLine ?? "",
    ctx.readability?.dominantFieldQualityLine ?? "",
    cardPlan?.descriptionDraft ? t("hlp.rich.desc_draft", { snippet: cardPlan.descriptionDraft.slice(0, 120) }) : "",
    t("hlp.rich.usage", { usage: targetUsage }),
  ]).slice(0, 10);

  const marketplaceWarnings = uniq([
    t("hlp.warn.no_api"),
    t("hlp.warn.no_ctr"),
    ...matrix.riskNotes,
    ...matrix.marketplaceConstraints,
    ...(ctx.battlePlan?.riskFlags ?? []),
    ctx.archetype?.overlapRiskLine ?? "",
    ctx.readability?.readabilityRiskLine ?? "",
    ctx.fatigue?.visualBlindnessRiskLine ?? "",
    ...variant.dangerZones,
    winner.issueFound ? t("hlp.warn.issue", { issue: winner.issueFound }) : "",
    winner.finalUse === "discard" ? t("hlp.warn.discard") : "",
  ]).slice(0, 14);

  const postLaunchMonitoring = [
    t("hlp.monitor.impressions"),
    t("hlp.monitor.ctr"),
    t("hlp.monitor.orders"),
    t("hlp.monitor.competitors"),
    t("hlp.monitor.reviews"),
    t("hlp.monitor.ranking"),
    t("hlp.monitor.fatigue"),
  ];

  const missingItems: string[] = [];
  if (!winner.whySelected.trim() && !bundle.winnerSummary.trim()) {
    missingItems.push(t("hlp.missing.why"));
  }
  if (!winner.selectedVisualNote.trim()) {
    missingItems.push(t("hlp.missing.visual_note"));
  }
  if (!assetId) {
    missingItems.push(t("hlp.missing.asset"));
  }
  const needsHeroCard = winner.finalUse === "wb_hero" || winner.finalUse === "ozon_hero";
  if (needsHeroCard && !cardPlanId) {
    missingItems.push(t("hlp.missing.card_plan"));
  }
  if (!ctx.gap) {
    missingItems.push(t("hlp.missing.gap_optional"));
  }

  let readiness: HeroLaunchReadiness = "not_ready";
  if (winnerId && winner.resultStatus === "winner") {
    const hasWhy = Boolean(winner.whySelected.trim() || bundle.winnerSummary.trim());
    const hasAsset = Boolean(assetId);
    const hasCard = !needsHeroCard || Boolean(cardPlanId);
    if (hasWhy && hasAsset && hasCard) readiness = "ready_for_manual_launch";
    else if (hasWhy || hasAsset) readiness = "partial";
  }

  return {
    id: newHeroLaunchPackageId(),
    sourceResultBundleId: resultBundleId(matrix.id, bundle.updatedAt),
    sourceMatrixId: matrix.id,
    winningVariantId: winnerId,
    query: matrix.query,
    marketplace: matrix.marketplace,
    createdAt: Date.now(),
    heroDirection,
    whyWinner,
    sourcePrompt,
    visualAssetId: assetId,
    cardPlanId,
    targetUsage,
    cardUpdateChecklist,
    seoNotes,
    titleNotes,
    richContentNotes,
    marketplaceWarnings,
    postLaunchMonitoring,
    readiness,
    missingItems,
  };
}

export function canBuildLaunchPackage(bundle: HeroTestResultsBundle): boolean {
  return Boolean(bundle.winnerVariantId);
}
