import type { CadenceLevel } from "./types";
import type { MarketTimingGlobalContext } from "./types";
import type { CorridorStrategyReport } from "../corridor-strategy/types";
import type { LaunchWaveOperationalEntity } from "../marketplace-operations/types";
import { cadenceFromPressure } from "./levels";

export function computeLaunchCadencePressure(args: {
  activeWaves: LaunchWaveOperationalEntity[];
  launchActions: number;
  scalingBlocked: boolean;
}): { score: number; level: CadenceLevel } {
  const hot = args.activeWaves.filter((w) =>
    ["assembling", "ready", "planning"].includes(w.launchStatus),
  ).length;
  const launched = args.activeWaves.filter((w) => w.launchStatus === "launched").length;
  let score = hot * 22 + args.launchActions * 8 + launched * 6;
  if (args.scalingBlocked) score += 18;
  score = Math.min(100, score);
  return { score, level: cadenceFromPressure(score) };
}

export function computeRefreshCadencePressure(args: {
  refreshNeed: number;
  heroFatigueIdx: number;
  refreshActions: number;
  cstRefresh: boolean;
}): { score: number; level: CadenceLevel } {
  let score = args.refreshNeed * 0.45 + args.heroFatigueIdx * 0.35 + args.refreshActions * 10;
  if (args.cstRefresh) score += 22;
  if (args.refreshActions >= 3) score += 16;
  score = Math.min(100, score);
  return { score, level: cadenceFromPressure(score) };
}

export function computeOperationalRhythm(
  ctx: MarketTimingGlobalContext,
  corridor: string,
  cst: CorridorStrategyReport | null,
): CadenceLevel {
  const waves = ctx.waves.filter((w) => w.corridor === corridor);
  const pressure =
    waves.reduce((s, w) => s + w.operationalPressure, 0) / Math.max(1, waves.length) +
    (ctx.activeAssortmentCount > 12 ? 12 : 0) +
    (cst?.operationalBurden ?? 0) * 0.35;
  return cadenceFromPressure(Math.min(100, pressure));
}
