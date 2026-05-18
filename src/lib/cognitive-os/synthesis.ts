import type { NavId } from "../../types";
import type { CognitivePulseEvent, CognitiveSynthesisState, MarketRegime, ModuleCognitiveSnapshot } from "./types";

const MEMORY_ECHOES = [
  "Отпечаток: прошлый запуск удержал герой-CTR в премиальном коридоре",
  "Эхо давления: март — пик anime-кластера, контур запомнил смещение",
  "Архив стратегии: capsule-drop из 4 SKU сработал до насыщения выдачи",
  "Память SKU: hero-полоса WB — стабильная логика proof",
  "След тренда: oversize-коридор уже нагревался в прошлом окне",
  "Нить рынка: FBO-волатильность зафиксирована в памяти контура",
  "Ретроспектива: cinematic still-life давал пик вовлечения",
  "Слой смысла: Brand DNA удержал визуальный дрейф",
] as const;

const REGIME_BY_EVENT: Partial<Record<string, MarketRegime>> = {
  "trend-anime-sat": "saturation",
  "trend-oversize-premium": "opportunity",
  "analytics-ctr-still": "saturation",
  "comp-price-hero": "balanced",
  "seo-semantic-shift": "balanced",
  "visual-brand-watch": "saturation",
  "reels-motion-up": "opportunity",
  "ops-queue-pressure": "production_load",
  "command-strategic-window": "opportunity",
  "memory-layer-sync": "balanced",
  "dna-governor-tighten": "saturation",
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function avgMetric(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>, key: "pressure" | "confidence"): number {
  const vals = Object.values(modules)
    .map((m) => m?.[key])
    .filter((v): v is number => v != null);
  if (!vals.length) return key === "pressure" ? 42 : 65;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function reactionLineRu(ev: CognitivePulseEvent): string {
  const n = ev.targets.length;
  if (ev.source === "trends" && n >= 4) return "маршруты SEO, визуала и производства сдвинуты";
  if (ev.source === "operations" || ev.source === "operationsBrief")
    return "Mission Control и стратегия усилили контроль очереди";
  if (ev.source === "command") return "тренды и кампании получили приоритет окна";
  if (ev.source === "dna") return "визуал и кампании переведены под надзор конституции";
  if (ev.source === "analytics") return "ядро, Reels и SEO перенастроены под отклик";
  return `${n} контуров синхронизированы с импульсом`;
}

export function initialSynthesis(): CognitiveSynthesisState {
  return {
    regime: "balanced",
    topOpportunityRu: "Премиальный коридор — окно без перегрева",
    biggestRiskRu: "Дрейф CTR в статичных витринах",
    activeMissionRu: "Фоновая синхронизация каналов",
    pressureIndex: 44,
    launchReadiness: 62,
    dominantClusterRu: "Quiet luxury / archive",
    memoryEchoRu: MEMORY_ECHOES[0]!,
    causeEffectRu: null,
  };
}

function streamPatchForEvent(ev: CognitivePulseEvent): Partial<CognitiveSynthesisState> {
  switch (ev.id) {
    case "trend-oversize-premium":
      return {
        topOpportunityRu: "Oversize premium — растущий спрос, ранняя фаза",
        biggestRiskRu: "Сжатие маржи на mid-price якорях при расширении линейки",
        activeMissionRu: "Переразметка запуска и усиление семантики героя",
        dominantClusterRu: "Oversize / premium gift",
      };
    case "trend-anime-sat":
      return {
        topOpportunityRu: "Контроль доли в премиальном сегменте",
        biggestRiskRu: "Перегрев ниши anime luxury",
        activeMissionRu: "Согласование визуала, SEO и rich под давление выдачи",
        dominantClusterRu: "Anime luxury",
      };
    case "analytics-ctr-still":
      return {
        biggestRiskRu: "Усталость cinematic still-life в карточках",
        activeMissionRu: "Сдвиг приоритета на motion и герой-структуру",
        topOpportunityRu: "Reels и динамика — окно восстановления CTR",
      };
    case "ops-queue-pressure":
      return {
        biggestRiskRu: "Перегруз производственного маршрута",
        activeMissionRu: "Перераспределение очереди и тактический контроль",
        topOpportunityRu: "Стабилизация fulfillment после снятия пика",
      };
    case "command-strategic-window":
      return {
        topOpportunityRu: "Тактическое окно роста — зафиксировано командным центром",
        activeMissionRu: "Перевод трендов и аналитики в приоритет кампаний",
      };
    case "dna-governor-tighten":
      return {
        biggestRiskRu: "Риск отклонения от эмоционального языка бренда",
        activeMissionRu: "Brand DNA усилил gate для визуала и кампаний",
      };
    default:
      return {
        activeMissionRu: ev.titleRu,
      };
  }
}

export function applySynthesisAfterPulse(
  prev: CognitiveSynthesisState,
  ev: CognitivePulseEvent,
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  pulseGen: number,
): CognitiveSynthesisState {
  const patch = streamPatchForEvent(ev);
  const pressureIndex = Math.round(avgMetric(modules, "pressure"));
  const conf = avgMetric(modules, "confidence");
  const launchReadiness = Math.round(Math.min(96, Math.max(28, conf * 0.55 + (100 - pressureIndex) * 0.35)));

  let regime: MarketRegime = REGIME_BY_EVENT[ev.id] ?? "balanced";
  if (regime === "balanced") {
    if (pressureIndex >= 58) regime = pressureIndex >= 72 ? "production_load" : "saturation";
    else if (pressureIndex <= 38 && conf >= 72) regime = "opportunity";
  }

  const echoIdx = hashStr(`${ev.id}-${pulseGen}`) % MEMORY_ECHOES.length;
  const memoryEchoRu = MEMORY_ECHOES[echoIdx]!;

  return {
    ...prev,
    ...patch,
    regime,
    pressureIndex,
    launchReadiness,
    memoryEchoRu,
    causeEffectRu: `${ev.titleRu} → ${reactionLineRu(ev)}`,
  };
}

/** Узлы в viewBox 0–100: источник импульса → ядро → активный модуль */
export function signalNetworkAnchors(
  source: NavId,
  active: NavId,
  pulseGen: number,
): { sx: number; sy: number; cx: number; cy: number; tx: number; ty: number } {
  const sy = 18 + (hashStr(source) % 640) / 10;
  const ty = 18 + (hashStr(`${active}-${pulseGen}`) % 640) / 10;
  return {
    sx: 8,
    sy,
    cx: 48,
    cy: 50,
    tx: 92,
    ty,
  };
}

export function pickMemoryEchoByTick(tick: number): string {
  return MEMORY_ECHOES[Math.abs(tick) % MEMORY_ECHOES.length]!;
}
