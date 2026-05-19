import { gatherAdPressureContext } from "../ad-pressure/gather";
import { buildAdvertisingPressureReport } from "../ad-pressure/recommendations";
import { gatherEconomicPressureContext } from "../economic-pressure/gather";
import { deriveSnapshotIntelligence } from "../entity-snapshot/intelligence";
import type { EntitySnapshot } from "../entity-snapshot/types";
import { deriveStructuralAssortmentActions } from "./derive";
import { enrichAssortmentActions, type AssortmentEnrichmentContext } from "./prioritization";
import type { AssortmentAction } from "./types";

export function buildAssortmentEnrichmentContext(
  snapshot: EntitySnapshot,
  structuralActions: AssortmentAction[],
  intel = deriveSnapshotIntelligence(snapshot),
): AssortmentEnrichmentContext {
  const econCtx = gatherEconomicPressureContext({
    snapshot,
    intel,
    structuralActions,
  });
  const adCtx = gatherAdPressureContext({ econ: econCtx });
  return { adReport: buildAdvertisingPressureReport(adCtx) };
}

/** Uncached structural derive → pressure systems → prioritization enrichment. */
export function computeAssortmentActions(snapshot: EntitySnapshot): AssortmentAction[] {
  const intel = deriveSnapshotIntelligence(snapshot);
  const structural = deriveStructuralAssortmentActions(snapshot, intel);
  const enrichment = buildAssortmentEnrichmentContext(snapshot, structural, intel);
  return enrichAssortmentActions(snapshot, structural, intel, enrichment);
}
