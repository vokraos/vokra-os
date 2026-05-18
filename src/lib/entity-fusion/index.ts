export type {
  FusionConfidenceLevel,
  ImportedRowSource,
  ImportedRowSummary,
  StrategicEntityKind,
  MatchedEntityRef,
  FusionConflictKind,
  FusionConflict,
  AffectedSystemRef,
  FusionStrategicImpact,
  FusionPreviewEntity,
  EntityFusionMemoryPayload,
  MergeIntentKind,
  MergeIntent,
} from "./types";
export { ENTITY_FUSION_MEMORY_SCHEMA } from "./types";
export { fusionLevelFromScore, averageConfidence01, levelToNumericBand } from "./confidence";
export { canonicalSkuKey, canonicalOfferKey, canonicalCorridorSlug } from "./normalization";
export {
  matchImportedRowToSkuEntity,
  matchOfferToCardPlan,
  matchArticleToCardPlan,
  buildMatchedEntityRefs,
  strategicEntityKindLabelKey,
} from "./matchers";
export { detectFusionConflicts } from "./conflicts";
export { buildMergeIntents } from "./merge";
export { buildFusionPreviewEntityFromSession } from "./preview";
export { parseEntityFusionMemoryPayload } from "./parsePayload";
