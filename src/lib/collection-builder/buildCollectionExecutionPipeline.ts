import type { ActionCommand, ActionCommandStatus, ActionCommandType } from "../action-command/types";
import { ACTION_COMMAND_STATUS_RU, ACTION_COMMAND_TYPE_LABEL_RU } from "../action-command/types";
import type { ExecutionOrchestrationSnapshot } from "../execution-orchestrator/types";
import { mix } from "../cognitive-depth/sku-empire";
import type { CollectionEntity } from "./types";
import {
  COLLECTION_PIPELINE_STAGES,
  type CollectionExecutionRoute,
  type CollectionPipelineBuildInput,
  type CollectionPipelineBundle,
  type CollectionProductionWorkflowOutput,
  type CollectionReadinessBreakdown,
  type CollectionSeoWorkflowOutput,
  type CollectionStage,
  type CollectionStageStatus,
  type CollectionStructuredStop,
  type CollectionVisualWorkflowOutput,
} from "./pipeline-types";
import { clamp } from "../math";

function pick<T>(locale: "ru" | "en", pair: { ru: T; en: T }): T {
  return locale === "en" ? pair.en : pair.ru;
}

function riskForCommandType(t: ActionCommandType): string {
  const m: Record<ActionCommandType, string> = {
    verify_brand_dna: "Дилюция и конфликт с gate бренда.",
    create_sku: "Потеря окна и перегруз матрицы без якоря.",
    prepare_print: "Срыв DTF и рассинхрон с витриной.",
    update_hero_visual: "Просадка CTR без обновления героя.",
    expand_seo: "Размытие кластера и рост CPC.",
    assemble_rich: "Слабая конверсия карточки.",
    launch_reels: "Потеря соцдоказательства.",
    prepare_fbo: "Логистический дробитель и нестабильный fulfillment.",
    check_production: "Срыв партий и рост drag.",
    update_card: "Расхождение карточки с SEO/визуалом.",
    test_price: "Давление на маржу.",
    reduce_sku_entropy: "Шум матрицы SKU.",
  };
  return m[t];
}

function computeReadiness(input: CollectionPipelineBuildInput): CollectionReadinessBreakdown {
  const orch = input.orchestration;
  const rp = orch.resourcePressure;
  const dnaBoost =
    input.entity.integration.brandDnaGovernance.includes("ON") ||
    input.entity.integration.brandDnaGovernance.includes("актив")
      ? 8
      : 0;
  const brandReadiness = clamp(input.brandFitRank + dnaBoost);
  const visualReadiness = clamp(100 - input.visualFatigue + (input.entity.kind.includes("visual") ? 6 : 0));
  let seoReadiness = clamp(100 - input.seoSaturation);
  if (input.entity.kind === "trend_capture_wave") seoReadiness = clamp(seoReadiness - 4);
  const productionReadiness = clamp(
    100 - (input.riskProductionOverload + rp.dtfQueue + rp.packagingBottleneck) / 3 - rp.skuComplexity * 0.15,
  );
  const marketplaceReadiness = clamp(input.launchReadiness - orch.operationalDrag * 0.25);
  const timingReadiness = clamp(input.patienceScore * 0.65 + (100 - input.visualFatigue) * 0.15);
  const executionReadiness = clamp(orch.executionConfidence - orch.operationalDrag * 0.35);

  const collectionLaunchReadiness = Math.round(
    brandReadiness * 0.14 +
      visualReadiness * 0.13 +
      seoReadiness * 0.13 +
      productionReadiness * 0.2 +
      marketplaceReadiness * 0.18 +
      timingReadiness * 0.1 +
      executionReadiness * 0.12,
  );

  return {
    brandReadiness: Math.round(brandReadiness),
    visualReadiness: Math.round(visualReadiness),
    seoReadiness: Math.round(seoReadiness),
    productionReadiness: Math.round(productionReadiness),
    marketplaceReadiness: Math.round(marketplaceReadiness),
    timingReadiness: Math.round(timingReadiness),
    executionReadiness: Math.round(executionReadiness),
    collectionLaunchReadiness: clamp(Math.round(collectionLaunchReadiness)),
  };
}

