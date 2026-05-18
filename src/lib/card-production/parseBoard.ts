import {
  CARD_PRODUCTION_BOARD_SCHEMA,
  defaultCardContentFields,
  emptyContentReadinessChecks,
  type CardContentReadinessChecks,
  type CardProductionBoardEnvelope,
  type CardProductionPlan,
  type CardProductionStatus,
  type CardMarketplaceTarget,
  type CardReadinessChecks,
  type MarketplaceUploadBrief,
  type RichContentBlock,
  type RichContentBlockRole,
  type UploadImageOrderItem,
  type UploadImageOrderSlot,
} from "./types";

const STATUSES: ReadonlySet<string> = new Set<CardProductionStatus>([
  "draft",
  "assembling",
  "ready_wb",
  "ready_ozon",
  "ready_both",
  "blocked",
  "archived",
]);

const MARKETS: ReadonlySet<string> = new Set<CardMarketplaceTarget>(["wb", "ozon", "both"]);

const RICH_ROLES = new Set<RichContentBlockRole>(["benefits", "fit", "material", "print", "care", "size", "other"]);

function isChecks(o: unknown): o is CardReadinessChecks {
  if (typeof o !== "object" || o === null) return false;
  const x = o as Record<string, unknown>;
  const b = (k: string) => typeof x[k] === "boolean";
  return (
    b("heroVisualReady") &&
    b("supportVisualsReady") &&
    b("detailShotsReady") &&
    b("seoReady") &&
    b("sizeGridReady") &&
    b("marketplaceClarityReady") &&
    b("brandFitReady")
  );
}

function isContentChecks(o: unknown): o is CardContentReadinessChecks {
  if (typeof o !== "object" || o === null) return false;
  const x = o as Record<string, unknown>;
  const b = (k: string) => typeof x[k] === "boolean";
  return (
    b("seoContentReady") &&
    b("descriptionContentReady") &&
    b("richContentStructureReady") &&
    b("materialBlockReady") &&
    b("sizeBlockReady") &&
    b("marketplaceCopyReady")
  );
}

function isRichBlock(x: unknown): x is RichContentBlock {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.headline !== "string" || typeof o.body !== "string") return false;
  if (typeof o.role !== "string" || !RICH_ROLES.has(o.role as RichContentBlockRole)) return false;
  return true;
}

function readStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  if (!v.every((s) => typeof s === "string")) return null;
  return v as string[];
}

function readRichBlocks(v: unknown): RichContentBlock[] | null {
  if (!Array.isArray(v)) return null;
  const out: RichContentBlock[] = [];
  for (const x of v) {
    if (!isRichBlock(x)) return null;
    out.push(x);
  }
  return out;
}

const UPLOAD_SLOTS = new Set<UploadImageOrderSlot>([
  "hero",
  "lifestyle",
  "detail_print",
  "material_fit",
  "size_grid",
  "care_dtf_quality",
  "rich_banner",
  "reels_campaign",
]);

function isImageOrderItem(x: unknown): x is UploadImageOrderItem {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.step !== "number" || typeof o.slot !== "string" || !UPLOAD_SLOTS.has(o.slot as UploadImageOrderSlot)) return false;
  if (o.assetId !== null && typeof o.assetId !== "string") return false;
  return true;
}

