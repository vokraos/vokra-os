import {
  VISUAL_ASSET_REGISTRY_SCHEMA,
  type VisualAssetEntity,
  type VisualAssetFatigueTracking,
  type VisualAssetRegistryEnvelope,
  type VisualAssetRole,
  type VisualAssetStatus,
} from "./types";

const ROLES: ReadonlySet<string> = new Set<VisualAssetRole>([
  "wb_hero",
  "ozon_hero",
  "rich_content",
  "reels",
  "campaign",
  "exhibition",
  "corporate_merch",
  "detail_shot",
  "size_grid",
]);

const STATUSES: ReadonlySet<string> = new Set<VisualAssetStatus>([
  "active",
  "testing",
  "approved",
  "replaced",
  "fatigued",
  "archived",
]);

function isFatigue(o: unknown): o is VisualAssetFatigueTracking {
  if (typeof o !== "object" || o === null) return false;
  const x = o as Record<string, unknown>;
  if (typeof x.visualAgeDays !== "number" || !Number.isFinite(x.visualAgeDays)) return false;
  if (typeof x.usageCount !== "number" || !Number.isFinite(x.usageCount)) return false;
  if (typeof x.exposureNote !== "string") return false;
  if (x.fatigueRiskScore !== null && (typeof x.fatigueRiskScore !== "number" || !Number.isFinite(x.fatigueRiskScore))) return false;
  if (typeof x.refreshRecommendation !== "string") return false;
  return true;
}

function isAsset(x: unknown): x is VisualAssetEntity {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim()) return false;
  if (typeof o.sourceJobId !== "string" || !o.sourceJobId.trim()) return false;
  if (typeof o.promptPackId !== "string") return false;
  if (typeof o.collectionId !== "string") return false;
  if (typeof o.collectionName !== "string") return false;
  if (typeof o.title !== "string" || !o.title.trim()) return false;
  if (typeof o.assetRole !== "string" || !ROLES.has(o.assetRole)) return false;
  if (typeof o.usageTarget !== "string") return false;
  if (typeof o.sourcePrompt !== "string") return false;
  if (typeof o.selectedResultNote !== "string") return false;
  if (typeof o.approvedUsage !== "string") return false;
  for (const k of ["brandFitScore", "marketplaceClarityScore", "printReadabilityScore", "premiumPerceptionScore", "fatigueRiskScore"] as const) {
    const v = o[k];
    if (v !== null && (typeof v !== "number" || !Number.isFinite(v))) return false;
  }
  if (typeof o.status !== "string" || !STATUSES.has(o.status)) return false;
  if (!Array.isArray(o.linkedSkuIds) || !o.linkedSkuIds.every((s) => typeof s === "string")) return false;
  if (!Array.isArray(o.linkedCardIds) || !o.linkedCardIds.every((s) => typeof s === "string")) return false;
  if (o.linkedCampaignId !== null && typeof o.linkedCampaignId !== "string") return false;
  if (!isFatigue(o.fatigue)) return false;
  if (typeof o.createdAt !== "number" || typeof o.updatedAt !== "number") return false;
  return true;
}

export function parseVisualAssetRegistryEnvelope(payload: unknown): VisualAssetRegistryEnvelope | null {
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
  if (o.schema !== VISUAL_ASSET_REGISTRY_SCHEMA) return null;
  if (!Array.isArray(o.assets)) return null;
  const assets: VisualAssetEntity[] = [];
  for (const a of o.assets) {
    if (!isAsset(a)) return null;
    assets.push(a as VisualAssetEntity);
  }
  return {
    schema: VISUAL_ASSET_REGISTRY_SCHEMA,
    assets,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : Date.now(),
  };
}