function buildVisualWorkflow(entity: CollectionEntity, locale: "ru" | "en"): CollectionVisualWorkflowOutput {
  const v = entity.visualDirection;
  return {
    heroPhotoBrief: pick(locale, {
      ru: `${v.heroCardDirection} · ${v.mood} · один герой на кадр.`,
      en: `${v.heroCardDirection} · ${v.mood} · single hero per frame.`,
    }),
    supportingPhotoDirection: pick(locale, {
      ru: `Support: flat lay / манекен; без конкурирующего сюжета с hero. ${v.printDirection}`,
      en: `Support: flat lay / mannequin; no competing story vs hero. ${v.printDirection}`,
    }),
    modelStyle: pick(locale, {
      ru: entity.kind.includes("premium") ? "Сдержанная подача, минимум стиляги." : "Нейтральная urban-подача.",
      en: entity.kind.includes("premium") ? "Restrained styling, minimal flash." : "Neutral urban styling.",
    }),
    backgroundStyle: v.modelBackgroundStyle,
    marketplaceMainCardLogic: v.marketplaceMainPhotoLogic,
    reelsConcept: v.reelsDirection,
    visualRefreshRule: pick(locale, {
      ru: "Не менять hero чаще 1 раза на волну; support только после зелёного теста CTR.",
      en: "Do not refresh hero more than once per wave; support only after green CTR test.",
    }),
  };
}

function buildSeoWorkflow(entity: CollectionEntity, locale: "ru" | "en"): CollectionSeoWorkflowOutput {
  const s = entity.seoPlan;
  const pk = pick(locale, {
    ru: ["материал", "посадка", "коридор", entity.corridorNameKey.replace("depth.topo.", "")],
    en: ["material", "fit", "corridor", entity.corridorNameKey.replace("depth.topo.", "")],
  });
  const sk = pick(locale, {
    ru: ["размер", "цвет", "сезонность лёгкая"],
    en: ["size", "color", "light seasonality"],
  });
  return {
    wbTitleLogic: pick(locale, {
      ru: `WB: ${s.titleTone} — плотность ключей выше, первые 48 символов = узнаваемость кластера.`,
      en: `WB: ${s.titleTone} — higher key density; first 48 chars = cluster recognition.`,
    }),
    ozonTitleLogic: pick(locale, {
      ru: `Ozon: чуть шире тело; title без повторов из WB; ${s.wbVsOzon}`,
      en: `Ozon: slightly wider body; title without WB repeats; ${s.wbVsOzon}`,
    }),
    primaryKeywords: pk,
    secondaryKeywords: sk,
    richContentAngle: s.richContentAngle,
    forbiddenSemanticDrift: s.forbiddenSemanticDrift,
  };
}

function buildProductionWorkflow(
  entity: CollectionEntity,
  orch: ExecutionOrchestrationSnapshot,
  locale: "ru" | "en",
): CollectionProductionWorkflowOutput {
  const p = entity.productionFit;
  const rp = orch.resourcePressure;
  const blankRisk = clamp(rp.dtfQueue * 0.45 + rp.skuComplexity * 0.35 + (mix(entity.pulseSeed, 3) % 12));
  return {
    dtfSuitability: p.dtfSuitability,
    printComplexity: p.printComplexity,
    blankAvailabilityRisk: pick(locale, {
      ru: `Риск дефицита blank/размеров: ${Math.round(blankRisk)}% при очереди DTF ${rp.dtfQueue}% и сложности SKU ${rp.skuComplexity}%.`,
      en: `Blank/size availability risk: ${Math.round(blankRisk)}% at DTF queue ${rp.dtfQueue}% and SKU complexity ${rp.skuComplexity}%.`,
    }),
    packagingImpact: p.packagingPressure,
    fboPrepImpact: p.fboPrepPressure,
    productionBottleneckWarning:
      p.operationalWarning ??
      pick(locale, { ru: "Нет критического bottleneck по текущим порогам.", en: "No critical bottleneck at current thresholds." }),
  };
}