function coerceUploadBrief(o: Record<string, unknown>): MarketplaceUploadBrief | null {
  if (typeof o.id !== "string" || !o.id.trim()) return null;
  if (typeof o.cardPlanId !== "string" || !o.cardPlanId.trim()) return null;
  if (typeof o.marketplace !== "string" || !MARKETS.has(o.marketplace)) return null;
  if (typeof o.targetSkuFamily !== "string") return null;
  if (typeof o.wbTitle !== "string" || typeof o.ozonTitle !== "string") return null;
  if (typeof o.shortDescription !== "string" || typeof o.fullDescription !== "string") return null;
  if (!Array.isArray(o.keywords) || !o.keywords.every((s) => typeof s === "string")) return null;
  if (!Array.isArray(o.richContentOrder) || !o.richContentOrder.every((s) => typeof s === "string")) return null;
  if (!Array.isArray(o.imageOrder) || !o.imageOrder.every(isImageOrderItem)) return null;
  if (o.heroImageAssetId !== null && typeof o.heroImageAssetId !== "string") return null;
  if (!Array.isArray(o.supportImageAssetIds) || !o.supportImageAssetIds.every((s) => typeof s === "string")) return null;
  if (!Array.isArray(o.detailImageAssetIds) || !o.detailImageAssetIds.every((s) => typeof s === "string")) return null;
  if (o.sizeGridAssetId !== null && typeof o.sizeGridAssetId !== "string") return null;
  if (typeof o.pricePositioningNote !== "string" || typeof o.categoryNote !== "string") return null;
  if (!Array.isArray(o.attributesChecklist) || !o.attributesChecklist.every((s) => typeof s === "string")) return null;
  if (!Array.isArray(o.complianceWarnings) || !o.complianceWarnings.every((s) => typeof s === "string")) return null;
  if (typeof o.uploadReadiness !== "string") return null;
  if (!Array.isArray(o.missingItems) || !o.missingItems.every((s) => typeof s === "string")) return null;
  if (typeof o.createdAt !== "number" || typeof o.updatedAt !== "number") return null;

  return {
    id: o.id,
    cardPlanId: o.cardPlanId,
    marketplace: o.marketplace as CardMarketplaceTarget,
    targetSkuFamily: o.targetSkuFamily,
    wbTitle: o.wbTitle,
    ozonTitle: o.ozonTitle,
    shortDescription: o.shortDescription,
    fullDescription: o.fullDescription,
    keywords: o.keywords as string[],
    richContentOrder: o.richContentOrder as string[],
    imageOrder: o.imageOrder as UploadImageOrderItem[],
    heroImageAssetId: o.heroImageAssetId as string | null,
    supportImageAssetIds: o.supportImageAssetIds as string[],
    detailImageAssetIds: o.detailImageAssetIds as string[],
    sizeGridAssetId: o.sizeGridAssetId as string | null,
    pricePositioningNote: o.pricePositioningNote,
    categoryNote: o.categoryNote,
    attributesChecklist: o.attributesChecklist as string[],
    complianceWarnings: o.complianceWarnings as string[],
    uploadReadiness: o.uploadReadiness,
    missingItems: o.missingItems as string[],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function coercePlan(o: Record<string, unknown>): CardProductionPlan | null {
  if (typeof o.id !== "string" || !o.id.trim()) return null;
  if (!Array.isArray(o.sourceVisualAssetIds) || !o.sourceVisualAssetIds.every((s) => typeof s === "string")) return null;
  if (typeof o.collectionId !== "string") return null;
  if (typeof o.sourcePromptPackId !== "string") return null;
  if (typeof o.marketplace !== "string" || !MARKETS.has(o.marketplace)) return null;
  if (typeof o.cardTitle !== "string") return null;
  if (typeof o.targetSkuFamily !== "string") return null;
  if (o.heroVisualId !== null && typeof o.heroVisualId !== "string") return null;
  if (!Array.isArray(o.supportVisualIds) || !o.supportVisualIds.every((s) => typeof s === "string")) return null;
  if (!Array.isArray(o.detailVisualIds) || !o.detailVisualIds.every((s) => typeof s === "string")) return null;
  if (!Array.isArray(o.richContentVisualIds) || !o.richContentVisualIds.every((s) => typeof s === "string")) return null;
  if (o.sizeGridVisualId !== null && typeof o.sizeGridVisualId !== "string") return null;
  if (!Array.isArray(o.reelsVisualIds) || !o.reelsVisualIds.every((s) => typeof s === "string")) return null;
  if (typeof o.cardStatus !== "string" || !STATUSES.has(o.cardStatus)) return null;
  if (typeof o.readiness !== "string") return null;
  if (!isChecks(o.readinessChecks)) return null;
  if (!Array.isArray(o.blockers) || !o.blockers.every((s) => typeof s === "string")) return null;
  if (typeof o.seoCluster !== "string") return null;
  if (typeof o.productionNotes !== "string") return null;
  if (typeof o.marketplaceNotes !== "string") return null;
  if (!Array.isArray(o.skuIds) || !o.skuIds.every((s) => typeof s === "string")) return null;
  if (!Array.isArray(o.cardIds) || !o.cardIds.every((s) => typeof s === "string")) return null;
  if (o.wbArticle !== null && typeof o.wbArticle !== "string") return null;
  if (o.ozonOfferId !== null && typeof o.ozonOfferId !== "string") return null;
  if (typeof o.createdAt !== "number" || typeof o.updatedAt !== "number") return null;

  const dc = defaultCardContentFields();
  const wbTitle = typeof o.wbTitle === "string" ? o.wbTitle : dc.wbTitle;
  const ozonTitle = typeof o.ozonTitle === "string" ? o.ozonTitle : dc.ozonTitle;
  const pk = readStringArray(o.primaryKeywords) ?? dc.primaryKeywords;
  const sk = readStringArray(o.secondaryKeywords) ?? dc.secondaryKeywords;
  const descriptionDraft = typeof o.descriptionDraft === "string" ? o.descriptionDraft : dc.descriptionDraft;
  const richContentBlocks = readRichBlocks(o.richContentBlocks) ?? dc.richContentBlocks;
  const careInstructions = typeof o.careInstructions === "string" ? o.careInstructions : dc.careInstructions;
  const materialBlock = typeof o.materialBlock === "string" ? o.materialBlock : dc.materialBlock;
  const sizeBlock = typeof o.sizeBlock === "string" ? o.sizeBlock : dc.sizeBlock;
  const printQualityBlock = typeof o.printQualityBlock === "string" ? o.printQualityBlock : dc.printQualityBlock;
  const seoWarnings = readStringArray(o.seoWarnings) ?? dc.seoWarnings;
  const contentReadiness = typeof o.contentReadiness === "string" ? o.contentReadiness : dc.contentReadiness;
  const contentReadinessChecks = isContentChecks(o.contentReadinessChecks)
    ? o.contentReadinessChecks
    : emptyContentReadinessChecks();

  return {
    id: o.id,
    sourceVisualAssetIds: o.sourceVisualAssetIds as string[],
    collectionId: o.collectionId,
    sourcePromptPackId: o.sourcePromptPackId,
    marketplace: o.marketplace as CardMarketplaceTarget,
    cardTitle: o.cardTitle,
    targetSkuFamily: o.targetSkuFamily,
    heroVisualId: o.heroVisualId as string | null,
    supportVisualIds: o.supportVisualIds as string[],
    detailVisualIds: o.detailVisualIds as string[],
    richContentVisualIds: o.richContentVisualIds as string[],
    sizeGridVisualId: o.sizeGridVisualId as string | null,
    reelsVisualIds: o.reelsVisualIds as string[],
    cardStatus: o.cardStatus as CardProductionStatus,
    readiness: o.readiness,
    readinessChecks: o.readinessChecks as CardReadinessChecks,
    blockers: o.blockers as string[],
    seoCluster: o.seoCluster,
    productionNotes: o.productionNotes,
    marketplaceNotes: o.marketplaceNotes,
    wbTitle,
    ozonTitle,
    primaryKeywords: pk,
    secondaryKeywords: sk,
    descriptionDraft,
    richContentBlocks,
    careInstructions,
    materialBlock,
    sizeBlock,
    printQualityBlock,
    seoWarnings,
    contentReadiness,
    contentReadinessChecks,
    skuIds: o.skuIds as string[],
    cardIds: o.cardIds as string[],
    wbArticle: o.wbArticle as string | null,
    ozonOfferId: o.ozonOfferId as string | null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export function parseCardProductionBoardEnvelope(payload: unknown): CardProductionBoardEnvelope | null {
  if (payload == null) return null;
  let root: unknown = payload;
  if (typeof payload === "string") {
    try {
      root = JSON.parse(payload) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof root !== "object" || root === null) return null;
  const o = root as Record<string, unknown>;
  if (o.schema !== CARD_PRODUCTION_BOARD_SCHEMA) return null;
  if (!Array.isArray(o.plans)) return null;
  const plans: CardProductionPlan[] = [];
  for (const p of o.plans) {
    if (typeof p !== "object" || p === null) return null;
    const plan = coercePlan(p as Record<string, unknown>);
    if (!plan) return null;
    plans.push(plan);
  }

  const uploadBriefs: MarketplaceUploadBrief[] = [];
  if (Array.isArray(o.uploadBriefs)) {
    for (const b of o.uploadBriefs) {
      if (typeof b !== "object" || b === null) return null;
      const br = coerceUploadBrief(b as Record<string, unknown>);
      if (!br) return null;
      uploadBriefs.push(br);
    }
  }

  return {
    schema: CARD_PRODUCTION_BOARD_SCHEMA,
    plans,
    uploadBriefs,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : Date.now(),
  };
}
