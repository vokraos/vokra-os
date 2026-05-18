import type { AppLocale } from "../i18n/messages";
import { enrichControlTowerWithExecutionFeedback } from "../execution-feedback";
import { enrichControlTowerWithProductionPressure } from "../production-pressure";
import { enrichControlTowerWithOsAudit } from "../os-health-audit";
import { gatherControlTowerContext } from "./gather";
import { buildStrategicControlTowerSnapshot } from "./compose";
import type { StrategicControlTowerSnapshot } from "./types";

export const CONTROL_TOWER_EVENT = "vokra:control-tower-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildControlTowerSnapshot(t: TFn, locale: AppLocale = "en"): StrategicControlTowerSnapshot {
  const tower = buildStrategicControlTowerSnapshot(gatherControlTowerContext(t));
  const withAudit = enrichControlTowerWithOsAudit(tower);
  const withFeedback = enrichControlTowerWithExecutionFeedback(withAudit, t, locale);
  return enrichControlTowerWithProductionPressure(withFeedback, t);
}

export function formatControlTowerDailyLine(snapshot: StrategicControlTowerSnapshot | null, t: TFn): string | null {
  if (!snapshot) return null;
  if (snapshot.overallState === "stable" && snapshot.blockedSystemKey === "sct.blocked.none") {
    return null;
  }
  const blocked =
    snapshot.blockedSystemKey !== "sct.blocked.none"
      ? t(snapshot.blockedSystemKey, snapshot.blockedSystemVars)
      : "";
  return t("sct.daily.line", {
    state: t(`sct.overall.${snapshot.overallState}`),
    blocked: blocked || t("sct.blocked.noneShort"),
  });
}

export function notifyControlTowerUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONTROL_TOWER_EVENT));
}