function buildStructuredStops(
  entity: CollectionEntity,
  input: CollectionPipelineBuildInput,
  readiness: CollectionReadinessBreakdown,
  locale: "ru" | "en",
): CollectionStructuredStop[] {
  const rp = input.orchestration.resourcePressure;
  return [
    {
      id: "packaging_overload",
      label: pick(locale, {
        ru: "Не запускать при перегрузе упаковки (bottleneck >62%).",
        en: "Do not launch on packaging overload (bottleneck >62%).",
      }),
      active: rp.packagingBottleneck > 58,
    },
    {
      id: "dna_weak",
      label: pick(locale, {
        ru: "Слабый Brand DNA fit — сначала verify_brand_dna.",
        en: "Weak Brand DNA fit — run verify_brand_dna first.",
      }),
      active: readiness.brandReadiness < 48,
    },
    {
      id: "seo_saturated",
      label: pick(locale, {
        ru: "SEO-коридор перегрет (saturation / fatigue).",
        en: "SEO corridor overheated (saturation / fatigue).",
      }),
      active: readiness.seoReadiness < 42 || input.seoSaturation > 55,
    },
    {
      id: "hero_visual_not_ready",
      label: pick(locale, {
        ru: "Hero visual не готов — нет amplification.",
        en: "Hero visual not ready — no amplification.",
      }),
      active: readiness.visualReadiness < 45,
    },
    {
      id: "production_pressure",
      label: pick(locale, {
        ru: "Давление производства слишком высоко для новой волны.",
        en: "Production pressure too high for a new wave.",
      }),
      active: input.riskProductionOverload > 58 || rp.dtfQueue > 68,
    },
    {
      id: "fbo_instability",
      label: pick(locale, {
        ru: "FBO нестабилен — не включать FBO-волну.",
        en: "FBO unstable — do not run FBO wave.",
      }),
      active: rp.fboReadiness < 48 && entity.kind === "fbo_scale_collection",
    },
    {
      id: "marketplace_fit_low",
      label: pick(locale, {
        ru: "Низкая marketplace fit / готовность запуска.",
        en: "Low marketplace fit / launch readiness.",
      }),
      active: readiness.marketplaceReadiness < 44,
    },
  ];
}

function blockerAppliesToStage(blockerLabel: string, stageIndex: number, locale: "ru" | "en"): boolean {
  const b = blockerLabel.toLowerCase();
  const visual = locale === "en" ? "visual" : "визуал";
  const pack = locale === "en" ? "pack" : "упак";
  if (stageIndex >= 5 && stageIndex <= 7 && (b.includes(visual) || b.includes("hero"))) return true;
  if (stageIndex >= 9 && stageIndex <= 10 && b.includes(pack)) return true;
  if (stageIndex === 6 && b.includes("seo")) return true;
  return stageIndex <= 3 && (b.includes("sku") || b.includes("маршрут"));
}

