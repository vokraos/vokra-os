export {
  CORRIDOR_STRATEGY_MEMORY_SCHEMA,
  type CorridorState,
  type CorridorRecommendedStrategy,
  type CorridorStrategyReport,
  type CorridorStrategyGlobalContext,
  type CorridorStrategyMemoryPayload,
} from "./types";
export { newCorridorStrategyReportId, scoreLevel } from "./levels";
export { computeDominancePotential } from "./dominance";
export { computeSaturationPressure } from "./saturation";
export { computeFragmentationPressure, computeSeoCoverage } from "./fragmentation";
export { computeExpansionSafety } from "./expansion";
export {
  computeRefreshNeed,
  computeHeroPressure,
  computeArchiveRisk,
  computeOperationalBurden,
} from "./fatigue";
export { computeFulfillmentFit } from "./fulfillment";
export {
  deriveCorridorState,
  deriveRecommendedStrategy,
  buildCorridorStrategyReport,
  buildAllCorridorStrategyReports,
  pickPrimaryCorridorReport,
} from "./recommendations";
export {
  shouldCorridorStrategyHoldAction,
  augmentAssortmentWithCorridorStrategy,
  applyCorridorStrategyToLaunchPlan,
  reportToDisplay,
  formatCorridorStrategyFounderLine,
  formatCorridorStrategyDailyLine,
  getCollectionCorridorStrategyHint,
  getMarketplaceOpsCorridorHint,
} from "./integration";
export {
  CORRIDOR_STRATEGY_EVENT,
  gatherCorridorStrategyContext,
  buildCorridorStrategyReports,
  buildPrimaryCorridorStrategyReport,
  notifyCorridorStrategyUpdated,
} from "./digest";
export { parseCorridorStrategyMemoryPayload, buildCorridorStrategyMemoryPayload } from "./memoryPayload";
export {
  saveCorridorStrategySession,
  peekCorridorStrategySession,
  primeSessionsFromCorridorStrategyMemoryPayload,
} from "./session";
