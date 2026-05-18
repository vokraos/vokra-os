import type { SnapshotIntelligence } from "../../entity-snapshot/intelligence";
import type { AssortmentPriorityDigest } from "../types";

export function getCorridorPrioritySignalsFromIntel(
  intel: SnapshotIntelligence,
): Pick<AssortmentPriorityDigest, "safestLaunchCorridor" | "highestLeverageCorridor" | "highestDragCorridor"> {
  const candidates = intel.launchCandidateSummary.byCorridor;
  const mixed = new Set(
    intel.fboExposureSummary.mixedCorridors.filter((m) => m.hasFbo && m.hasFbs).map((m) => m.corridor),
  );

  let safestLaunchCorridor: string | null = null;
  let best = -1;
  for (const row of candidates) {
    const penalty = mixed.has(row.corridor) ? 0.55 : 1;
    const score = row.count * penalty;
    if (score > best) {
      best = score;
      safestLaunchCorridor = row.corridor;
    }
  }
  if (!safestLaunchCorridor && candidates[0]) safestLaunchCorridor = candidates[0].corridor;

  let highestLeverageCorridor: string | null = intel.corridorSummary[0]?.corridor ?? null;
  const seoTop = intel.seoGapSummary.topGapCorridor;
  if (seoTop && intel.seoGapSummary.cardsMissingSeo > 0) {
    const seoRow = intel.corridorSummary.find((r) => r.corridor === seoTop);
    const topRow = intel.corridorSummary[0];
    if (seoRow && topRow && seoRow.total >= topRow.total * 0.35) {
      highestLeverageCorridor = seoTop;
    }
  }

  let highestDragCorridor: string | null = null;
  let maxTot = 0;
  for (const m of intel.fboExposureSummary.mixedCorridors) {
    if (!m.hasFbo || !m.hasFbs) continue;
    const tot = intel.corridorSummary.find((r) => r.corridor === m.corridor)?.total ?? 0;
    if (tot >= maxTot) {
      maxTot = tot;
      highestDragCorridor = m.corridor;
    }
  }
  if (!highestDragCorridor && intel.missingFieldSummary.totalSlots > 24 && intel.corridorSummary[0]) {
    highestDragCorridor = intel.corridorSummary[0].corridor;
  }

  return { safestLaunchCorridor, highestLeverageCorridor, highestDragCorridor };
}