function buildPipelineStages(
  input: CollectionPipelineBuildInput,
  readiness: CollectionReadinessBreakdown,
  currentIdx: number,
  locale: "ru" | "en",
): CollectionStage[] {
  const blockers = input.orchestration.blockers.map((b) => b.labelRu);
  const heroN = input.entity.heroProducts.length;
  const sup = input.entity.skuClusters.find((c) => c.role === "support")?.count ?? 0;
  return COLLECTION_PIPELINE_STAGES.map((def) => {
    let status: CollectionStageStatus = "pending";
    const blocked = blockers.some((bl) => blockerAppliesToStage(bl, def.index, locale));
    if (def.index < currentIdx) status = "done";
    else if (def.index === currentIdx) status = blocked ? "blocked" : "in_progress";
    else if (def.index === currentIdx + 1 && !blocked) status = "ready";

    const dependency = pick(locale, {
      ru: `Маршрут ${input.orchestration.primaryRouteId}, стадия контура ${def.index}.`,
      en: `Route ${input.orchestration.primaryRouteId}, contour stage ${def.index}.`,
    });
    const risk = pick(locale, {
      ru: `Задержка снижает readiness (сейчас ${readiness.collectionLaunchReadiness}%).`,
      en: `Delay reduces readiness (now ${readiness.collectionLaunchReadiness}%).`,
    });
    const output = pick(locale, {
      ru:
        def.index === 0
          ? "Чеклист DNA + запреты для коллекции."
          : def.index === 2
            ? `${heroN} hero SKU зафиксированы в коридоре.`
            : def.index === 3
              ? `${sup} support-кластеров в матрице.`
              : def.index === 6
                ? "SEO-кластер и title-шаблоны на волну."
                : "Артефакт стадии в памяти проекта / Mission Control.",
      en:
        def.index === 0
          ? "DNA checklist + forbiddens for capsule."
          : def.index === 2
            ? `${heroN} hero SKUs locked in corridor.`
            : def.index === 3
              ? `${sup} support clusters in matrix.`
              : def.index === 6
                ? "SEO cluster + title templates for wave."
                : "Stage artifact in project memory / Mission Control.",
    });
    return {
      index: def.index,
      messageKey: def.messageKey,
      owner: def.owner,
      status,
      dependency,
      risk,
      output,
    };
  });
}

function makeCommand(
  id: string,
  titleRu: string,
  t: ActionCommandType,
  owner: string,
  pri: number,
  status: ActionCommandStatus,
  firstStepRu: string,
  outcomeRu: string,
  deps: readonly string[],
  routeId: string,
  stageIdx: number,
): ActionCommand {
  return {
    id,
    titleRu,
    commandType: t,
    typeLabelRu: ACTION_COMMAND_TYPE_LABEL_RU[t],
    owner,
    priority: clamp(pri),
    status,
    statusLabelRu: ACTION_COMMAND_STATUS_RU[status],
    reasonRu: "Коллекция → исполнение: привязка к маршруту и стадиям.",
    firstStepRu,
    expectedOutcomeRu: outcomeRu,
    deadlineWindowRu: "Окно из Temporal / Orchestrator — не расширять без зелёного теста.",
    dependenciesRu: deps,
    riskIfIgnoredRu: riskForCommandType(t),
    linkedRouteId: routeId,
    linkedStageIndex: stageIdx,
  };
}

