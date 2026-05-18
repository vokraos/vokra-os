/**
 * Phase 19 — Marketplace card production planning (no WB/Ozon APIs, no uploads).
 */

export const CARD_PRODUCTION_BOARD_SCHEMA = "vokra.cardProductionBoard.v1" as const;

export type CardMarketplaceTarget = "wb" | "ozon" | "both";

export type CardProductionStatus =
  | "draft"
  | "assembling"
  | "ready_wb"
  | "ready_ozon"
  | "ready_both"
  | "blocked"
  | "archived";

/** Seven readiness gates for card assembly (computed + stored snapshot). */
export type CardReadinessChecks = {
  heroVisualReady: boolean;
  supportVisualsReady: boolean;
  detailShotsReady: boolean;
  seoReady: boolean;
  sizeGridReady: boolean;
  marketplaceClarityReady: boolean;
  brandFitReady: boolean;
};

/** Phase 20 — marketplace copy / SEO / rich structure readiness (text + blocks). */
export type CardContentReadinessChecks = {
  seoContentReady: boolean;
  descriptionContentReady: boolean;
  richContentStructureReady: boolean;
  materialBlockReady: boolean;
  sizeBlockReady: boolean;
  marketplaceCopyReady: boolean;
};

export type RichContentBlockRole = "benefits" | "fit" | "material" | "print" | "care" | "size" | "other";

export type RichContentBlock = {
  id: string;
  role: RichContentBlockRole;
  headline: string;
  body: string;
};

export type CardProductionPlan = {
  id: string;
  sourceVisualAssetIds: string[];
  collectionId: string;
  /** Traceability — first seed asset's pack. */
  sourcePromptPackId: string;
  marketplace: CardMarketplaceTarget;
  cardTitle: string;
  targetSkuFamily: string;
  heroVisualId: string | null;
  supportVisualIds: string[];
  detailVisualIds: string[];
  richContentVisualIds: string[];
  sizeGridVisualId: string | null;
  reelsVisualIds: string[];
  cardStatus: CardProductionStatus;
  /** Human-readable readiness line for lists. */
  readiness: string;
  readinessChecks: CardReadinessChecks;
  blockers: string[];
  seoCluster: string;
  productionNotes: string;
  marketplaceNotes: string;
  /** WB listing title draft (chars ~60). */
  wbTitle: string;
  /** Ozon listing title draft (longer allowance). */
  ozonTitle: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  descriptionDraft: string;
  richContentBlocks: RichContentBlock[];
  careInstructions: string;
  materialBlock: string;
  sizeBlock: string;
  printQualityBlock: string;
  seoWarnings: string[];
  /** Human summary of content readiness gates. */
  contentReadiness: string;
  contentReadinessChecks: CardContentReadinessChecks;
  /** Future entity-core hooks (placeholders). */
  skuIds: string[];
  cardIds: string[];
  wbArticle: string | null;
  ozonOfferId: string | null;
  createdAt: number;
  updatedAt: number;
};

/** Phase 21 — ordered gallery slots for manual WB/Ozon upload (asset ids only). */
export type UploadImageOrderSlot =
  | "hero"
  | "lifestyle"
  | "detail_print"
  | "material_fit"
  | "size_grid"
  | "care_dtf_quality"
  | "rich_banner"
  | "reels_campaign";

export type UploadImageOrderItem = {
  step: number;
  slot: UploadImageOrderSlot;
  assetId: string | null;
};

/** Final pre-upload checklist for a human operator. */
export type MarketplaceUploadBrief = {
  id: string;
  cardPlanId: string;
  marketplace: CardMarketplaceTarget;
  targetSkuFamily: string;
  wbTitle: string;
  ozonTitle: string;
  shortDescription: string;
  fullDescription: string;
  keywords: string[];
  richContentOrder: string[];
  imageOrder: UploadImageOrderItem[];
  heroImageAssetId: string | null;
  supportImageAssetIds: string[];
  detailImageAssetIds: string[];
  sizeGridAssetId: string | null;
  pricePositioningNote: string;
  categoryNote: string;
  attributesChecklist: string[];
  complianceWarnings: string[];
  uploadReadiness: string;
  missingItems: string[];
  createdAt: number;
  updatedAt: number;
};

export type CardProductionBoardEnvelope = {
  schema: typeof CARD_PRODUCTION_BOARD_SCHEMA;
  plans: CardProductionPlan[];
  /** Phase 21 — human-ready marketplace upload briefs (no API). */
  uploadBriefs: MarketplaceUploadBrief[];
  updatedAt: number;
};

export const CARD_PRODUCTION_SESSION_KEY = "vokra.cardProductionBoard.v1";

export function emptyContentReadinessChecks(): CardContentReadinessChecks {
  return {
    seoContentReady: false,
    descriptionContentReady: false,
    richContentStructureReady: false,
    materialBlockReady: false,
    sizeBlockReady: false,
    marketplaceCopyReady: false,
  };
}

export function defaultCardContentFields(): Pick<
  CardProductionPlan,
  | "wbTitle"
  | "ozonTitle"
  | "primaryKeywords"
  | "secondaryKeywords"
  | "descriptionDraft"
  | "richContentBlocks"
  | "careInstructions"
  | "materialBlock"
  | "sizeBlock"
  | "printQualityBlock"
  | "seoWarnings"
  | "contentReadiness"
  | "contentReadinessChecks"
> {
  return {
    wbTitle: "",
    ozonTitle: "",
    primaryKeywords: [],
    secondaryKeywords: [],
    descriptionDraft: "",
    richContentBlocks: [],
    careInstructions: "",
    materialBlock: "",
    sizeBlock: "",
    printQualityBlock: "",
    seoWarnings: [],
    contentReadiness: "",
    contentReadinessChecks: emptyContentReadinessChecks(),
  };
}
