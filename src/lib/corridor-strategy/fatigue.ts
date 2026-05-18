import type { CorridorSummaryRow } from "../entity-snapshot/intelligence";
import type { CorridorStrategyGlobalContext } from "./types";

export function computeRefreshNeed(
  row: CorridorSummaryRow,
  ctx: CorridorStrategyGlobalContext,
): number {
  if (!ctx.snapshot) return 0;
  const skus = ctx.snapshot.skuEntities.filter((s) => (s.corridor || "—").trim() === row.corridor.trim());
  const refreshN = skus.filter((s) => s.refreshCandidate).length;
  let score = Math.min(45, refreshN * 8);
  if (ctx.intel && ctx.intel.refreshCandidateSummary.weakSkuCount > 0 && refreshN > 0) score += 15;
  if (ctx.scalingReport.scalingMode === "refresh_only") score += 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeHeroPressure(
  row: CorridorSummaryRow,
  ctx: CorridorStrategyGlobalContext,
): number {
  const hf = ctx.intel;
  let score = 0;
  if (row.corridor === ctx.fboReport.corridor && ctx.fboReport.readiness === "fragile") score += 20;
  if (ctx.snapshot) {
    const heroes = ctx.snapshot.cardEntities.filter(
      (c) => (c.corridor || "—").trim() === row.corridor.trim() && c.missingHero === false,
    ).length;
    const cards = ctx.snapshot.cardEntities.filter((c) => (c.corridor || "—").trim() === row.corridor.trim());
    if (cards.length && heroes / cards.length < 0.15) score += 18;
  }
  if (hf && row.total >= ctx.maxCorridorTotal * 0.5) score += 12;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeArchiveRisk(row: CorridorSummaryRow, ctx: CorridorStrategyGlobalContext): number {
  let score = 0;
  if (row.total <= 2 && ctx.intel && ctx.intel.corridorSummary.length > 6) score += 40;
  if (/archive|архив|legacy|old/i.test(row.corridor)) score += 25;
  if (computeRefreshNeed(row, ctx) > 60 && row.total < 6) score += 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeOperationalBurden(
  row: CorridorSummaryRow,
  ctx: CorridorStrategyGlobalContext,
): number {
  const share = row.total / Math.max(1, ctx.maxCorridorTotal);
  let score = Math.min(55, share * 65);
  if (ctx.intel?.fboExposureSummary.mixedCorridors.some((m) => m.corridor === row.corridor)) score += 15;
  if (ctx.scalingReport.safetyLevel === "unsafe" || ctx.scalingReport.safetyLevel === "blocked") score += 12;
  return Math.max(0, Math.min(100, Math.round(score)));
}
