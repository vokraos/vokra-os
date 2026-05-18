import type { StrategicControlTowerSnapshot } from "../strategic-control-tower/types";
import type { AuditHealthLevel, OsHealthAuditReport } from "./types";
import { buildOsHealthAuditReport, pickTopMissingInput } from "./compose";
import { healthRank } from "./levels";

type TFn = (key: string, vars?: Record<string, string>) => string;

export type ControlTowerOsAuditSlice = {
  osAuditHealth: AuditHealthLevel;
  osAuditTopMissingKey: string;
  osAuditTopMissingVars: Record<string, string>;
  osAuditShowLink: boolean;
};

export function buildControlTowerOsAuditSlice(report?: OsHealthAuditReport | null): ControlTowerOsAuditSlice {
  const audit = report ?? buildOsHealthAuditReport();
  const top = pickTopMissingInput(audit);
  return {
    osAuditHealth: audit.overallHealth,
    osAuditTopMissingKey: top?.key ?? "oha.missing.none",
    osAuditTopMissingVars: top?.vars ?? {},
    osAuditShowLink: healthRank(audit.overallHealth) >= healthRank("weak"),
  };
}

export function enrichControlTowerWithOsAudit(
  tower: StrategicControlTowerSnapshot,
  report?: OsHealthAuditReport | null,
): StrategicControlTowerSnapshot & ControlTowerOsAuditSlice {
  const slice = buildControlTowerOsAuditSlice(report);
  return {
    ...tower,
    ...slice,
    executionFeedbackLineKey: tower.executionFeedbackLineKey ?? null,
    executionFeedbackLineVars: tower.executionFeedbackLineVars ?? {},
    productionPressureLineKey: tower.productionPressureLineKey ?? null,
    productionPressureLineVars: tower.productionPressureLineVars ?? {},
  };
}

export function formatControlTowerOsAuditLine(slice: ControlTowerOsAuditSlice, t: TFn): string | null {
  if (!slice.osAuditShowLink) return null;
  return t("oha.controlTower.line", {
    health: t(`oha.health.${slice.osAuditHealth}`),
    missing: t(slice.osAuditTopMissingKey, slice.osAuditTopMissingVars),
  });
}
