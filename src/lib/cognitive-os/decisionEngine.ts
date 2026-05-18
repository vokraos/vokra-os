import type { NavId } from "../../types";
import type {
  CognitivePulseEvent,
  CognitiveSynthesisState,
  DecisionEngineState,
  LaunchOrchestration,
  MarketRegime,
  ModuleCognitiveSnapshot,
  StrategicRankVector,
} from "./types";
import { clamp } from "../math";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function avgPressure(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>): number {
  const vals = Object.values(modules)
    .map((m) => m?.pressure)
    .filter((v): v is number => v != null);
  if (!vals.length) return 44;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function deriveRank(evId: string, regime: MarketRegime, pulseGen: number): StrategicRankVector {
  const h = hashStr(`${evId}-${regime}-${pulseGen}`);
  const jitter = (offset: number) =>
    clamp(52 + ((h >> offset) & 31) - 15 + (regime === "opportunity" ? 6 : regime === "saturation" ? -4 : 0));

  return {
    strategic: jitter(0),
    executionDifficulty: clamp(100 - jitter(2)),
    marginPotential: jitter(4),
    saturationRisk: regime === "saturation" ? clamp(jitter(6) + 12) : jitter(6),
    speedPotential: jitter(8),
    brandFit: jitter(10),
    seoLeverage: jitter(12),
    productionFit: regime === "production_load" ? clamp(jitter(14) - 14) : jitter(14),
  };
}

function defaultLaunch(regime: MarketRegime, cluster: string): LaunchOrchestration {
  if (regime === "production_load") {
    return {
      archetypeRu: "Быстрый DTF-тест героя",
      reasoningRu: "Снять пик очереди без расширения SKU-матрицы: валидировать отклик до FBO.",
      timingRu: "Окно 7–10 дней до следующего промо-каденса маркетплейса.",
      resourceLoadRu: "Низкая загрузка proof; средняя по печати.",
      expectedImpactRu: "Стабилизация fulfillment и сигнал для SEO без перегруза.",
      risksRu: "Перегрев визуала при слабом контроле Brand DNA.",
    };
  }
  return {
    archetypeRu: "Премиум-капсула (лимитированная)",
    reasoningRu: `Кластер «${cluster}» даёт плотность спроса при умеренной конкуренции в премиальном коридоре.`,
    timingRu: "Ускорение сезона ещё не закрыло окно first-mover.",
    resourceLoadRu: "Совместимость с текущей полосой производства — высокая.",
    expectedImpactRu: "Рост маржинальной доли при контролируемом охвате.",
    risksRu: "Сжатие маржи на mid-price якорях при параллельном промо.",
  };
}

function executiveMemoryLine(evId: string): string {
  if (evId.includes("trend") || evId.includes("oversize"))
    return "Память контура: oversize-капсулы ранее удерживали герой-CTR до насыщения выдачи.";
  if (evId.includes("analytics") || evId.includes("ctr"))
    return "Память контура: cinematic still-life уже входил в фазу усталости — motion давал отскок.";
  if (evId.includes("ops") || evId.includes("queue"))
    return "Память контура: пики DTF коррелировали с промо-окнами WB без расширения FBO.";
  if (evId.includes("dna"))
    return "Память контура: ужесточение gate снижало dilution визуала в кампаниях.";
  return "Память контура: сильные запуски фиксировались в слое проекта и влияют на текущий скоринг.";
}

export function initialDecisionEngine(): DecisionEngineState {
  const rank = deriveRank("init", "balanced", 0);
  return {
    priorityHeadlineRu: "Удержание премиального коридора без распыления",
    priorityDensityRu: "Плотность возможности выше в gift / archive-связке",
    priorityAccelerateRu: "Рассмотреть ускорение proof по hero-SKU при стабильном QC",
    riskSaturationProb: 38,
    riskCtrFatigue: 34,
    riskProductionOverload: 28,
    riskBrandDilution: 22,
    riskPricingPressure: 36,
    resourceProductionRu: "Полоса печати: номинал; FBO — резерв",
    resourceSkuRu: "Масштаб: hero + 2 спутника в premium gift",
    resourceMarketingRu: "Энергия: SEO long-tail + rich narrative",
    timingWindowRu: "Окно запуска: 14–21 день до сезонного ускорения",
    timingSeasonalRu: "Сезон: раннее ускорение gift-вертикали",
    timingMomentumRu: "Импульс кластера: умеренный положительный",
    timingMarketplaceRu: "Маркетплейс: зафиксировать героя до промо-перекрытия",
    executiveReasoningRu:
      "Контур уравновешен: давление и уверенность в допустимой полосе. Рекомендуется не открывать параллельные крупные запуски до стабилизации CTR на статичных карточках; приоритет — точечная капсула и усиление семантики героя.",
    opportunityLabelRu: "Quiet luxury / archive — удержание доли",
    rank,
    launch: defaultLaunch("balanced", "Quiet luxury / archive"),
    executiveMemoryRu: executiveMemoryLine("init"),
  };
}

export function applyDecisionEngineAfterPulse(
  ev: CognitivePulseEvent,
  synthesis: CognitiveSynthesisState,
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  pulseGen: number,
): DecisionEngineState {
  const p = avgPressure(modules);
  const regime = synthesis.regime;
  const cluster = synthesis.dominantClusterRu;
  const rank = deriveRank(ev.id, regime, pulseGen);

  const riskSaturationProb = clamp(Math.round(32 + (regime === "saturation" ? 22 : 0) + p * 0.12));
  const riskCtrFatigue = clamp(Math.round(28 + (ev.id.includes("ctr") ? 24 : 0) + p * 0.08));
  const riskProductionOverload = clamp(Math.round(26 + (regime === "production_load" ? 28 : 0) + p * 0.1));
  const riskBrandDilution = clamp(Math.round(20 + (ev.id.includes("dna") || ev.id.includes("brand") ? 18 : 0)));
  const riskPricingPressure = clamp(Math.round(30 + (ev.id.includes("price") ? 20 : 0) + p * 0.06));

  let priorityHeadlineRu = synthesis.topOpportunityRu;
  let priorityDensityRu = `Плотность в «${cluster}» относительно остальных коридоров — выше среднего.`;
  let priorityAccelerateRu = "Ускорить proof и согласование героя при стабильном сигнале Brand DNA.";
  let executiveReasoningRu =
    `${synthesis.activeMissionRu} Контур оценивает вероятность ответа рынка как выше базовой при текущей нагрузке (${Math.round(p)}%). ` +
    `Риски CTR и насыщения не выводят решение в стоп-зону; рекомендуется действовать точечно, без расширения матрицы до подтверждения первой волны.`;
  let opportunityLabelRu = cluster;
  let launch: LaunchOrchestration = defaultLaunch(regime, cluster);

  if (ev.id === "trend-oversize-premium") {
    priorityHeadlineRu = "Oversize premium — ранний захват спроса";
    priorityDensityRu = "Плотность возможности максимальна в премиальном oversize; конкуренция визуала ниже порога насыщения.";
    priorityAccelerateRu = "Ускорить лимитированную капсулу и герой-семантику до закрытия сезонного окна.";
    executiveReasoningRu =
      "Премиальный oversize-коридор показывает рост эмоционального вовлечения при относительно низкой плотности премиального визуального конкурента и нарастающем motion-импульсе в выдаче. " +
      "Рекомендуемый ответ: запустить лимитированную oversize-капсулу до того, как сезонное ускорение сузит first-mover окно; параллельно усилить SEO-связку героя и не расширять mid-price якоря, чтобы защитить маржу.";
    opportunityLabelRu = "Oversize premium — first-mover";
    launch = {
      archetypeRu: "Лимитированная oversize-капсула",
      reasoningRu:
        "Спрос и визуальный импульс согласованы; Brand DNA допускает cinematic-минимализм в рамках конституции.",
      timingRu: "12–18 дней до пика сезонного ускорения; раньше — выше вероятность удержания героя.",
      resourceLoadRu: "Средняя загрузка производства; DTF приоритетен для proof, FBO — на вторую волну.",
      expectedImpactRu: "Рост маржинальной доли и укрепление героя в SERP без размытия линейки.",
      risksRu: "Сжатие маржи на mid-price; перегрев ниши при промо конкурентов.",
    };
  }

  if (ev.id === "trend-anime-sat") {
    priorityHeadlineRu = "Контроль насыщения anime luxury";
    priorityDensityRu = "Плотность риска выше плотности новой возможности — сместить фокус на дифференциацию.";
    priorityAccelerateRu = "Не ускорять массовый запуск; точечные SKU и жёсткий визуальный контраст.";
    executiveReasoningRu =
      "Ниша anime luxury входит в фазу насыщения: визуальная сходимость выдачи снижает отклик на «ещё один» премиальный drop. Контур рекомендует отказаться от широкого охвата в пользу узкой капсулы с noir-подписью и проверкой Brand DNA до масштабирования.";
    opportunityLabelRu = "Anime luxury — фаза риска";
    launch = {
      archetypeRu: "Точечный collaboration / микро-drop",
      reasoningRu: "Снизить вероятность dilution: малый объём, высокий контроль визуала.",
      timingRu: "Отложить крупный сезонный drop до охлаждения кластера.",
      resourceLoadRu: "Низкая загрузка; приоритет контроля, не объёма.",
      expectedImpactRu: "Защита маржи и бренда вместо гонки охвата.",
      risksRu: "Параллельные промо конкурентов усилят CTR-фрагментацию.",
    };
  }

  if (ev.id === "analytics-ctr-still") {
    priorityHeadlineRu = "Восстановление отклика на витрине";
    priorityDensityRu = "Плотность проблемы в статичных карточках; motion-коридор даёт положительный дифференциал.";
    priorityAccelerateRu = "Ускорить motion-ритм в Reels и перестройку героя в SEO.";
    executiveReasoningRu =
      "Cinematic still-life кластер показывает усталость отклика: пользовательская модель внимания смещается к динамике. Рекомендация: не наращивать статичные A/B, а перевести часть бюджета proof в короткий motion-контур и обновить семантическую опору героя до следующего промо-окна.";
    opportunityLabelRu = "Motion / hero rebuild";
    launch = {
      archetypeRu: "Быстрый motion-proof + SEO-герой",
      reasoningRu: "Синхронизация Reels, визуала и SEO снижает стоимость восстановления CTR.",
      timingRu: "5–9 дней для первой волны измерений.",
      resourceLoadRu: "Средняя; производство — лёгкие носители, без FBO-скейла.",
      expectedImpactRu: "Локальный рост CTR и снижение fatigue на витрине.",
      risksRu: "Перегруз motion без контроля Brand DNA.",
    };
  }

  if (ev.id === "ops-queue-pressure") {
    priorityHeadlineRu = "Декомпрессия производственного контура";
    priorityDensityRu = "Плотность риска в очереди печати выше допустимой для параллельных запусков.";
    priorityAccelerateRu = "Перенести часть SKU на отложенное окно; согласовать с Command Center.";
    executiveReasoningRu =
      "Очередь производства давит на выполнение кампаний: параллельный запуск увеличит вероятность срыва proof и FBO-инстабильность. Контур рекомендует явно отклонить второй крупный вход в очередь и перераспределить ресурс на DTF-тест героя с минимальной матрицей.";
    opportunityLabelRu = "Стабилизация очереди";
    launch = defaultLaunch("production_load", cluster);
  }

  if (ev.id === "dna-governor-tighten") {
    executiveReasoningRu =
      "Brand DNA фиксирует отклонение от эмоционального минимализма: дальнейшее масштабирование визуала без gate увеличит dilution. Рекомендация: временно отклонить агрессивные креативные расширения и пройти повторное согласование палитры и negative space до следующего launch.";
    priorityAccelerateRu = "Приостановить масштабирование до повторного gate.";
    launch = {
      archetypeRu: "Пауза масштаба / микро-валидация",
      reasoningRu: "Сохранить когерентность бренда важнее краткосрочного охвата.",
      timingRu: "1 цикл согласования Brand DNA.",
      resourceLoadRu: "Низкая производственная нагрузка; высокая дисциплина proof.",
      expectedImpactRu: "Снижение риска dilution и защита премиальной подписи.",
      risksRu: "Замедление выхода на маркетплейс при жёстком окне конкурентов.",
    };
  }

  return {
    priorityHeadlineRu,
    priorityDensityRu,
    priorityAccelerateRu,
    riskSaturationProb,
    riskCtrFatigue,
    riskProductionOverload,
    riskBrandDilution,
    riskPricingPressure,
    resourceProductionRu:
      regime === "production_load"
        ? "Сдвиг: приоритет коротких полос DTF; FBO — только подтверждённые SKU"
        : "Полоса печати: сместить мощность на капсульные партии героя",
    resourceSkuRu:
      regime === "opportunity"
        ? "Масштаб: hero + капсула 3–5 SKU в премиальном коридоре"
        : "Масштаб: удержать матрицу; не расширять без proof",
    resourceMarketingRu:
      synthesis.pressureIndex > 55
        ? "Энергия: сместить на Retention / rich depth вместо верхнего воронка-шума"
        : "Энергия: SEO entity + rich narrative под герой",
    timingWindowRu: synthesis.launchReadiness > 70 ? "Окно: допускается ускорение запуска" : "Окно: удержать текущий каденс",
    timingSeasonalRu: regime === "opportunity" ? "Сезон: раннее ускорение — использовать" : "Сезон: без форсирования",
    timingMomentumRu:
      regime === "saturation" ? "Импульс кластера: охлаждение — не гнать охват" : "Импульс кластера: контролируемый рост",
    timingMarketplaceRu: "Маркетплейс: синхронизировать героя с промо-календарём конкурентов",
    executiveReasoningRu,
    opportunityLabelRu,
    rank,
    launch,
    executiveMemoryRu: executiveMemoryLine(ev.id),
  };
}
