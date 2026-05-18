export {
  UNIT_ECONOMICS_MEMORY_SCHEMA,
  UNIT_ECONOMICS_MEMORY_SCHEMA_V2,
  UNIT_ECONOMICS_PROFILES_STORAGE_KEY,
  UNIT_ECONOMICS_TEMPLATES_STORAGE_KEY,
  UNIT_ECONOMICS_ASSIGNMENTS_STORAGE_KEY,
  type MarginPressureLevel,
  type UnitEconomicsProfile,
  type UnitEconomicsTemplate,
  type UnitEconomicsAssignment,
  type UnitEconomicsAssignmentTargetType,
  type UnitEconomicsCalculated,
  type UnitEconomicsProfileRow,
  type UnitEconomicsMatchContext,
  type UnitEconomicsResolvedMatch,
  type EconomicsSourceKind,
  type UnitEconomicsBundle,
  type UnitEconomicsMemoryPayload,
} from "./types";
export { newUnitEconomicsProfileId, newUnitEconomicsTemplateId, newUnitEconomicsAssignmentId } from "./ids";
export { calculateUnitEconomics, marginPressureFromPercent, marginPressureRank } from "./calculate";
export {
  loadUnitEconomicsProfiles,
  saveUnitEconomicsProfiles,
  loadUnitEconomicsTemplates,
  saveUnitEconomicsTemplates,
  loadUnitEconomicsAssignments,
  saveUnitEconomicsAssignments,
  loadUnitEconomicsBundle,
  saveUnitEconomicsBundle,
} from "./storage";
export {
  findBestUnitEconomicsProfile,
  listProfilesByPressure,
  profileLabel,
  scoreProfileMatch,
} from "./match";
export { scoreTemplateMatch } from "./match-templates";
export {
  resolveUnitEconomics,
  formatResolvedSourceLine,
  computeTemplateCoverage,
} from "./resolve";
export {
  upsertUnitEconomicsAssignment,
  removeUnitEconomicsAssignment,
  findAssignmentForTarget,
  assignTemplateToCollection,
} from "./assignments";
export {
  templateToEffectiveProfile,
  applyTemplateToProfile,
  profileFromTemplate,
  templateFromProfile,
  templateLabel,
} from "./template-utils";
export { TEMPLATE_PRODUCT_TYPES, presetTemplateDefaults, templateDisplayName, type TemplateProductType } from "./presets";
export { buildCorridorCoverageFromIntel, formatCoverageWarning } from "./coverage";
export {
  parseUnitEconomicsMemoryPayload,
  buildUnitEconomicsMemoryPayload,
} from "./memoryPayload";
export {
  saveUnitEconomicsSession,
  peekUnitEconomicsSession,
  primeSessionsFromUnitEconomicsMemoryPayload,
} from "./session";
export {
  getUnitEconomicsDailyLine,
  notifyUnitEconomicsUpdated,
  UNIT_ECONOMICS_EVENT,
} from "./digest";
export {
  mergeUnitEconomicsHintsIntoLaunchRecommendations,
  appendUnitEconomicsToEconomicWarnings,
  formatUnitEconomicsDigestLine,
  formatUnitEconomicsFounderLine,
  getUnitEconomicsAdRiskLine,
  loadProfilesForIntegrations,
  loadBundleForIntegrations,
} from "./recommendations";
export { augmentAssortmentWithUnitEconomics } from "./assortment";
export { getCollectionUnitEconomicsHint, getCollectionEconomicsAssignmentLine } from "./collection";
