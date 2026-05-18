import type { SnapshotIntelligence } from "../intelligence";

export function snapshotReadinessScore(intel: SnapshotIntelligence): number {
  const m = intel.missingFieldSummary;
  const penalty =
    m.skuMissingCorridor * 3 +
    m.skuMissingTitle * 4 +
    m.skuMissingWarehouse * 2 +
    m.skuMissingStockMode * 1 +
    m.skuMissingProductFamily * 2 +
    m.cardMissingHero * 3 +
    m.cardMissingSeo * 3 +
    m.cardMissingWarehouse * 2;
  const denom = Math.max(24, m.totalSlots * 4 + 8);
  const raw = 100 - (penalty / denom) * 85;
  return Math.max(8, Math.min(100, Math.round(raw)));
}
