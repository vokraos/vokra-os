import { buildEconomicPressureReport } from "./compose";
import { gatherEconomicPressureContext } from "./gather";
import type { EconomicPressureReport } from "./types";

export const ECONOMIC_PRESSURE_EVENT = "vokra:economic-pressure-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function getEconomicPressureDailyLine(t: TFn): string | null {
  const report = buildEconomicPressureReport(gatherEconomicPressureContext(), t);
  return formatEconomicPressureDigestLine(report, t);
}

export function formatEconomicPressureDigestLine(report: EconomicPressureReport, t: TFn): string | null {
  const levels = [
    { key: "expansion" as const, level: report.expansionLevel, score: report.expansionPressure },
    { key: "refresh" as const, level: report.refreshLevel, score: report.refreshPressure },
    { key: "warehouse" as const, level: report.warehouseLevel, score: report.warehousePressure },
    { key: "fragmentation" as const, level: report.fragmentationLevel, score: report.fragmentationPressure },
    { key: "launch" as const, level: report.launchLevel, score: report.launchPressure },
  ];
  const worst = levels.sort((a, b) => scoreRank(b.level) - scoreRank(a.level))[0]!;
  if (worst.level === "low" || worst.level === "manageable") return null;

  if (worst.key === "expansion" && report.dangerousExpansionZones.length >= 2) {
    return t("daily.econ.expansionCorridors", { n: String(report.dangerousExpansionZones.length) });
  }
  if (worst.key === "refresh") {
    return t("daily.econ.refreshUnstable");
  }
  if (worst.key === "warehouse") {
    return t("daily.econ.warehouse");
  }
  if (worst.key === "fragmentation") {
    return t("daily.econ.fragmentation");
  }
  return t("daily.econ.elevated", { dimension: t(`econ.dim.${worst.key}`), level: t(`econ.level.${worst.level}`) });
}

function scoreRank(level: string): number {
  if (level === "critical") return 5;
  if (level === "dangerous") return 4;
  if (level === "elevated") return 3;
  if (level === "manageable") return 2;
  return 1;
}

export function notifyEconomicPressureUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ECONOMIC_PRESSURE_EVENT));
}
