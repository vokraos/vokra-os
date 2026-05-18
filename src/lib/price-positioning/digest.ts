import { loadUnitEconomicsBundle } from "../unit-economics/storage";
import { resolveUnitEconomics } from "../unit-economics/resolve";
import { buildPricePositioningReport } from "./logic";
import { formatPricePressureDailyLine } from "./integration";
import type { PricePositioningReport } from "./types";

export const PRICE_POSITIONING_EVENT = "vokra:price-positioning-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildAllPricePositioningReports(): PricePositioningReport[] {
  const bundle = loadUnitEconomicsBundle();
  const reports: PricePositioningReport[] = [];
  const seen = new Set<string>();

  for (const profile of bundle.profiles) {
    const resolved = resolveUnitEconomics(
      {
        corridor: profile.corridor,
        productFamily: profile.productFamily,
        marketplace: profile.marketplace,
        stockMode: profile.stockMode,
      },
      bundle,
    );
    if (!resolved || seen.has(resolved.profile.id)) continue;
    seen.add(resolved.profile.id);
    reports.push(
      buildPricePositioningReport(resolved, {
        corridor: profile.corridor,
        productFamily: profile.productFamily,
        economicsNotes: profile.notes,
      }),
    );
  }

  for (const a of bundle.assignments) {
    const ctx =
      a.targetType === "collection"
        ? { collectionId: a.targetId }
        : a.targetType === "corridor"
          ? { corridor: a.targetLabel || a.targetId }
          : { productFamily: a.targetLabel };
    const resolved = resolveUnitEconomics(ctx, bundle);
    if (!resolved) continue;
    const key = `${a.targetType}:${a.targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    reports.push(
      buildPricePositioningReport(resolved, {
        corridor: a.targetLabel,
        economicsNotes: resolved.profile.notes,
      }),
    );
  }

  return reports;
}

export function getPricePressureDailyLine(t: TFn): string | null {
  return formatPricePressureDailyLine(buildAllPricePositioningReports(), t);
}

export function notifyPricePositioningUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PRICE_POSITIONING_EVENT));
}