function buildCollectionCommands(
  entity: CollectionEntity,
  orch: ExecutionOrchestrationSnapshot,
  readiness: CollectionReadinessBreakdown,
  locale: "ru" | "en",
): ActionCommand[] {
  const routeId = orch.primaryRouteId;
  const heroN = entity.heroProducts.length;
  const sup = entity.skuClusters.find((c) => c.role === "support")?.count ?? 8;
  const printN = 6 + (entity.pulseSeed % 7);
  const dnaGate: ActionCommandStatus = readiness.collectionLaunchReadiness < 44 ? "blocked" : "new";

  return [
    makeCommand(
      `col-${entity.id}-dna`,
      pick(locale, { ru: "Проверить ДНК коллекции", en: "Verify collection DNA" }),
      "verify_brand_dna",
      "brand_dna",
      88,
      dnaGate,
      pick(locale, { ru: "Сверить запреты и плотность визуала с Brand DNA.", en: "Align forbiddens + visual density with Brand DNA." }),
      pick(locale, { ru: "Gate бренда без конфликта с капсулой.", en: "Brand gate without capsule conflict." }),
      [pick(locale, { ru: "Brand DNA", en: "Brand DNA" })],
      routeId,
      0,
    ),
    makeCommand(
      `col-${entity.id}-hero`,
      pick(locale, { ru: `Выбрать ${heroN} hero SKU`, en: `Select ${heroN} hero SKUs` }),
      "create_sku",
      "mission_control",
      86,
      "new",
      pick(locale, { ru: "Зафиксировать стили в одном коридоре.", en: "Lock styles inside one corridor." }),
      pick(locale, { ru: "Hero-якорь витрины.", en: "Shelf hero anchor." }),
      [pick(locale, { ru: "Коридор", en: "Corridor" }), entity.corridorId],
      routeId,
      2,
    ),
    makeCommand(
      `col-${entity.id}-sup`,
      pick(locale, { ru: `Подготовить ${sup} support SKU`, en: `Prepare ${sup} support SKUs` }),
      "create_sku",
      "mission_control",
      78,
      "waiting_dependency",
      pick(locale, { ru: "Только цвет/размер без новых принтов.", en: "Color/size only — no new prints." }),
      pick(locale, { ru: "Конверсия удерживается на hero.", en: "Conversion held on heroes." }),
      [pick(locale, { ru: "Hero готов", en: "Hero ready" })],
      routeId,
      3,
    ),
    makeCommand(
      `col-${entity.id}-print`,
      pick(locale, { ru: `Создать ${printN} print directions`, en: `Create ${printN} print directions` }),
      "prepare_print",
      "production",
      80,
      "new",
      pick(locale, { ru: "Один семейный мотив; слои DTF под очередь.", en: "One family motif; DTF layers vs queue." }),
      pick(locale, { ru: "Пакет файлов на DTF без перегруза.", en: "DTF file pack without overload." }),
      [pick(locale, { ru: "Print direction", en: "Print direction" })],
      routeId,
      4,
    ),
    makeCommand(
      `col-${entity.id}-vbrief`,
      pick(locale, { ru: "Собрать hero visual brief", en: "Assemble hero visual brief" }),
      "update_hero_visual",
      "visual",
      84,
      readiness.visualReadiness < 50 ? "blocked" : "new",
      pick(locale, { ru: "Муд + главное фото + запрещённые паттерны.", en: "Mood + main photo + forbidden patterns." }),
      pick(locale, { ru: "Согласованный hero-кадр на волну.", en: "Aligned hero shot for the wave." }),
      [pick(locale, { ru: "DNA", en: "DNA" })],
      routeId,
      5,
    ),
    makeCommand(
      `col-${entity.id}-seo`,
      pick(locale, { ru: "Сформировать SEO-кластер", en: "Form SEO cluster" }),
      "expand_seo",
      "seo",
      82,
      readiness.seoReadiness < 45 ? "blocked" : "new",
      pick(locale, { ru: "Primary + secondary; без drift.", en: "Primary + secondary; no drift." }),
      pick(locale, { ru: "Кластер заголовков на коридор.", en: "Title cluster for corridor." }),
      [pick(locale, { ru: "Hero визуал", en: "Hero visual" })],
      routeId,
      6,
    ),
    makeCommand(
      `col-${entity.id}-rich`,
      pick(locale, { ru: "Подготовить rich content", en: "Prepare rich content" }),
      "assemble_rich",
      "seo",
      72,
      "waiting_dependency",
      pick(locale, { ru: "Один CTA на волну.", en: "One CTA per wave." }),
      pick(locale, { ru: "Rich блок на кластер.", en: "Rich block for cluster." }),
      [pick(locale, { ru: "SEO кластер", en: "SEO cluster" })],
      routeId,
      7,
    ),
    makeCommand(
      `col-${entity.id}-test`,
      pick(locale, { ru: "Назначить test wave", en: "Assign test wave" }),
      "update_card",
      "command",
      79,
      "new",
      pick(locale, { ru: "Объём и склад из launch plan.", en: "Volume + stock from launch plan." }),
      pick(locale, { ru: "Метрики CTR/conv 48–72ч.", en: "CTR/conv metrics 48–72h." }),
      [pick(locale, { ru: "Production fit", en: "Production fit" })],
      routeId,
      8,
    ),
    makeCommand(
      `col-${entity.id}-fbo`,
      pick(locale, { ru: "Проверить FBO readiness", en: "Check FBO readiness" }),
      "prepare_fbo",
      "production",
      68,
      orch.resourcePressure.fboReadiness < 52 ? "blocked" : "waiting_dependency",
      pick(locale, { ru: "Только после зелёного теста и упаковки <55%.", en: "Only after green test + packaging <55%." }),
      pick(locale, { ru: "Список FBO SKU из кластера.", en: "FBO SKU list from cluster." }),
      [pick(locale, { ru: "Test wave", en: "Test wave" })],
      routeId,
      10,
    ),
    makeCommand(
      `col-${entity.id}-dtf`,
      pick(locale, { ru: "Оценить DTF pressure", en: "Assess DTF pressure" }),
      "check_production",
      "production",
      90,
      orch.resourcePressure.dtfQueue > 65 ? "blocked" : "new",
      pick(locale, { ru: "Сверить очередь и сложность принта.", en: "Match queue + print complexity." }),
      pick(locale, { ru: "Go/No-Go на волну.", en: "Go/No-Go for wave." }),
      [pick(locale, { ru: "Orchestrator", en: "Orchestrator" })],
      routeId,
      9,
    ),
  ];
}

