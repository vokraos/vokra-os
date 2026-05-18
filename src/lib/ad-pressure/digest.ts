import { loadUnitEconomicsBundle } from "../unit-economics/storage";
import { resolveUnitEconomics } from "../unit-economics/resolve";
import { gatherAdPressureContext } from "./gather";
import { buildAdvertisingPressureReport, formatAdvertisingPressureDailyLine } from "./recommendations";
import type { AdvertisingPressureReport } from "./types";

export const AD_PRESSURE_EVENT = "vokra:ad-pressure-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildPrimaryAdvertisingPressureReport(): AdvertisingPressureReport {
  return buildAdvertisingPressureReport(gatherAdPressureContext());
}

export function buildAllAdvertisingPressureReports(): AdvertisingPressureReport[] {
  const primary = buildPrimaryAdvertisingPressureReport();
  const reports: AdvertisingPressureReport[] = [primary];
  const seen = new Set<string>([primary.corridor]);

  const bundle = loadUnitEconomicsBundle();
  for (const profile of bundle.profiles) {
    const corridor = profile.corridor || profile.name || "—";
    if (seen.has(corridor)) continue;
    const resolved = resolveUnitEconomics(
      {
        corridor: profile.corridor,
        productFamily: profile.productFamily,
        marketplace: profile.marketplace,
        stockMode: profile.stockMode,
      },
      bundle,
    );
    if (!resolved) continue;
    seen.add(corridor);
    reports.push(
      buildAdvertisingPressureReport({
        econ: gatherAdPressureContext().econ,
        launchEcon: resolved,
        corridor,
        marketplace: profile.marketplace,
        stockMode: profile.stockMode,
      }),
    );
  }

  return reports.slice(0, 24);
}

export function getAdvertisingPressureDailyLine(t: TFn): string | null {
  return formatAdvertisingPressureDailyLine(buildAllAdvertisingPressureReports(), t);
}

export function notifyAdPressureUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AD_PRESSURE_EVENT));
}
