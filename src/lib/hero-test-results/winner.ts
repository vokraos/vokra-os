import { createEmptyResultForVariant, emptyBundle } from "./defaults";
import type { HeroTestMatrix, HeroTestVariant } from "../hero-test-matrix/types";
import type { HeroTestResult, HeroTestResultsBundle } from "./types";

function variantById(matrix: HeroTestMatrix, id: string): HeroTestVariant | undefined {
  return matrix.testVariants.find((v) => v.id === id);
}

function resultByVariantId(bundle: HeroTestResultsBundle, variantId: string): HeroTestResult | undefined {
  return bundle.results.find((r) => r.sourceVariantId === variantId);
}

export function buildWinnerSummary(
  matrix: HeroTestMatrix,
  winner: HeroTestResult,
  variant: HeroTestVariant,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const parts = [
    t("htr.winner.summary.lead", { name: variant.variantName, query: matrix.query }),
    variant.hypothesis,
    winner.selectedVisualNote.trim() || variant.visualDirection,
    winner.whySelected.trim() ? t("htr.winner.summary.why", { why: winner.whySelected }) : "",
    t("htr.winner.summary.direction", { baseline: matrix.baselineHeroDirection.slice(0, 200) }),
  ].filter(Boolean);
  return parts.join(" · ").slice(0, 1200);
}

export function buildRecommendedNextActions(
  winner: HeroTestResult,
  _variant: HeroTestVariant,
  hasRegisteredAsset: boolean,
  t: (key: string) => string,
): string[] {
  const actions: string[] = [];
  if (!hasRegisteredAsset) actions.push(t("htr.next.register_asset"));
  if (winner.finalUse === "wb_hero" || winner.finalUse === "ozon_hero") {
    actions.push(t("htr.next.card_plan"));
  }
  actions.push(t("htr.next.update_prompt"));
  actions.push(t("htr.next.save_memory"));
  return actions;
}

/** When one variant wins, archive others that are not rejected/needs_revision. */
export function applyWinnerToBundle(
  bundle: HeroTestResultsBundle,
  matrix: HeroTestMatrix,
  winnerVariantId: string,
  t: (key: string, vars?: Record<string, string>) => string,
): HeroTestResultsBundle {
  const variant = variantById(matrix, winnerVariantId);
  const winnerResult = resultByVariantId(bundle, winnerVariantId);
  if (!variant || !winnerResult) return bundle;

  const now = Date.now();
  const results = bundle.results.map((r) => {
    if (r.sourceVariantId === winnerVariantId) {
      return { ...r, resultStatus: "winner" as const, updatedAt: now };
    }
    if (r.resultStatus === "rejected" || r.resultStatus === "needs_revision") {
      return { ...r, updatedAt: now };
    }
    return { ...r, resultStatus: "archived" as const, updatedAt: now };
  });

  const winner = results.find((r) => r.sourceVariantId === winnerVariantId)!;
  const winnerSummary = buildWinnerSummary(matrix, winner, variant, t);
  const recommendedNextActions = buildRecommendedNextActions(
    winner,
    variant,
    Boolean(bundle.registeredAssetId),
    t,
  );

  return {
    ...bundle,
    results,
    winnerVariantId,
    winnerSummary,
    recommendedNextActions,
    updatedAt: now,
  };
}

export function mergeResultsWithMatrix(
  matrix: HeroTestMatrix,
  existing: HeroTestResultsBundle | null,
): HeroTestResultsBundle {
  if (!existing || existing.sourceMatrixId !== matrix.id) {
    return emptyBundle(matrix);
  }
  const byVariant = new Map(existing.results.map((r) => [r.sourceVariantId, r]));
  const results = matrix.testVariants.map((v) => {
    const prev = byVariant.get(v.id);
    if (prev) {
      return { ...prev, query: matrix.query, marketplace: matrix.marketplace, sourceMatrixId: matrix.id };
    }
    return createEmptyResultForVariant(matrix, v);
  });

  let winnerVariantId = existing.winnerVariantId;
  if (winnerVariantId && !matrix.testVariants.some((v) => v.id === winnerVariantId)) {
    winnerVariantId = null;
  }

  return {
    ...existing,
    sourceMatrixId: matrix.id,
    query: matrix.query,
    marketplace: matrix.marketplace,
    results,
    winnerVariantId,
    updatedAt: Date.now(),
  };
}