function currentStageIndexFromReadiness(r: number): number {
  if (r >= 92) return 12;
  return clamp(Math.floor((100 - r) / 7.5), 0, 12);
}

function buildExecutionRouteObject(
  entity: CollectionEntity,
  orch: ExecutionOrchestrationSnapshot,
  readinessPct: number,
  currentIdx: number,
  locale: "ru" | "en",
): CollectionExecutionRoute {
  const primary = orch.routes.find((x) => x.id === orch.primaryRouteId) ?? orch.routes[0];
  const blockers = orch.blockers.map((b) => b.labelRu);
  const systems = primary?.systems.map(String) ?? orch.systemsInvolvedRu.slice();
  const stageKey = COLLECTION_PIPELINE_STAGES[currentIdx]?.messageKey ?? "collectionBuilder.stage.feedback";
  return {
    collectionId: entity.id,
    routeId: orch.primaryRouteId,
    readiness: readinessPct,
    currentStageIndex: currentIdx,
    currentStageKey: stageKey,
    nextAction:
      orch.nextBestActionRu ||
      primary?.nextActionRu ||
      pick(locale, { ru: "Синхронизировать с Mission Control.", en: "Sync in Mission Control." }),
    blockers,
    involvedSystems: [...systems],
    productionPressure: orch.resourcePressure.summaryRu,
    launchRisk: primary?.risksRu ?? entity.risk,
    expectedImpact: entity.expectedImpact,
    stopConditions: [...entity.stopConditions],
  };
}

export function buildCollectionExecutionPipeline(input: CollectionPipelineBuildInput): CollectionPipelineBundle {
  const { entity, orchestration, locale } = input;
  const readiness = computeReadiness(input);
  const currentIdx = currentStageIndexFromReadiness(readiness.collectionLaunchReadiness);
  const stages = buildPipelineStages(input, readiness, currentIdx, locale);
  const collectionCommands = buildCollectionCommands(entity, orchestration, readiness, locale);
  const structuredStops = buildStructuredStops(entity, input, readiness, locale);
  const visualWorkflow = buildVisualWorkflow(entity, locale);
  const seoWorkflow = buildSeoWorkflow(entity, locale);
  const productionWorkflow = buildProductionWorkflow(entity, orchestration, locale);
  const executionRoute = buildExecutionRouteObject(
    entity,
    orchestration,
    readiness.collectionLaunchReadiness,
    currentIdx,
    locale,
  );

  return {
    entity,
    readiness,
    executionRoute,
    stages,
    collectionCommands,
    orchestratorCommandLayer: orchestration.actionCommandLayer,
    structuredStops,
    visualWorkflow,
    seoWorkflow,
    productionWorkflow,
  };
}
