import type { MarketplaceLaunchReview } from "../launch-ops/review/types";

/** Manual notes only — no demand forecast or API seasonality. */
export function deriveSeasonalContext(args: {
  reviews: MarketplaceLaunchReview[];
  launchPlanNotes: string;
}): string {
  const manualBits: string[] = [];
  for (const r of args.reviews) {
    const blob = `${r.learningNotes} ${r.earlyMarketObservation} ${r.nextDecision}`.trim();
    if (!blob) continue;
    if (/сезон|season|календар|calendar|пик|peak|зима|лето|осень|весн/i.test(blob)) {
      manualBits.push(blob.slice(0, 120));
    }
  }
  if (args.launchPlanNotes && /сезон|season|timing|тайминг/i.test(args.launchPlanNotes)) {
    manualBits.push(args.launchPlanNotes.slice(0, 100));
  }
  if (!manualBits.length) return "";
  return manualBits[0]!.slice(0, 160);
}

export function seasonalContextKey(hasManual: boolean): string {
  return hasManual ? "mtm.seasonal.manual" : "mtm.seasonal.none";
}
