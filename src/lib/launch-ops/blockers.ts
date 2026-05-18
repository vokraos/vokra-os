import type { LaunchBlocker, LaunchOpsGatherContext } from "./types";

export function deriveLaunchBlockers(
  ctx: LaunchOpsGatherContext,
  t: (key: string, vars?: Record<string, string>) => string,
): LaunchBlocker[] {
  const out: LaunchBlocker[] = [];
  const p = ctx.pipeline;
  const name = ctx.collection?.name ?? "—";

  const push = (id: string, labelKey: string, severity: LaunchBlocker["severity"], source: string) => {
    out.push({ id, label: t(labelKey, { name }), severity, source });
  };

  if (!ctx.promptPackInSession) push("no_prompt_pack", "lops.blocker.promptPack", "high", "prompt_pack");
  if (ctx.visualAssetCount < 2) push("visual_queue", "lops.blocker.visualQueue", "high", "visual_assets");
  if (ctx.cardPlansLaunchReady < 1) push("card_not_ready", "lops.blocker.cardProduction", "high", "card_production");
  if (!ctx.heroWinnerExists && !ctx.heroLaunchPackage) {
    push("no_hero_winner", "lops.blocker.heroWinner", "high", "hero_command");
  }
  if (ctx.heroLaunchPackage?.readiness === "not_ready") {
    push("launch_pkg", "lops.blocker.launchPackage", "medium", "hero_launch_package");
  }

  for (const b of p?.executionRoute.blockers ?? []) {
    out.push({
      id: `orch_${out.length}`,
      label: b,
      severity: "medium",
      source: "orchestrator",
    });
  }

  for (const s of p?.structuredStops.filter((x) => x.active) ?? []) {
    out.push({
      id: `stop_${s.id}`,
      label: s.label,
      severity: "high",
      source: "stop_condition",
    });
  }

  if ((ctx.orchestration?.resourcePressure.dtfQueue ?? 0) > 68) {
    push("dtf_pressure", "lops.blocker.dtf", "medium", "production");
  }

  return out.slice(0, 12);
}
