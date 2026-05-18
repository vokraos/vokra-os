import type { VisualAssetEntity } from "../visual-assets/types";
import type { CardProductionPlan, MarketplaceUploadBrief, UploadImageOrderItem } from "./types";

export type UploadReadinessChecks = {
  titleReady: boolean;
  descriptionReady: boolean;
  keywordsReady: boolean;
  heroImageReady: boolean;
  richContentReady: boolean;
  sizeGridReady: boolean;
  attributesReady: boolean;
  complianceReady: boolean;
};

function newBriefId(planId: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `ub-${planId}-${crypto.randomUUID().slice(0, 8)}`;
  return `ub-${planId}-${Date.now()}`;
}

function shortDescFrom(full: string, max = 280): string {
  const t = full.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function uniqueKeywords(plan: CardProductionPlan): string[] {
  return [...new Set([...plan.primaryKeywords, ...plan.secondaryKeywords].map((x) => x.trim()).filter(Boolean))];
}

export function buildImageUploadOrderForPlan(plan: CardProductionPlan): UploadImageOrderItem[] {
  return buildImageOrder(plan);
}

function buildImageOrder(plan: CardProductionPlan): UploadImageOrderItem[] {
  const lifestyle = plan.supportVisualIds[0] ?? null;
  const detailPrint = plan.detailVisualIds[0] ?? null;
  const materialFit = plan.supportVisualIds[1] ?? plan.detailVisualIds[1] ?? null;
  const richBanner = plan.richContentVisualIds[0] ?? null;
  const reels = plan.reelsVisualIds[0] ?? null;
  return [
    { step: 1, slot: "hero", assetId: plan.heroVisualId },
    { step: 2, slot: "lifestyle", assetId: lifestyle },
    { step: 3, slot: "detail_print", assetId: detailPrint },
    { step: 4, slot: "material_fit", assetId: materialFit },
    { step: 5, slot: "size_grid", assetId: plan.sizeGridVisualId },
    { step: 6, slot: "care_dtf_quality", assetId: null },
    { step: 7, slot: "rich_banner", assetId: richBanner },
    { step: 8, slot: "reels_campaign", assetId: reels },
  ];
}

function defaultAttributesChecklist(): string[] {
  return [
    "wb_subject_path",
    "ozon_type_and_subject",
    "composition_in_card",
    "size_chart_visual_linked",
    "care_label_matches_text",
    "forbidden_claims_checked",
  ];
}

function collectLinkedAssets(plan: CardProductionPlan, byId: Map<string, VisualAssetEntity>): VisualAssetEntity[] {
  const ids = new Set<string>();
  if (plan.heroVisualId) ids.add(plan.heroVisualId);
  plan.supportVisualIds.forEach((x) => ids.add(x));
  plan.detailVisualIds.forEach((x) => ids.add(x));
  plan.richContentVisualIds.forEach((x) => ids.add(x));
  if (plan.sizeGridVisualId) ids.add(plan.sizeGridVisualId);
  plan.reelsVisualIds.forEach((x) => ids.add(x));
  const out: VisualAssetEntity[] = [];
  for (const id of ids) {
    const a = byId.get(id);
    if (a) out.push(a);
  }
  return out;
}

export function deriveComplianceWarnings(plan: CardProductionPlan, byId: Map<string, VisualAssetEntity>): string[] {
  const w: string[] = [];
  const wb = plan.wbTitle.trim();
  const generic = /^(футболка|t-?shirt|новинка|хит|sale|акция|лучш)/i;
  if (wb.length < 14 || generic.test(wb)) w.push("title_too_generic");
  if (!plan.heroVisualId) w.push("hero_image_missing");

  const hero = plan.heroVisualId ? byId.get(plan.heroVisualId) : undefined;
  if (hero && hero.printReadabilityScore !== null && hero.printReadabilityScore < 3) w.push("print_readability_unclear");
  if (!plan.sizeGridVisualId) w.push("size_grid_missing");
  if (plan.materialBlock.trim().length < 40) w.push("material_block_missing");
  if (!plan.contentReadinessChecks.richContentStructureReady) w.push("rich_content_weak");

  const used = collectLinkedAssets(plan, byId);
  if (used.some((a) => a.marketplaceClarityScore !== null && a.marketplaceClarityScore < 3)) w.push("marketplace_clarity_weak");

  const words = plan.descriptionDraft.trim().split(/\s+/).filter(Boolean).length;
  const brandVague = words < 70 || used.some((a) => a.brandFitScore !== null && a.brandFitScore < 3);
  if (brandVague) w.push("brand_language_too_vague");

  return [...new Set(w)];
}

export function computeUploadReadinessChecks(
  plan: CardProductionPlan,
  byId: Map<string, VisualAssetEntity>,
  complianceWarnings: string[],
): UploadReadinessChecks {
  const kw = uniqueKeywords(plan);
  const full = plan.descriptionDraft.trim();
  const titleReady = plan.wbTitle.trim().length >= 14 && plan.ozonTitle.trim().length >= 24;
  const descriptionReady = full.length >= 200;
  const keywordsReady = kw.length >= 5;
  const heroImageReady = plan.heroVisualId !== null && byId.has(plan.heroVisualId);
  const richContentReady = plan.contentReadinessChecks.richContentStructureReady;
  const sizeGridReady = plan.sizeGridVisualId !== null && byId.has(plan.sizeGridVisualId);
  const attributesReady =
    plan.targetSkuFamily.trim().length > 0 &&
    plan.marketplaceNotes.trim().length >= 16 &&
    plan.materialBlock.trim().length >= 40 &&
    plan.sizeBlock.trim().length >= 16;
  const complianceReady = complianceWarnings.length === 0;
  return {
    titleReady,
    descriptionReady,
    keywordsReady,
    heroImageReady,
    richContentReady,
    sizeGridReady,
    attributesReady,
    complianceReady,
  };
}

export function uploadReadinessPercent(checks: UploadReadinessChecks): number {
  const vals = Object.values(checks) as boolean[];
  const ok = vals.filter(Boolean).length;
  return Math.round((100 * ok) / vals.length);
}

export function deriveUploadMissingItems(checks: UploadReadinessChecks): string[] {
  const m: string[] = [];
  if (!checks.titleReady) m.push("missing_upload_title");
  if (!checks.descriptionReady) m.push("missing_upload_description");
  if (!checks.keywordsReady) m.push("missing_upload_keywords");
  if (!checks.heroImageReady) m.push("missing_upload_hero_image");
  if (!checks.richContentReady) m.push("missing_upload_rich_structure");
  if (!checks.sizeGridReady) m.push("missing_upload_size_grid");
  if (!checks.attributesReady) m.push("missing_upload_attributes_context");
  if (!checks.complianceReady) m.push("blocked_by_compliance_warnings");
  return m;
}

export function uploadReadinessSummaryLine(percent: number, checks: UploadReadinessChecks): string {
  const bits: string[] = [];
  bits.push(`${percent}%`);
  if (checks.titleReady) bits.push("title");
  if (checks.descriptionReady) bits.push("desc");
  if (checks.keywordsReady) bits.push("kw");
  if (checks.heroImageReady) bits.push("hero");
  if (checks.richContentReady) bits.push("rich");
  if (checks.sizeGridReady) bits.push("grid");
  if (checks.attributesReady) bits.push("attr");
  if (checks.complianceReady) bits.push("compliance");
  return bits.join(" · ");
}

export function buildMarketplaceUploadBrief(plan: CardProductionPlan, assets: VisualAssetEntity[]): MarketplaceUploadBrief {
  const byId = new Map(assets.map((a) => [a.id, a] as const));
  const now = Date.now();
  const fullDescription = plan.descriptionDraft.trim();
  const keywords = uniqueKeywords(plan);
  const richContentOrder = plan.richContentBlocks.map((b) => `${b.id}: ${b.headline}`.trim());
  const imageOrder = buildImageOrder(plan);
  const complianceWarnings = deriveComplianceWarnings(plan, byId);
  const checks = computeUploadReadinessChecks(plan, byId, complianceWarnings);
  const percent = uploadReadinessPercent(checks);
  const missingItems = deriveUploadMissingItems(checks);
  const uploadReadiness = uploadReadinessSummaryLine(percent, checks);

  return {
    id: newBriefId(plan.id),
    cardPlanId: plan.id,
    marketplace: plan.marketplace,
    targetSkuFamily: plan.targetSkuFamily,
    wbTitle: plan.wbTitle,
    ozonTitle: plan.ozonTitle,
    shortDescription: shortDescFrom(fullDescription),
    fullDescription: fullDescription || plan.seoCluster.trim(),
    keywords,
    richContentOrder,
    imageOrder,
    heroImageAssetId: plan.heroVisualId,
    supportImageAssetIds: [...plan.supportVisualIds],
    detailImageAssetIds: [...plan.detailVisualIds],
    sizeGridAssetId: plan.sizeGridVisualId,
    pricePositioningNote: plan.marketplaceNotes.trim() || "—",
    categoryNote: `Collection: ${plan.collectionId} · SKU family: ${plan.targetSkuFamily}`.trim(),
    attributesChecklist: defaultAttributesChecklist(),
    complianceWarnings,
    uploadReadiness,
    missingItems,
    createdAt: now,
    updatedAt: now,
  };
}

/** Replace existing brief for same card plan id, else append. */
export function upsertUploadBriefInList(list: MarketplaceUploadBrief[], next: MarketplaceUploadBrief): MarketplaceUploadBrief[] {
  const filtered = list.filter((b) => b.cardPlanId !== next.cardPlanId);
  return [...filtered, next];
}
