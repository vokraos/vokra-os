import type { EconomicPressureGatherContext } from "./types";

export function computeWarehousePressure(ctx: EconomicPressureGatherContext): number {
  if (!ctx.snapshot || !ctx.intel) return 0;
  const whMissing = ctx.intel.missingFieldSummary.skuMissingWarehouse;
  const whCardMissing = ctx.intel.missingFieldSummary.cardMissingWarehouse;
  const warehouses = new Set(
    ctx.snapshot.skuEntities.map((s) => s.warehouse.trim()).filter((w) => w && w !== "—"),
  );
  const skuCount = ctx.snapshot.skuEntities.length;
  const spreadRatio = warehouses.size / Math.max(1, skuCount);

  let score = Math.min(35, whMissing * 3 + whCardMissing * 2);
  if (warehouses.size >= 6) score += 20;
  else if (warehouses.size >= 4) score += 12;
  if (spreadRatio > 0.35 && skuCount > 15) score += 18;
  if (ctx.intel.fboExposureSummary.fboLikeRows > 0 && ctx.intel.fboExposureSummary.fbsLikeRows > 0) {
    score += Math.min(15, ctx.intel.fboExposureSummary.mixedCorridors.length * 4);
  }
  return Math.min(100, Math.round(score));
}
