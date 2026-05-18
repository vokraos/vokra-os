import type { EconomicPressureGatherContext, PressureZone } from "./types";
import { levelFromScore } from "./pressure";

export function computeFragmentationPressure(ctx: EconomicPressureGatherContext): number {
  if (!ctx.snapshot || !ctx.intel) return 0;
  const corridors = ctx.intel.corridorSummary;
  const skuCount = ctx.snapshot.skuEntities.length;
  if (skuCount < 3) return 0;

  const corridorCount = corridors.length;
  const avgPerCorridor = skuCount / Math.max(1, corridorCount);
  const thinCorridors = corridors.filter((c) => c.total > 0 && c.total <= 3).length;
  const categorySpread = ctx.snapshot.productFamilies.length;

  let score = Math.min(35, corridorCount * 4);
  if (avgPerCorridor < 4 && corridorCount >= 4) score += 18;
  score += Math.min(20, thinCorridors * 5);
  score += Math.min(15, Math.max(0, categorySpread - 6) * 2);
  score += Math.min(25, ctx.activeActionCount * 0.8);

  const supportDensity =
    ctx.launchPlan?.supportWave?.skuNote?.match(/\d+/)?.[0] ?? null;
  if (supportDensity && Number(supportDensity) > 8) score += 10;

  return Math.min(100, Math.round(score));
}

export function buildFragmentationZones(
  ctx: EconomicPressureGatherContext,
  score: number,
  t: (key: string, vars?: Record<string, string>) => string,
): PressureZone[] {
  if (!ctx.intel || score < 45) return [];
  const out: PressureZone[] = [];
  for (const row of ctx.intel.corridorSummary.slice(0, 6)) {
    if (row.total <= 2 && row.corridor !== "—") {
      out.push({
        id: `frag_${row.corridor}`,
        label: t("econ.zone.fragmentation", { corridor: row.corridor }),
        level: levelFromScore(score),
        score,
        corridor: row.corridor,
        navId: "assortmentActions",
      });
    }
  }
  if (out.length === 0 && score >= 55) {
    out.push({
      id: "frag_global",
      label: t("econ.zone.fragmentationGlobal"),
      level: levelFromScore(score),
      score,
      navId: "assortmentActions",
    });
  }
  return out.slice(0, 4);
}
