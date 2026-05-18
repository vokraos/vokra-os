import type { VisualAssetEntity } from "../visual-assets/types";
import type {
  CardContentReadinessChecks,
  CardProductionPlan,
  CardProductionStatus,
  CardReadinessChecks,
} from "./types";

function scoreOk(n: number | null, min: number): boolean {
  if (n === null) return true;
  return n >= min;
}

function worstClarityBrand(assets: VisualAssetEntity[]): { clarity: boolean; brand: boolean } {
  if (assets.length === 0) return { clarity: true, brand: true };
  let clarityOk = true;
  let brandOk = true;
  for (const a of assets) {
    if (!scoreOk(a.marketplaceClarityScore, 3)) clarityOk = false;
    if (!scoreOk(a.brandFitScore, 3)) brandOk = false;
  }
  return { clarity: clarityOk, brand: brandOk };
}

function collectAssetsForPlan(plan: CardProductionPlan, byId: Map<string, VisualAssetEntity>): VisualAssetEntity[] {
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

export function computeContentReadinessChecks(plan: CardProductionPlan): CardContentReadinessChecks {
  const seoContentReady =
    plan.wbTitle.trim().length > 0 && plan.ozonTitle.trim().length > 0 && plan.primaryKeywords.filter((k) => k.trim()).length >= 2;
  const descriptionContentReady = plan.descriptionDraft.trim().length >= 120;
  const richContentStructureReady =
    plan.richContentBlocks.length >= 2 &&
    plan.richContentBlocks.every((b) => b.headline.trim().length > 0 && b.body.trim().length > 24);
  const materialBlockReady = plan.materialBlock.trim().length >= 40;
  const sizeBlockReady = plan.sizeBlock.trim().length >= 20;
  const marketplaceCopyReady =
    plan.marketplaceNotes.trim().length >= 16 && plan.wbTitle.trim().length > 0 && plan.ozonTitle.trim().length > 0;
  return {
    seoContentReady,
    descriptionContentReady,
    richContentStructureReady,
    materialBlockReady,
    sizeBlockReady,
    marketplaceCopyReady,
  };
}

export function contentReadinessSummaryLine(checks: CardContentReadinessChecks): string {
  const parts: string[] = [];
  if (checks.seoContentReady) parts.push("SEO");
  if (checks.descriptionContentReady) parts.push("desc");
  if (checks.richContentStructureReady) parts.push("rich");
  if (checks.materialBlockReady) parts.push("material");
  if (checks.sizeBlockReady) parts.push("size");
  if (checks.marketplaceCopyReady) parts.push("copy");
  return parts.length > 0 ? `Content OK: ${parts.join(", ")}` : "Content incomplete";
}

export function deriveContentChecklist(_plan: CardProductionPlan, checks: CardContentReadinessChecks): string[] {
  const miss: string[] = [];
  if (!checks.seoContentReady) miss.push("missing_seo_titles_keywords");
  if (!checks.descriptionContentReady) miss.push("missing_or_thin_description");
  if (!checks.richContentStructureReady) miss.push("missing_rich_blocks");
  if (!checks.materialBlockReady) miss.push("missing_material_block");
  if (!checks.sizeBlockReady) miss.push("missing_size_note");
  if (!checks.marketplaceCopyReady) miss.push("missing_marketplace_copy_context");
  return miss;
}

export function computeReadinessChecks(plan: CardProductionPlan, byId: Map<string, VisualAssetEntity>): CardReadinessChecks {
  const heroVisualReady = plan.heroVisualId !== null && byId.has(plan.heroVisualId);
  const supportVisualsReady = plan.supportVisualIds.length > 0 || heroVisualReady;
  const detailShotsReady = plan.detailVisualIds.length > 0;
  const seoReady = plan.seoCluster.trim().length > 0;
  const sizeGridReady = plan.sizeGridVisualId !== null && byId.has(plan.sizeGridVisualId);
  const used = collectAssetsForPlan(plan, byId);
  const { clarity, brand } = worstClarityBrand(used);
  const marketplaceClarityReady = clarity && (heroVisualReady || plan.detailVisualIds.length > 0);
  const brandFitReady = brand;
  return {
    heroVisualReady,
    supportVisualsReady,
    detailShotsReady,
    seoReady,
    sizeGridReady,
    marketplaceClarityReady,
    brandFitReady,
  };
}

export function readinessSummaryLine(checks: CardReadinessChecks): string {
  const parts: string[] = [];
  if (checks.heroVisualReady) parts.push("hero");
  if (checks.supportVisualsReady) parts.push("support");
  if (checks.detailShotsReady) parts.push("detail");
  if (checks.seoReady) parts.push("SEO");
  if (checks.sizeGridReady) parts.push("grid");
  if (checks.marketplaceClarityReady) parts.push("clarity");
  if (checks.brandFitReady) parts.push("brand");
  return parts.length > 0 ? `OK: ${parts.join(", ")}` : "Incomplete";
}

export function deriveBlockers(_plan: CardProductionPlan, checks: CardReadinessChecks): string[] {
  const b: string[] = [];
  if (!checks.heroVisualReady) b.push("missing_hero");
  if (!checks.detailShotsReady) b.push("missing_detail_shots");
  if (!checks.seoReady) b.push("missing_seo_cluster");
  if (!checks.sizeGridReady) b.push("missing_size_grid");
  if (!checks.marketplaceClarityReady) b.push("marketplace_clarity_gap");
  if (!checks.brandFitReady) b.push("brand_fit_gap");
  return b;
}

export function deriveCardStatus(plan: CardProductionPlan, checks: CardReadinessChecks, blockers: string[]): CardProductionStatus {
  if (plan.cardStatus === "archived") return "archived";
  if (blockers.includes("brand_fit_gap") || blockers.includes("marketplace_clarity_gap")) return "blocked";
  const core =
    checks.heroVisualReady &&
    checks.supportVisualsReady &&
    checks.detailShotsReady &&
    checks.seoReady &&
    checks.sizeGridReady &&
    checks.marketplaceClarityReady &&
    checks.brandFitReady;
  if (!core) return "assembling";
  if (plan.marketplace === "both") return "ready_both";
  if (plan.marketplace === "wb") return "ready_wb";
  return "ready_ozon";
}
