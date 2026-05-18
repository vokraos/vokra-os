import type { EconomicPressureGatherContext, PressureZone } from "./types";
import { levelFromScore } from "./pressure";

export function computeExpansionPressure(ctx: EconomicPressureGatherContext): number {
  let score = 0;
  const plan = ctx.launchPlan;
  if (plan) {
    if (plan.expansionWave.status === "ready" || plan.expansionWave.status === "in_progress") score += 22;
    if (plan.launchReadiness === "expansion_ready") score += 15;
    else if (plan.launchReadiness === "ready") score += 8;
    if (plan.launchReadiness === "fragile" || plan.launchReadiness === "blocked") score += 20;
    score += Math.min(20, plan.blockers.length * 4);
    score += Math.min(15, plan.launchSequence.filter((s) => s.waveKind === "expansion").length * 5);
  }
  if (ctx.intel) {
    const mixed = ctx.intel.fboExposureSummary.mixedCorridors.length;
    score += Math.min(25, mixed * 8);
    const dense = ctx.intel.corridorSummary.filter((c) => c.total >= 12).length;
    if (dense >= 2) score += 12;
  }
  if (ctx.launchReview?.outcomeState === "partial") score += 10;
  if (ctx.launchReview?.outcomeState === "blocked") score += 18;
  return Math.min(100, Math.round(score));
}

export function buildDangerousExpansionZones(
  ctx: EconomicPressureGatherContext,
  score: number,
  t: (key: string, vars?: Record<string, string>) => string,
): PressureZone[] {
  if (score < 50) return [];
  const out: PressureZone[] = [];

  for (const mix of ctx.intel?.fboExposureSummary.mixedCorridors ?? []) {
    if (mix.hasFbo && mix.hasFbs) {
      out.push({
        id: `exp_mix_${mix.corridor}`,
        label: t("econ.zone.expansionMixed", { corridor: mix.corridor }),
        level: levelFromScore(score),
        score,
        corridor: mix.corridor,
        navId: "launchOperations",
      });
    }
  }

  for (const row of ctx.intel?.corridorSummary.filter((c) => c.total >= 10).slice(0, 3) ?? []) {
    out.push({
      id: `exp_dense_${row.corridor}`,
      label: t("econ.zone.expansionCorridor", { corridor: row.corridor, n: String(row.total) }),
      level: levelFromScore(Math.min(100, score + 5)),
      score,
      corridor: row.corridor,
      navId: "collectionBuilder",
    });
  }

  if (out.length === 0 && score >= 55) {
    out.push({
      id: "exp_launch",
      label: t("econ.zone.expansionLaunch"),
      level: levelFromScore(score),
      score,
      navId: "launchOperations",
    });
  }
  return out.slice(0, 5);
}

export function buildStableZones(
  ctx: EconomicPressureGatherContext,
  t: (key: string, vars?: Record<string, string>) => string,
): PressureZone[] {
  if (!ctx.intel) return [];
  const mixed = new Set(ctx.intel.fboExposureSummary.mixedCorridors.map((m) => m.corridor));
  const out: PressureZone[] = [];
  for (const row of ctx.intel.corridorSummary) {
    if (row.total < 4 || row.total > 14) continue;
    if (mixed.has(row.corridor)) continue;
    out.push({
      id: `stable_${row.corridor}`,
      label: t("econ.zone.stable", { corridor: row.corridor, n: String(row.total) }),
      level: "low",
      score: Math.max(0, 30 - row.total),
      corridor: row.corridor,
      navId: "skuIntelligence",
    });
  }
  return out.slice(0, 4);
}
