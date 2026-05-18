/**
 * Phase 18 — Visual asset registry (no media storage, no image APIs).
 */

export const VISUAL_ASSET_REGISTRY_SCHEMA = "vokra.visualAssetRegistry.v1" as const;

export type VisualAssetRole =
  | "wb_hero"
  | "ozon_hero"
  | "rich_content"
  | "reels"
  | "campaign"
  | "exhibition"
  | "corporate_merch"
  | "detail_shot"
  | "size_grid";

export type VisualAssetStatus = "active" | "testing" | "approved" | "replaced" | "fatigued" | "archived";

/** Placeholder metrics — future CTR / views / ad exposure hook in here. */
export type VisualAssetFatigueTracking = {
  visualAgeDays: number;
  usageCount: number;
  exposureNote: string;
  fatigueRiskScore: number | null;
  refreshRecommendation: string;
};

export type VisualAssetEntity = {
  id: string;
  sourceJobId: string;
  promptPackId: string;
  collectionId: string;
  collectionName: string;
  title: string;
  assetRole: VisualAssetRole;
  /** Operator-facing lane / channel summary. */
  usageTarget: string;
  sourcePrompt: string;
  selectedResultNote: string;
  /** Comma-separated usage tags from approval (e.g. wb_hero, rich_content). */
  approvedUsage: string;
  brandFitScore: number | null;
  marketplaceClarityScore: number | null;
  printReadabilityScore: number | null;
  premiumPerceptionScore: number | null;
  fatigueRiskScore: number | null;
  status: VisualAssetStatus;
  linkedSkuIds: string[];
  linkedCardIds: string[];
  linkedCampaignId: string | null;
  fatigue: VisualAssetFatigueTracking;
  createdAt: number;
  updatedAt: number;
};

export type VisualAssetRegistryEnvelope = {
  schema: typeof VISUAL_ASSET_REGISTRY_SCHEMA;
  assets: VisualAssetEntity[];
  updatedAt: number;
};

export const VISUAL_ASSET_REGISTRY_SESSION_KEY = "vokra.visualAssetRegistry.v1";
