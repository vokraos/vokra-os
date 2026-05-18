import type { CollectionEntity } from "../types";

/** Local-only overrides for the active collection in the workshop. */
export type WorkshopDraft = {
  name?: string;
  concept?: string;
  targetBuyer?: string;
  heroCount?: number;
  supportCount?: number;
  amplifiersOn?: boolean;
  holdArchiveOn?: number;
  visualMood?: string;
  printDirection?: string;
  visualHeroCard?: string;
  visualModelBg?: string;
  visualReels?: string;
  visualThumb?: string;
  seoPrimary?: string;
  seoSecondary?: string;
  launchTestWave?: string;
  launchRefreshWave?: string;
  launchAmpWave?: string;
  launchFboWave?: string;
  launchHoldStop?: string;
  stopLines?: string;
  heroCardBriefRu?: string;
  modelStyleRu?: string;
  backgroundStyleRu?: string;
  printPlacementRu?: string;
  reelsDirectionRu?: string;
  thumbRuleRu?: string;
  wbTitleFormulaRu?: string;
  ozonTitleFormulaRu?: string;
  richAngleRu?: string;
  dtfNoteRu?: string;
  blankRiskRu?: string;
  launchDifficultyRu?: string;
};

export type VisualBriefRu = {
  heroCardPhotoBriefRu: string;
  modelStyleRu: string;
  backgroundStyleRu: string;
  printPlacementLogicRu: string;
  forbiddenPatternsRu: string;
  reelsDirectionRu: string;
  marketplaceThumbnailRuleRu: string;
};

export type SeoBriefRu = {
  wbTitleFormulaRu: string;
  ozonTitleFormulaRu: string;
  primaryKeywordsRu: string;
  secondaryKeywordsRu: string;
  richContentAngleRu: string;
  semanticDriftWarningRu: string;
};

export type ProductionBriefRu = {
  dtfSuitabilityRu: string;
  printComplexityRu: string;
  blankAvailabilityRu: string;
  packagingImpactRu: string;
  fboPrepPressureRu: string;
  estimatedLaunchDifficultyRu: string;
  bottleneckWarningRu: string;
};

export type LaunchPackV1 = {
  schema: "vokra.launchPack.v1";
  generatedAt: number;
  collection: CollectionEntity;
  skuStructure: import("./sku-structure").WorkshopSkuStructure;
  visualBrief: VisualBriefRu;
  seoBrief: SeoBriefRu;
  productionBrief: ProductionBriefRu;
  executionRoute: import("../pipeline-types").CollectionExecutionRoute;
  collectionCommands: readonly import("../../action-command/types").ActionCommand[];
  structuredStops: readonly import("../pipeline-types").CollectionStructuredStop[];
};
