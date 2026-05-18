import type { CollectionEntity } from "../types";
import type { ProductionBriefRu, SeoBriefRu, VisualBriefRu, WorkshopDraft } from "./types";

export function buildVisualBriefRu(entity: CollectionEntity, draft: WorkshopDraft): VisualBriefRu {
  const v = entity.visualDirection;
  const forbid = v.forbiddenPatterns.join("; ");
  return {
    heroCardPhotoBriefRu:
      draft.heroCardBriefRu ??
      `Главное фото: ${v.heroCardDirection}. Муд: ${v.mood}. Один герой на кадр, читаемый силуэт, без визуального шума.`,
    modelStyleRu: draft.modelStyleRu ?? `Модель: ${v.modelBackgroundStyle.includes("опционально") ? "опционально на hero" : "нейтральная подача"}.`,
    backgroundStyleRu: draft.backgroundStyleRu ?? v.modelBackgroundStyle,
    printPlacementLogicRu:
      draft.printPlacementRu ??
      `${v.printDirection} · принт не пересекает лицевую зону WB; на support — без нового сюжета.`,
    forbiddenPatternsRu: `Запрещено: ${forbid}.`,
    reelsDirectionRu: draft.reelsDirectionRu ?? v.reelsDirection,
    marketplaceThumbnailRuleRu:
      draft.thumbRuleRu ??
      `${v.marketplaceMainPhotoLogic} · миниатюра = первый кадр без обрезки логотипа кластера.`,
  };
}

export function buildSeoBriefRu(entity: CollectionEntity, draft: WorkshopDraft): SeoBriefRu {
  const s = entity.seoPlan;
  const drift = s.forbiddenSemanticDrift.join("; ");
  return {
    wbTitleFormulaRu:
      draft.wbTitleFormulaRu ??
      `WB: ${s.titleTone} — первые 48 символов = материал + посадка + коридор; без «поэтики» и без дублей соседних SKU.`,
    ozonTitleFormulaRu:
      draft.ozonTitleFormulaRu ??
      `Ozon: ${s.wbVsOzon} — title короче дублирования из WB; body чуть шире, один основной ключ на абзац.`,
    primaryKeywordsRu: s.primaryCluster,
    secondaryKeywordsRu: s.secondaryClusters.join(", "),
    richContentAngleRu: draft.richAngleRu ?? s.richContentAngle,
    semanticDriftWarningRu: `Контроль дрейфа: ${drift}.`,
  };
}

export function buildProductionBriefRu(entity: CollectionEntity, draft: WorkshopDraft): ProductionBriefRu {
  const p = entity.productionFit;
  return {
    dtfSuitabilityRu: draft.dtfNoteRu ?? p.dtfSuitability,
    printComplexityRu: p.printComplexity,
    blankAvailabilityRu: draft.blankRiskRu ?? `Blank/размеры: держать синхрон с DTF-очередью; риск при пике очереди.`,
    packagingImpactRu: p.packagingPressure,
    fboPrepPressureRu: p.fboPrepPressure,
    estimatedLaunchDifficultyRu:
      draft.launchDifficultyRu ??
      `Оценка сложности запуска: ${p.launchSpeed}; суммарный production risk: ${p.productionRisk}.`,
    bottleneckWarningRu: p.operationalWarning ?? "Критических bottleneck по текущим порогам нет.",
  };
}
