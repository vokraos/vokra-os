import type { VisualAssetEntity } from "../visual-assets/types";
import { defaultCardContentFields, type CardProductionPlan, type CardReadinessChecks } from "./types";
import {
  computeContentReadinessChecks,
  computeReadinessChecks,
  contentReadinessSummaryLine,
  deriveBlockers,
  deriveCardStatus,
  readinessSummaryLine,
} from "./readiness";

function newPlanId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `cp-${crypto.randomUUID()}`;
  return `cp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyChecks(): CardReadinessChecks {
  return {
    heroVisualReady: false,
    supportVisualsReady: false,
    detailShotsReady: false,
    seoReady: false,
    sizeGridReady: false,
    marketplaceClarityReady: false,
    brandFitReady: false,
  };
}

/**
 * Seeds a card plan from one visual asset; operator extends slots in Card Production.
 */
export function createCardProductionPlanFromVisualAsset(asset: VisualAssetEntity): CardProductionPlan {
  const now = Date.now();
  const id = newPlanId();
  const sourceVisualAssetIds = [asset.id];

  let marketplace: CardProductionPlan["marketplace"] = "both";
  let heroVisualId: string | null = null;
  const supportVisualIds: string[] = [];
  const detailVisualIds: string[] = [];
  const richContentVisualIds: string[] = [];
  let sizeGridVisualId: string | null = null;
  const reelsVisualIds: string[] = [];

  switch (asset.assetRole) {
    case "wb_hero":
      marketplace = "wb";
      heroVisualId = asset.id;
      break;
    case "ozon_hero":
      marketplace = "ozon";
      heroVisualId = asset.id;
      break;
    case "rich_content":
      richContentVisualIds.push(asset.id);
      marketplace = "both";
      break;
    case "detail_shot":
      detailVisualIds.push(asset.id);
      marketplace = "both";
      break;
    case "size_grid":
      sizeGridVisualId = asset.id;
      marketplace = "both";
      break;
    case "reels":
    case "campaign":
      reelsVisualIds.push(asset.id);
      marketplace = "both";
      break;
    case "exhibition":
    case "corporate_merch":
      supportVisualIds.push(asset.id);
      marketplace = "both";
      break;
    default:
      supportVisualIds.push(asset.id);
      marketplace = "both";
  }

  const byId = new Map<string, VisualAssetEntity>([[asset.id, asset]]);
  const draft: CardProductionPlan = {
    id,
    sourceVisualAssetIds,
    collectionId: asset.collectionId,
    sourcePromptPackId: asset.promptPackId,
    marketplace,
    cardTitle: `${asset.collectionName} · ${asset.title}`,
    targetSkuFamily: asset.collectionName,
    heroVisualId,
    supportVisualIds,
    detailVisualIds,
    richContentVisualIds,
    sizeGridVisualId,
    reelsVisualIds,
    cardStatus: "draft",
    readiness: "",
    readinessChecks: emptyChecks(),
    blockers: [],
    seoCluster: "",
    productionNotes: `Seeded from visual asset ${asset.id} (${asset.assetRole}).`,
    marketplaceNotes: "API paste targets only — no upload in VOKRA OS.",
    ...defaultCardContentFields(),
    skuIds: [],
    cardIds: [],
    wbArticle: null,
    ozonOfferId: null,
    createdAt: now,
    updatedAt: now,
  };

  const checks = computeReadinessChecks(draft, byId);
  const blockers = deriveBlockers(draft, checks);
  const readiness = readinessSummaryLine(checks);
  const cardStatus = deriveCardStatus(draft, checks, blockers);
  const contentReadinessChecks = computeContentReadinessChecks(draft);
  const contentReadiness = contentReadinessSummaryLine(contentReadinessChecks);

  return {
    ...draft,
    readinessChecks: checks,
    readiness,
    blockers,
    cardStatus,
    contentReadinessChecks,
    contentReadiness,
    updatedAt: Date.now(),
  };
}

export function refreshPlanDerivedFields(plan: CardProductionPlan, assets: VisualAssetEntity[]): CardProductionPlan {
  const byId = new Map(assets.map((a) => [a.id, a] as const));
  const checks = computeReadinessChecks(plan, byId);
  const blockers = deriveBlockers(plan, checks);
  const cardStatus = deriveCardStatus(plan, checks, blockers);
  const contentReadinessChecks = computeContentReadinessChecks(plan);
  const contentReadiness = contentReadinessSummaryLine(contentReadinessChecks);
  return {
    ...plan,
    readinessChecks: checks,
    readiness: readinessSummaryLine(checks),
    blockers,
    cardStatus,
    contentReadinessChecks,
    contentReadiness,
    updatedAt: Date.now(),
  };
}
