import { getActiveEntitySnapshot } from "../entity-snapshot";
import { listActiveLaunchExecutionActions } from "./assortmentStorage";
import type { MarketplaceLaunchPlan } from "./types";

export const LAUNCH_OPS_EVENT = "vokra:launch-ops-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function getLaunchExecutionDailyDigestLine(t: TFn): string | null {
  const snap = getActiveEntitySnapshot();
  if (!snap) return null;
  const active = listActiveLaunchExecutionActions(snap.id).sort((a, b) => b.updatedAt - a.updatedAt);
  const top = active[0];
  if (!top) return null;
  return t("daily.launch.actionLine", { action: top.title });
}

export function getLaunchOpsDailyDigestLine(plan: MarketplaceLaunchPlan | null, t: TFn): string | null {
  if (!plan) return null;
  if (plan.launchReadiness === "blocked" || plan.blockers.length > 0) {
    const top = plan.blockers[0]?.label ?? t(`lops.readiness.${plan.launchReadiness}`);
    return t("daily.launch.blocked", { reason: top });
  }
  if (plan.launchReadiness === "fragile") {
    return t("daily.launch.fragile", { wave: plan.heroWave.title });
  }
  if (plan.heroWave.status === "ready" || plan.launchReadiness === "ready") {
    return t("daily.launch.operational", { wave: plan.heroWave.title });
  }
  return t("daily.launch.status", {
    readiness: t(`lops.readiness.${plan.launchReadiness}`),
    wave: plan.heroWave.title,
  });
}

export function notifyLaunchOpsUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(LAUNCH_OPS_EVENT));
}
