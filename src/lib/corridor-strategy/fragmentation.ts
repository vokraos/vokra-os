import type { EntitySnapshot } from "../entity-snapshot/types";
import type { CorridorSummaryRow } from "../entity-snapshot/intelligence";
import type { CorridorStrategyGlobalContext } from "./types";

function corridorSkus(snapshot: EntitySnapshot | null, corridor: string) {
  if (!snapshot) return [];
  return snapshot.skuEntities.filter((s) => (s.corridor || "—").trim() === corridor.trim());
}

function corridorCards(snapshot: EntitySnapshot | null, corridor: string) {
  if (!snapshot) return [];
  return snapshot.cardEntities.filter((c) => (c.corridor || "—").trim() === corridor.trim());
}

export function computeFragmentationPressure(
  row: CorridorSummaryRow,
  ctx: CorridorStrategyGlobalContext,
): number {
  if (!ctx.snapshot || !ctx.intel) return 0;
  const skus = corridorSkus(ctx.snapshot, row.corridor);
  const cards = corridorCards(ctx.snapshot, row.corridor);
  const families = new Set(skus.map((s) => (s.productFamily || "").trim()).filter(Boolean));
  let score = 0;
  if (row.total <= 3 && ctx.intel.corridorSummary.length >= 5) score += 35;
  if (families.size >= 4 && row.total < 12) score += 20;
  if (skus.length > 0 && cards.length / Math.max(1, skus.length) > 2.5) score += 12;
  const missingSeo = cards.filter((c) => c.missingSeo).length;
  score += Math.min(25, missingSeo * 3);
  const mp = new Set(skus.map((s) => (s.marketplace || "").trim()).filter(Boolean));
  if (mp.size >= 2) score += 14;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeSeoCoverage(row: CorridorSummaryRow, ctx: CorridorStrategyGlobalContext): number {
  if (!ctx.snapshot) return 40;
  const cards = corridorCards(ctx.snapshot, row.corridor);
  if (!cards.length) return 50;
  const missing = cards.filter((c) => c.missingSeo).length;
  return Math.max(0, Math.min(100, Math.round(100 - (missing / cards.length) * 100)));
}
