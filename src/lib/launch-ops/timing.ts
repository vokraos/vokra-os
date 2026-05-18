import type { LaunchOpsGatherContext, LaunchTimingAdvice } from "./types";
import type { LaunchReadinessLevel } from "./types";

export function deriveLaunchTiming(
  ctx: LaunchOpsGatherContext,
  readiness: LaunchReadinessLevel,
  t: (key: string, vars?: Record<string, string>) => string,
): LaunchTimingAdvice {
  const patience = ctx.pipeline?.readiness.timingReadiness ?? 50;
  if (readiness === "blocked") {
    return {
      label: t("lops.timing.hold"),
      windowNote: t("lops.timing.holdNote"),
      patienceNote: t("lops.timing.patienceHold"),
    };
  }
  if (readiness === "fragile") {
    return {
      label: t("lops.timing.cautious"),
      windowNote: t("lops.timing.cautiousNote", { n: String(patience) }),
      patienceNote: t("lops.timing.patienceCautious"),
    };
  }
  if (readiness === "expansion_ready") {
    return {
      label: t("lops.timing.expand"),
      windowNote: t("lops.timing.expandNote"),
      patienceNote: t("lops.timing.patienceExpand"),
    };
  }
  return {
    label: t("lops.timing.operational"),
    windowNote: t("lops.timing.operationalNote"),
    patienceNote: t("lops.timing.patienceOk"),
  };
}
