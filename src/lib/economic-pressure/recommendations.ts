import type { EconomicPressureReport } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function deriveEconomicRecommendations(
  report: Pick<
    EconomicPressureReport,
    | "operationalPressure"
    | "expansionPressure"
    | "fragmentationPressure"
    | "warehousePressure"
    | "refreshPressure"
    | "launchPressure"
    | "expansionLevel"
    | "fragmentationLevel"
    | "warehouseLevel"
    | "refreshLevel"
    | "launchLevel"
    | "dangerousExpansionZones"
  >,
  t: TFn,
): { recommendedFocus: string[]; stopExpansionSignals: string[]; operationalWarnings: string[] } {
  const recommendedFocus: string[] = [];
  const stopExpansionSignals: string[] = [];
  const operationalWarnings: string[] = [];
  const push = (arr: string[], key: string, vars?: Record<string, string>) => {
    const line = t(key, vars);
    if (!arr.includes(line)) arr.push(line);
  };

  if (report.expansionLevel === "dangerous" || report.expansionLevel === "critical") {
    push(stopExpansionSignals, "econ.stop.expansion");
    push(recommendedFocus, "econ.rec.stopExpansion");
  }
  if (report.fragmentationLevel === "elevated" || report.fragmentationLevel === "dangerous") {
    push(recommendedFocus, "econ.rec.consolidateCorridors");
  }
  if (report.warehouseLevel === "dangerous" || report.warehouseLevel === "critical") {
    push(operationalWarnings, "econ.warn.warehouse");
    push(recommendedFocus, "econ.rec.warehouseCleanup");
  }
  if (report.refreshLevel === "elevated" || report.refreshLevel === "dangerous" || report.refreshLevel === "critical") {
    push(recommendedFocus, "econ.rec.refreshSlowdown");
    push(operationalWarnings, "econ.warn.refreshCadence");
  }
  if (report.launchLevel === "dangerous" || report.launchLevel === "critical") {
    push(recommendedFocus, "econ.rec.launchReduction");
    push(stopExpansionSignals, "econ.stop.launchComplexity");
  }
  if (report.operationalPressure >= 65) {
    push(recommendedFocus, "econ.rec.operationalCleanup");
  }
  if (report.dangerousExpansionZones.length >= 3) {
    push(operationalWarnings, "econ.warn.multiCorridor", { n: String(report.dangerousExpansionZones.length) });
  }
  if (recommendedFocus.length === 0) push(recommendedFocus, "econ.rec.maintainCadence");
  if (stopExpansionSignals.length === 0 && report.expansionPressure >= 50) {
    push(stopExpansionSignals, "econ.stop.cautiousExpansion");
  }

  return {
    recommendedFocus: recommendedFocus.slice(0, 8),
    stopExpansionSignals: stopExpansionSignals.slice(0, 6),
    operationalWarnings: operationalWarnings.slice(0, 6),
  };
}

export function mergeEconomicHintsIntoLaunchRecommendations(
  lines: string[],
  report: EconomicPressureReport | null,
  t: TFn,
): string[] {
  if (!report) return lines;
  const out = [...lines];
  const add = (key: string, vars?: Record<string, string>) => {
    const line = t(key, vars);
    if (!out.includes(line)) out.push(line);
  };
  if (report.expansionLevel === "dangerous" || report.expansionLevel === "critical") {
    add("econ.hint.launchHoldExpansion");
  }
  if (report.refreshLevel === "elevated" || report.refreshLevel === "dangerous") {
    add("econ.hint.launchRefreshCadence");
  }
  if (report.fragmentationLevel === "dangerous") {
    add("econ.hint.launchFragmentation");
  }
  return out.slice(0, 10);
}
