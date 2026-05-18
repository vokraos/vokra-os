import type { LaunchOpsGatherContext, LaunchReadinessLevel } from "./types";

export type ReadinessResult = {
  level: LaunchReadinessLevel;
  score: number;
};

export function computeLaunchReadiness(ctx: LaunchOpsGatherContext): ReadinessResult {
  const p = ctx.pipeline;
  const r = p?.readiness;
  const stops = [
    ...(p?.structuredStops.filter((s) => s.active).map((s) => s.label) ?? []),
    ...(p?.executionRoute.stopConditions ?? []),
  ];
  const blockerCount = (p?.executionRoute.blockers.length ?? 0) + stops.length;

  let score = r?.collectionLaunchReadiness ?? ctx.synthesisLaunchReadiness ?? 40;

  if (!ctx.promptPackInSession) score -= 8;
  if (ctx.visualAssetCount < 2) score -= 10;
  if (ctx.cardPlansLaunchReady < 1) score -= 12;
  if (!ctx.heroWinnerExists && !ctx.heroLaunchPackage) score -= 10;
  if (ctx.heroLaunchPackage?.readiness === "not_ready") score -= 15;
  if (ctx.heroLaunchPackage?.readiness === "partial") score -= 6;
  if ((ctx.orchestration?.resourcePressure.dtfQueue ?? 0) > 65) score -= 10;
  if ((ctx.orchestration?.resourcePressure.packagingBottleneck ?? 0) > 58) score -= 8;
  if (blockerCount >= 2) score -= 14;
  if (ctx.visualFatigue > 55) score -= 6;
  if (ctx.seoSaturation > 55) score -= 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: LaunchReadinessLevel;
  if (stops.length > 0 && score < 42) level = "blocked";
  else if (score < 48 || blockerCount >= 2) level = "fragile";
  else if (score < 68) level = "operational";
  else if (score < 82) level = "ready";
  else level = "expansion_ready";

  return { level, score };
}
