import { loadUnitEconomicsBundle } from "../unit-economics/storage";
import { resolveUnitEconomics } from "../unit-economics/resolve";
import type { UnitEconomicsMatchContext } from "../unit-economics/types";
import { buildPricePositioningReport } from "./logic";
import type { PricePositioningContext, PricePositioningReport } from "./types";

export function buildPricePositioningForContext(
  matchCtx: UnitEconomicsMatchContext,
  priceCtx: PricePositioningContext = {},
): PricePositioningReport | null {
  const bundle = loadUnitEconomicsBundle();
  const resolved = resolveUnitEconomics(matchCtx, bundle);
  if (!resolved) return null;
  return buildPricePositioningReport(resolved, {
    corridor: priceCtx.corridor ?? matchCtx.corridor,
    productFamily: priceCtx.productFamily ?? matchCtx.productFamily,
    economicsNotes: priceCtx.economicsNotes ?? resolved.profile.notes,
  });
}

export function listDangerousPriceReports(
  reports: PricePositioningReport[],
): PricePositioningReport[] {
  return reports.filter(
    (r) => r.pricePressureLevel === "negative" || r.pricePressureLevel === "dangerous" || r.pricePressureLevel === "tight",
  );
}
