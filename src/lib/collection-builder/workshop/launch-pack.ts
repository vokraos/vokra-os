import type { CollectionEntity } from "../types";
import type { CollectionPipelineBundle } from "../pipeline-types";
import type { WorkshopSkuStructure } from "./sku-structure";
import type { LaunchPackV1, ProductionBriefRu, SeoBriefRu, VisualBriefRu } from "./types";

export function buildLaunchPackV1(
  merged: CollectionEntity,
  sku: WorkshopSkuStructure,
  visual: VisualBriefRu,
  seo: SeoBriefRu,
  production: ProductionBriefRu,
  pipeline: CollectionPipelineBundle,
): LaunchPackV1 {
  return {
    schema: "vokra.launchPack.v1",
    generatedAt: Date.now(),
    collection: merged,
    skuStructure: sku,
    visualBrief: visual,
    seoBrief: seo,
    productionBrief: production,
    executionRoute: pipeline.executionRoute,
    collectionCommands: pipeline.collectionCommands,
    structuredStops: pipeline.structuredStops,
  };
}

export function launchPackToJson(pack: LaunchPackV1): string {
  return JSON.stringify(pack, null, 2);
}

export function launchPackToMarkdown(pack: LaunchPackV1): string {
  const c = pack.collection;
  return [
    `# Launch Pack · ${c.name}`,
    ``,
    `## Концепт`,
    c.concept,
    ``,
    `## SKU-структура`,
    `Hero: ${pack.skuStructure.heroes.length} · Support: ${pack.skuStructure.support.length} · Amp: ${pack.skuStructure.amplifiers.length} · Hold: ${pack.skuStructure.holdArchive.length}`,
    ...pack.skuStructure.heroes.map((h) => `- H ${h.wbStyleId}: ${h.noteRu}`),
    ...pack.skuStructure.support.map((s) => `- S ${s.wbStyleId}: ${s.noteRu}`),
    ``,
    `## Визуальный бриф`,
    `- Hero card: ${pack.visualBrief.heroCardPhotoBriefRu}`,
    `- Модель: ${pack.visualBrief.modelStyleRu}`,
    `- Фон: ${pack.visualBrief.backgroundStyleRu}`,
    `- Принт на изделии: ${pack.visualBrief.printPlacementLogicRu}`,
    `- Запреты: ${pack.visualBrief.forbiddenPatternsRu}`,
    `- Reels: ${pack.visualBrief.reelsDirectionRu}`,
    `- Миниатюра: ${pack.visualBrief.marketplaceThumbnailRuleRu}`,
    ``,
    `## SEO бриф`,
    `- WB: ${pack.seoBrief.wbTitleFormulaRu}`,
    `- Ozon: ${pack.seoBrief.ozonTitleFormulaRu}`,
    `- Primary: ${pack.seoBrief.primaryKeywordsRu}`,
    `- Secondary: ${pack.seoBrief.secondaryKeywordsRu}`,
    `- Rich: ${pack.seoBrief.richContentAngleRu}`,
    `- Drift: ${pack.seoBrief.semanticDriftWarningRu}`,
    ``,
    `## Производство`,
    `- DTF: ${pack.productionBrief.dtfSuitabilityRu}`,
    `- Принт: ${pack.productionBrief.printComplexityRu}`,
    `- Blank: ${pack.productionBrief.blankAvailabilityRu}`,
    `- Упаковка: ${pack.productionBrief.packagingImpactRu}`,
    `- FBO prep: ${pack.productionBrief.fboPrepPressureRu}`,
    `- Сложность запуска: ${pack.productionBrief.estimatedLaunchDifficultyRu}`,
    `- Bottleneck: ${pack.productionBrief.bottleneckWarningRu}`,
    ``,
    `## Маршрут исполнения`,
    `- routeId: ${pack.executionRoute.routeId}`,
    `- readiness: ${pack.executionRoute.readiness}%`,
    `- next: ${pack.executionRoute.nextAction}`,
    ``,
    `## Команды`,
    ...pack.collectionCommands.map((x) => `- ${x.titleRu} (${x.typeLabelRu}) · ${x.statusLabelRu}`),
    ``,
    `## Стопы`,
    ...pack.structuredStops.filter((s) => s.active).map((s) => `- ACTIVE: ${s.label}`),
    ...c.stopConditions.map((s) => `- ${s}`),
    ``,
  ].join("\n");
}

export function launchPackSummaryRu(pack: LaunchPackV1): string {
  const c = pack.collection;
  return (
    `${c.name}: readiness ${pack.executionRoute.readiness}%, маршрут ${pack.executionRoute.routeId}. ` +
    `Hero ${pack.skuStructure.heroes.length}, support ${pack.skuStructure.support.length}. ` +
    `Следующий шаг: ${pack.executionRoute.nextAction.slice(0, 120)}${pack.executionRoute.nextAction.length > 120 ? "…" : ""}`
  );
}
