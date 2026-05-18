import type { LaunchBlocker, LaunchOpsGatherContext, LaunchReadinessLevel } from "./types";

export function deriveLaunchRecommendations(
  ctx: LaunchOpsGatherContext,
  readiness: LaunchReadinessLevel,
  blockers: LaunchBlocker[],
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const lines: string[] = [];
  const push = (key: string, vars?: Record<string, string>) => lines.push(t(key, vars));

  if (readiness === "blocked") push("lops.rec.hold");
  if (blockers.some((b) => b.id === "visual_queue")) push("lops.rec.visualQueue");
  if (blockers.some((b) => b.id === "no_hero_winner")) push("lops.rec.heroWinner");
  if (!ctx.promptPackInSession) push("lops.rec.promptPack");
  if (ctx.cardPlansLaunchReady < 1) push("lops.rec.cardProduction");
  if (ctx.heroLaunchPackage) push("lops.rec.launchPackageChecklist");
  if (readiness === "expansion_ready") push("lops.rec.expansionWave");
  if (ctx.visualFatigue > 52) push("lops.rec.refreshWave");
  if (ctx.pipeline?.executionRoute.nextAction) {
    push("lops.rec.nextAction", { action: ctx.pipeline.executionRoute.nextAction.slice(0, 120) });
  }

  const seen = new Set<string>();
  return lines.filter((x) => {
    if (seen.has(x)) return false;
    seen.add(x);
    return true;
  }).slice(0, 8);
}

export function deriveOperationalWarnings(
  ctx: LaunchOpsGatherContext,
  pressure: { launchPressure: number; fboPressure: number },
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const w: string[] = [];
  if (pressure.launchPressure > 62) w.push(t("lops.warn.launchPressure", { n: String(pressure.launchPressure) }));
  if (pressure.fboPressure > 58) w.push(t("lops.warn.fbo", { n: String(pressure.fboPressure) }));
  if (ctx.pipeline?.productionWorkflow.productionBottleneckWarning) {
    w.push(ctx.pipeline.productionWorkflow.productionBottleneckWarning.slice(0, 140));
  }
  return w.slice(0, 6);
}
