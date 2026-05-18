import { healthRank } from "./levels";
import { buildOsHealthAuditReport, pickTopMissingInput } from "./compose";
import type { OsHealthAuditReport } from "./types";

export const OS_HEALTH_AUDIT_EVENT = "vokra:os-health-audit-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function notifyOsHealthAuditUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OS_HEALTH_AUDIT_EVENT));
}

export function formatOsHealthAuditDailyLine(report: OsHealthAuditReport | null, t: TFn): string | null {
  if (!report) return null;
  if (healthRank(report.overallHealth) < healthRank("weak")) return null;

  const top = pickTopMissingInput(report);
  return t("oha.daily.line", {
    health: t(`oha.health.${report.overallHealth}`),
    missing: top ? t(top.key, top.vars) : t("oha.missing.noneShort"),
  });
}

export function shouldShowOsHealthDaily(report: OsHealthAuditReport): boolean {
  return (
    report.overallHealth === "weak" ||
    report.overallHealth === "fragile" ||
    report.overallHealth === "incomplete"
  );
}

export { buildOsHealthAuditReport, pickTopMissingInput };
