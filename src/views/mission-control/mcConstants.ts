export type AgentPersona = "trend" | "profit" | "visual" | "seo" | "production" | "saturation" | "emotion" | "pressure";

export type CognitiveLayerId = "signal" | "pattern" | "strategy" | "execution" | "memory";

export const COGNITIVE_LAYER_CYCLE: readonly CognitiveLayerId[] = [
  "signal",
  "pattern",
  "strategy",
  "execution",
  "memory",
] as const;

export const COG_TELEMETRY_TAG: Record<CognitiveLayerId, string> = {
  signal: "SIG",
  pattern: "PAT",
  strategy: "STR",
  execution: "EXE",
  memory: "MEM",
};

export type MissionSystemMode =
  | "idle"
  | "trend-scan"
  | "competitor-analysis"
  | "seo-mapping"
  | "visual-synthesis"
  | "production-routing";

export const MODE_CYCLE: readonly MissionSystemMode[] = [
  "idle",
  "trend-scan",
  "competitor-analysis",
  "seo-mapping",
  "visual-synthesis",
  "production-routing",
] as const;

export const MODE_SIGNAL_POOLS: Record<Exclude<MissionSystemMode, "idle">, readonly string[]> = {
  "trend-scan": [
    "Всплеск anime luxury в премиальном сегменте",
    "Ускорение gift-вертикали на маркетплейсах",
    "Схождение микротрендов — восточный коридор",
    "Рост запросов по наследию craft",
    "Резонанс archive-эстетики усиливается",
    "Социальная скорость отражает подиум",
    "Quiet luxury — устойчивый дрейф",
    "Предвосхищение сезонной передачи",
  ],
  "competitor-analysis": [
    "Зафиксирована ценовая агрессия конкурентов",
    "Риск смещения CTR по ключевым связкам",
    "Аномалия плотности промо-кластеров",
    "Эрозия корзины на hero-SKU",
    "Совпадение отпечатка lookalike-витрин",
    "Расширение разрыва в delivery-нарративе",
    "Охлаждение skew отзывов",
    "Давление category captain на маржу",
  ],
  "seo-mapping": [
    "Расширение семантического кластера",
    "Пересечение поисковых интентов",
    "Стабилизация long-tail решётки",
    "Усиление entity-graph",
    "Низкая волатильность сниппетов",
    "Мягкий контроль каннибализации",
    "Номинальный drift схемы",
    "Сдвиг занятости SERP-фич",
  ],
  "visual-synthesis": [
    "Cinematic fatigue — расширение конверта",
    "Рост визуального насыщения выдачи",
    "Предупреждение: сходимость палитр",
    "Плотность motion выше комфортного порога",
    "Still-life: контраст в оптимуме",
    "Баланс глубины texture-stack",
    "Luxury grain — подпись устойчива",
    "Негативное пространство «дышит»",
  ],
  "production-routing": [
    "Давление очереди DTF",
    "Предупреждение: рассинхрон FBO",
    "Стабильная пропускная способность раскроя",
    "Дисперсия смеси чернил в норме",
    "Латентность передачи press-lane",
    "Каденция QC-выборки удерживается",
    "Сужение fulfillment-окна",
    "Удлинение цикла vendor proof",
  ],
};

export const IDLE_SIGNALS = [
  "Базовый контур когниции стабилен",
  "Междоменные буферы в номинале",
  "Сигнальная решётка: низкая активность",
  "Патрулирование hero-SKU без отклонений",
  "Нейронная нагрузка сбалансирована",
] as const;

export const MODE_CORE_LABEL: Record<MissionSystemMode, string> = {
  idle: "БАЗОВЫЙ КОНТУР",
  "trend-scan": "СКАН ТРЕНДОВ",
  "competitor-analysis": "АНАЛИЗ КОНКУРЕНТОВ",
  "seo-mapping": "SEO-КАРТИРОВАНИЕ",
  "visual-synthesis": "ВИЗУАЛЬНЫЙ СИНТЕЗ",
  "production-routing": "МАРШРУТИЗАЦИЯ ПРОИЗВОДСТВА",
};

export const MODE_MISSION_LINE: Record<MissionSystemMode, string> = {
  idle: "Фоновая синхронизация каналов; переход по расписанию без открытой миссии",
  "trend-scan": "Разбор премиальных oversize-кластеров и давления ниши",
  "competitor-analysis": "Картирование смещения CTR и ценовых фронтов",
  "seo-mapping": "Индексация семантической решётки против спроса на hero",
  "visual-synthesis": "Скан cinematic-насыщения и дрейфа still-life",
  "production-routing": "Оптимизация luxury gift и полос fulfillment",
};

export type SignalRow = { id: string; text: string };

export function initialSignalRows(mode: MissionSystemMode): SignalRow[] {
  const pool = mode === "idle" ? [...IDLE_SIGNALS] : [...MODE_SIGNAL_POOLS[mode]];
  return Array.from({ length: 5 }, (_, i) => ({
    id: `row-${mode}-init-${i}`,
    text: pool[i % pool.length],
  }));
}

export function pickSignalSwap(pool: readonly string[], current: string): string {
  const others = pool.filter((t) => t !== current);
  return others.length ? others[Math.floor(Math.random() * others.length)] : pool[0];
}

export type ThoughtBlock = {
  detected: string;
  confidence?: number;
  recommendation?: string;
  risk?: string;
  action?: string;
};

export const MODE_AGENT_REASON_CHAIN: Record<MissionSystemMode, readonly number[]> = {
  idle: [0, 5, 6, 1],
  "trend-scan": [0, 6, 1, 4],
  "competitor-analysis": [1, 6, 0, 7],
  "seo-mapping": [3, 6, 2, 1],
  "visual-synthesis": [2, 6, 5, 7],
  "production-routing": [4, 7, 1, 6],
};

export const THOUGHT_BY_MODE: Record<MissionSystemMode, readonly ThoughtBlock[]> = {
  idle: [
    {
      detected: "Решётка спокойна — острых разломов выдачи не зафиксировано",
      confidence: 58,
      recommendation: "Удерживать распределённый надзор за hero-SKU и циклами proof",
      risk: "Слепое пятно сезонной передачи при внезапном всплеске скорости тренда",
    },
    {
      detected: "Межканальная волатильность в номинальной полосе",
      confidence: 64,
      recommendation: "Предзагрузить осколки памяти под следующее окно миссии",
      risk: "Эхо oversize-остатков при сдвиге спроса до переиндексации",
    },
  ],
  "trend-scan": [
    {
      detected: "Рост cinematic oversize-кластера в премиальном коридоре",
      confidence: 84,
      recommendation: "Запустить capsule-drop из 4 SKU до насыщения выдачи",
      risk: "Перегрев premium-сегмента через 19 дней",
    },
    {
      detected: "Резонанс quiet luxury в archive-эстетике",
      confidence: 76,
      recommendation: "Расширить семантический захват по наследию craft",
      risk: "Пересечение gift-сегмента сожмёт маржу на mid-price якорях",
    },
  ],
  "competitor-analysis": [
    {
      detected: "Рост конкуренции в anime luxury нише",
      risk: "CTR-фрагментация при паритете визуала",
      action: "Усилить cinematic-noir направление",
    },
    {
      detected: "Кластер ценовой агрессии на WB hero-вертикалях",
      confidence: 79,
      recommendation: "Сжать эмоциональный CTR-нарратив до следующего промо-каденса",
      risk: "Эрозия корзины, если смещение опередит обновление креатива",
    },
  ],
  "seo-mapping": [
    {
      detected: "Расширение семантического кластера на long-tail luxury-модификаторы",
      confidence: 74,
      recommendation: "Зафиксировать усиление entity-graph до сдвига SERP-фич",
      risk: "Каннибализация при пересечении hero-страниц на смежных интентах",
    },
    {
      detected: "Пересечение интентов oversize + gift",
      confidence: 68,
      recommendation: "Стадировать execution на три варианта лендинга",
      risk: "Волатильность сниппетов при drift схемы > 48 ч",
    },
  ],
  "visual-synthesis": [
    {
      detected: "Снижение эмоционального отклика на static-visual",
      confidence: 71,
      recommendation: "Сместить акцент в motion-first карточки",
    },
    {
      detected: "Расширение конверта cinematic fatigue на флагманских still-life",
      confidence: 77,
      recommendation: "Подмешать grain-структуры из институциональной памяти Q4",
      risk: "Визуальное насыщение при превышении плотности motion",
    },
  ],
  "production-routing": [
    {
      detected: "Давление очереди DTF с skew синхронизации FBO",
      confidence: 81,
      recommendation: "Перераспределить полосы производственного контура до bottleneck раскроя",
      risk: "Сужение fulfillment-окна при удлинении proof > 12%",
    },
    {
      detected: "Латентность передачи press-lane на luxury gift bundles",
      confidence: 73,
      recommendation: "Ввести в планирование приоритеты высокомаржинальных ниш из памяти",
      risk: "Просадка эффективности склада при десинхроне поведенческих окон WB/Ozon",
    },
  ],
};

export function modePrimaryPersona(mode: MissionSystemMode): AgentPersona | null {
  switch (mode) {
    case "trend-scan":
      return "trend";
    case "competitor-analysis":
      return "profit";
    case "seo-mapping":
      return "seo";
    case "visual-synthesis":
      return "visual";
    case "production-routing":
      return "production";
    default:
      return null;
  }
}

export type AgentTier = "dormant" | "low" | "medium" | "high";

export function agentTier(persona: AgentPersona, mode: MissionSystemMode): AgentTier {
  if (mode === "idle") {
    if (persona === "profit" || persona === "trend") return "medium";
    if (persona === "saturation" || persona === "pressure") return "low";
    return "low";
  }
  const map: Record<MissionSystemMode, Record<AgentPersona, AgentTier>> = {
    idle: {
      trend: "medium",
      profit: "medium",
      visual: "low",
      seo: "low",
      production: "low",
      saturation: "low",
      emotion: "low",
      pressure: "low",
    },
    "trend-scan": {
      trend: "high",
      profit: "low",
      visual: "low",
      seo: "low",
      production: "dormant",
      saturation: "high",
      emotion: "medium",
      pressure: "medium",
    },
    "competitor-analysis": {
      trend: "medium",
      profit: "high",
      visual: "low",
      seo: "medium",
      production: "low",
      saturation: "medium",
      emotion: "high",
      pressure: "high",
    },
    "seo-mapping": {
      trend: "low",
      profit: "medium",
      visual: "low",
      seo: "high",
      production: "low",
      saturation: "low",
      emotion: "medium",
      pressure: "low",
    },
    "visual-synthesis": {
      trend: "low",
      profit: "low",
      visual: "high",
      seo: "low",
      production: "low",
      saturation: "high",
      emotion: "high",
      pressure: "low",
    },
    "production-routing": {
      trend: "dormant",
      profit: "high",
      visual: "low",
      seo: "low",
      production: "high",
      saturation: "medium",
      emotion: "low",
      pressure: "high",
    },
  };
  return map[mode][persona];
}

export type AgentMotion = {
  pulseSec: number;
  floatSec: number;
  tickSec: number;
  breatheSec: number;
  flickerSec: number;
  flashSec: number;
  driftSec: number;
  fieldOpacity: number;
  cardOpacity: number;
  useSeoPulse: boolean;
  hazeMul: number;
};

const PERSONA_BASE: Record<
  AgentPersona,
  Omit<AgentMotion, "pulseSec" | "floatSec" | "tickSec" | "breatheSec" | "flickerSec" | "flashSec" | "driftSec">
> = {
  trend: { fieldOpacity: 0.52, cardOpacity: 1, useSeoPulse: false, hazeMul: 1 },
  profit: { fieldOpacity: 0.62, cardOpacity: 1, useSeoPulse: false, hazeMul: 1 },
  visual: { fieldOpacity: 0.52, cardOpacity: 1, useSeoPulse: false, hazeMul: 1 },
  seo: { fieldOpacity: 0.52, cardOpacity: 1, useSeoPulse: true, hazeMul: 1 },
  production: { fieldOpacity: 0.48, cardOpacity: 1, useSeoPulse: false, hazeMul: 1 },
  saturation: { fieldOpacity: 0.5, cardOpacity: 1, useSeoPulse: false, hazeMul: 1.02 },
  emotion: { fieldOpacity: 0.54, cardOpacity: 1, useSeoPulse: false, hazeMul: 1 },
  pressure: { fieldOpacity: 0.48, cardOpacity: 1, useSeoPulse: false, hazeMul: 0.98 },
};

const BASE_DURATIONS: Record<AgentPersona, Pick<AgentMotion, "pulseSec" | "floatSec" | "tickSec" | "breatheSec" | "flickerSec" | "flashSec" | "driftSec">> = {
  trend: { pulseSec: 5.2, floatSec: 24, tickSec: 4.8, breatheSec: 11, flickerSec: 6.8, flashSec: 19, driftSec: 32 },
  profit: { pulseSec: 22, floatSec: 52, tickSec: 19, breatheSec: 26, flickerSec: 14, flashSec: 31, driftSec: 48 },
  visual: { pulseSec: 16, floatSec: 42, tickSec: 11, breatheSec: 18, flickerSec: 12.5, flashSec: 26, driftSec: 56 },
  seo: { pulseSec: 17, floatSec: 30, tickSec: 6.5, breatheSec: 16, flickerSec: 9.2, flashSec: 24, driftSec: 44 },
  production: { pulseSec: 26, floatSec: 58, tickSec: 21, breatheSec: 28, flickerSec: 15, flashSec: 34, driftSec: 52 },
  saturation: { pulseSec: 14, floatSec: 38, tickSec: 5.2, breatheSec: 15, flickerSec: 7.5, flashSec: 21, driftSec: 36 },
  emotion: { pulseSec: 12, floatSec: 34, tickSec: 4.2, breatheSec: 13, flickerSec: 6.2, flashSec: 17, driftSec: 40 },
  pressure: { pulseSec: 20, floatSec: 48, tickSec: 16, breatheSec: 24, flickerSec: 13, flashSec: 29, driftSec: 50 },
};

const TIER_MUL: Record<AgentTier, number> = {
  high: 0.78,
  medium: 1,
  low: 1.28,
  dormant: 1.62,
};

export function agentMotion(persona: AgentPersona, mode: MissionSystemMode, isPrimary: boolean): AgentMotion {
  const tier = agentTier(persona, mode);
  const m = TIER_MUL[tier];
  const b = BASE_DURATIONS[persona];
  const base = PERSONA_BASE[persona];
  const fieldTone = tier === "dormant" ? 0.82 : tier === "low" ? 0.9 : tier === "medium" ? 1 : 1.05;
  const hazeTone =
    persona === "visual"
      ? mode === "visual-synthesis"
        ? 1.12
        : mode === "idle"
          ? 0.95
          : 0.88
      : persona === "saturation"
        ? mode === "visual-synthesis" || mode === "trend-scan"
          ? 1.08
          : 0.94
        : persona === "emotion"
          ? mode === "competitor-analysis" || mode === "visual-synthesis"
            ? 1.08
            : 0.95
          : persona === "pressure"
            ? mode === "competitor-analysis" || mode === "production-routing"
              ? 1.06
              : 0.96
            : 1;
  const primaryPulseMul = isPrimary && mode !== "idle" ? 0.86 : 1;
  return {
    pulseSec: Math.round(b.pulseSec * m * primaryPulseMul * 10) / 10,
    floatSec: Math.round(b.floatSec * m * 10) / 10,
    tickSec: Math.round(b.tickSec * m * 10) / 10,
    breatheSec: Math.round(b.breatheSec * m * 10) / 10,
    flickerSec: Math.round(b.flickerSec * m * 10) / 10,
    flashSec: Math.round(b.flashSec * m * 10) / 10,
    driftSec: Math.round(b.driftSec * m * 10) / 10,
    fieldOpacity: Math.min(
      0.72,
      Math.max(0.28, base.fieldOpacity * fieldTone * (tier === "dormant" ? 0.75 : 1) * (isPrimary && mode !== "idle" ? 1.08 : 1)),
    ),
    cardOpacity: tier === "dormant" ? 0.88 : tier === "low" ? 0.94 : 1,
    useSeoPulse: base.useSeoPulse,
    hazeMul: base.hazeMul * hazeTone,
  };
}

export const AGENTS: readonly {
  name: string;
  persona: AgentPersona;
  glyph: string;
  rgb: string;
  glow: string;
}[] = [
  { name: "Охотник Трендов", persona: "trend", glyph: "Т", rgb: "118 108 178", glow: "rgba(95, 88, 155, 0.26)" },
  { name: "Узел Маржинальности", persona: "profit", glyph: "М", rgb: "188 158 108", glow: "rgba(155, 128, 82, 0.22)" },
  { name: "Визуальный Архитектор", persona: "visual", glyph: "В", rgb: "108 132 178", glow: "rgba(82, 108, 148, 0.24)" },
  { name: "SEO-Ядро", persona: "seo", glyph: "S", rgb: "92 168 182", glow: "rgba(72, 145, 158, 0.22)" },
  { name: "Производственный Контур", persona: "production", glyph: "П", rgb: "148 122 92", glow: "rgba(118, 98, 72, 0.2)" },
  { name: "Сканер Перегрева", persona: "saturation", glyph: "Н", rgb: "168 118 142", glow: "rgba(138, 95, 118, 0.22)" },
  { name: "Эмоциональный CTR-Узел", persona: "emotion", glyph: "E", rgb: "178 128 118", glow: "rgba(148, 98, 88, 0.22)" },
  { name: "Контур Давления Рынка", persona: "pressure", glyph: "Д", rgb: "118 128 148", glow: "rgba(88, 102, 128, 0.22)" },
];

export function agentCognitionPercent(tier: AgentTier): number {
  switch (tier) {
    case "high":
      return 94;
    case "medium":
      return 72;
    case "low":
      return 48;
    default:
      return 28;
  }
}

export function agentStateLabel(tier: AgentTier, isPrimary: boolean): string {
  if (isPrimary) return "АКТИВ";
  if (tier === "high") return "ПЕРЕГРУЗ";
  if (tier === "medium") return "НАБЛЮДЕНИЕ";
  if (tier === "low") return "МАРШРУТ";
  return "ОЖИДАНИЕ";
}

export type WarfarePressure = {
  trendAcceleration: number;
  ctrFatigue: number;
  oversaturationRisk: number;
  animeClusterPressure: number;
  premiumOpportunity: number;
  fboInstability: number;
  dtfOverload: number;
  engagementDecline: number;
};

export const WARFARE_ROW_META: readonly { key: keyof WarfarePressure; label: string }[] = [
  { key: "trendAcceleration", label: "Ускорение тренда" },
  { key: "ctrFatigue", label: "Усталость CTR" },
  { key: "oversaturationRisk", label: "Риск перенасыщения" },
  { key: "animeClusterPressure", label: "Давление anime-кластера" },
  { key: "premiumOpportunity", label: "Окно premium" },
  { key: "fboInstability", label: "Нестабильность FBO" },
  { key: "dtfOverload", label: "Перегруз DTF" },
  { key: "engagementDecline", label: "Спад вовлечения" },
];

export function initialWarfarePressure(): WarfarePressure {
  return {
    trendAcceleration: 52,
    ctrFatigue: 38,
    oversaturationRisk: 46,
    animeClusterPressure: 44,
    premiumOpportunity: 41,
    fboInstability: 36,
    dtfOverload: 49,
    engagementDecline: 33,
  };
}

/** 0…1 — суммарное рыночное давление для ядра и ударных волн */
export function computeMarketStress(p: WarfarePressure): number {
  const w =
    p.dtfOverload * 0.22 +
    p.fboInstability * 0.2 +
    p.oversaturationRisk * 0.18 +
    p.engagementDecline * 0.16 +
    p.ctrFatigue * 0.14 +
    (100 - p.premiumOpportunity) * 0.1;
  return Math.min(1, Math.max(0, w / 100));
}

export type AgentConsciousnessVisual = "active" | "analyzing" | "overloaded" | "syncing" | "predicting";

export function agentConsciousnessVisual(
  persona: AgentPersona,
  mode: MissionSystemMode,
  isPrimary: boolean,
  tier: AgentTier,
): AgentConsciousnessVisual {
  if (isPrimary && mode !== "idle") return "syncing";
  if (tier === "high") return "overloaded";
  if (tier === "dormant") return "analyzing";
  if (
    (persona === "trend" && mode === "trend-scan") ||
    (persona === "profit" && mode === "competitor-analysis") ||
    (persona === "visual" && mode === "visual-synthesis") ||
    (persona === "seo" && mode === "seo-mapping")
  )
    return "predicting";
  return "active";
}

export const CONSCIOUSNESS_LABEL_RU: Record<AgentConsciousnessVisual, string> = {
  active: "СТАБИЛЬНО",
  analyzing: "СКАН",
  overloaded: "ПЕРЕГРУЗ",
  syncing: "СИНХР",
  predicting: "ПРОГНОЗ",
};

/** Классы сигналов на маршрутах: рынок / исполнение / риск / креатив / критика */
export type SignalTransportKind = "intel" | "execution" | "risk" | "creative" | "critical";

export function routeSignalKinds(persona: AgentPersona, tier: AgentTier): readonly SignalTransportKind[] {
  const critical: SignalTransportKind = "critical";
  const base: SignalTransportKind[] =
    persona === "trend" || persona === "pressure"
      ? ["intel", "execution"]
      : persona === "visual"
        ? ["creative", "execution"]
        : persona === "saturation" || persona === "emotion"
          ? ["risk", "intel"]
          : persona === "production"
            ? ["execution", "risk"]
            : persona === "seo"
              ? ["execution", "intel"]
              : ["execution", "intel"];
  return tier === "high" ? [...base, critical] : base;
}

export function modePhysics(mode: MissionSystemMode) {
  const streamMul = mode === "idle" ? 0.94 : 1.06;
  const particleMul = mode === "idle" ? 1.04 : mode === "trend-scan" ? 0.88 : mode === "competitor-analysis" ? 0.92 : mode === "seo-mapping" ? 0.95 : mode === "visual-synthesis" ? 0.98 : 0.9;
  const routeActive = mode !== "idle";
  const baseLane = 0.38 * streamMul;
  const laneLeftOpacity = baseLane * (routeActive ? 1.16 : 0.93);
  const laneRightOpacity = baseLane * (routeActive ? 1.1 : 0.9);
  const lanePanelOpacity = baseLane * (routeActive ? 1.12 : 0.92);
  const laneParticleLeftMul = particleMul * (routeActive ? 0.93 : 1.02);
  const laneParticleRightMul = particleMul * (routeActive ? 0.96 : 1.02);
  const laneParticlePanelMul = particleMul * (routeActive ? 0.95 : 1.02);
  const orbitSec =
    mode === "idle"
      ? 132
      : mode === "trend-scan"
        ? 96
        : mode === "competitor-analysis"
          ? 118
          : mode === "seo-mapping"
            ? 108
            : mode === "visual-synthesis"
              ? 124
              : 104;
  const waveEarlySec =
    mode === "idle" ? 26 : mode === "trend-scan" ? 18 : mode === "competitor-analysis" ? 20 : mode === "seo-mapping" ? 19 : mode === "visual-synthesis" ? 24 : 22;
  const waveLateSec = waveEarlySec + 6;
  const waveLate2Sec = waveEarlySec + 12;
  const trailOpacity = mode === "competitor-analysis" ? 0.18 : mode === "idle" ? 0.12 : 0.15;
  const structureSpeedMul = mode === "competitor-analysis" ? 1.12 : mode === "seo-mapping" ? 1.08 : mode === "production-routing" ? 0.92 : 1;
  const fogBlurPx = mode === "competitor-analysis" ? 30 : mode === "visual-synthesis" ? 32 : 28;
  const volCool = mode === "competitor-analysis" ? 0.94 : 1;
  const innermistBlur = mode === "visual-synthesis" ? 10 : 8;
  const magneticDurSec = mode === "production-routing" ? 88 : 110;
  const atmos = {
    hazeOpacity: mode === "competitor-analysis" ? 0.72 : mode === "visual-synthesis" ? 0.8 : 0.75,
    volumetricOpacity: mode === "competitor-analysis" ? 0.82 : 0.88,
    particlesOpacity: mode === "idle" ? 0.034 : mode === "trend-scan" ? 0.042 : 0.038,
    dustOpacity: mode === "production-routing" ? 0.048 : 0.055,
    middepthOpacity: mode === "seo-mapping" ? 0.58 : 0.55,
    bloomOpacityMul: mode === "visual-synthesis" ? 1.06 : mode === "competitor-analysis" ? 0.92 : 1,
    roomSpillOpacity: mode === "trend-scan" ? 0.9 : mode === "production-routing" ? 0.82 : 0.85,
    roomVolOpacity: mode === "seo-mapping" ? 0.58 : 0.55,
    fgMotesOpacity: mode === "trend-scan" ? 0.052 : 0.055,
    depthMidOpacity: mode === "visual-synthesis" ? 0.4 : 0.38,
    particleSpeedMul: mode === "trend-scan" ? 1.08 : 1,
  };
  return {
    streamMul,
    particleMul,
    laneLeftOpacity,
    laneRightOpacity,
    lanePanelOpacity,
    laneParticleLeftMul,
    laneParticleRightMul,
    laneParticlePanelMul,
    orbitSec,
    waveEarlySec,
    waveLateSec,
    waveLate2Sec,
    trailOpacity,
    structureSpeedMul,
    fogBlurPx,
    volCool,
    innermistBlur,
    magneticDurSec,
    atmos,
  };
}

export const SYNAPSE_PATHS = [
  "M 17 24 Q 36 22 52 46",
  "M 17 36 Q 38 34 52 46",
  "M 17 48 Q 40 48 52 46",
  "M 17 60 Q 38 58 52 46",
  "M 17 72 Q 34 68 52 46",
] as const;

export const SIGNAL_SYNAPSE_PATHS = [
  "M 84 24 Q 68 30 52 46",
  "M 84 36 Q 70 36 52 46",
  "M 84 48 Q 72 48 52 46",
  "M 84 60 Q 70 58 52 46",
  "M 84 72 Q 66 66 52 46",
] as const;

export const PANEL_SYNAPSE_PATHS = [
  "M 14 42 Q 34 40 52 46",
  "M 14 54 Q 34 52 52 46",
  "M 86 40 Q 70 44 52 46",
  "M 86 58 Q 70 52 52 46",
] as const;

export const NEURAL_MESH_PATHS = [
  "M 23 20 Q 27 26 23 32",
  "M 23 36 Q 29 42 23 48",
  "M 23 52 Q 26 58 23 64",
  "M 23 68 Q 30 74 23 80",
] as const;

export const MESH_DURATIONS_BASE = [92, 104, 88, 112] as const;
export const SIGNAL_DURATIONS_BASE = [46, 52, 41, 48, 44] as const;
export const SIGNAL_RIGHT_DURATIONS_BASE = [54, 49, 58, 51, 47] as const;
export const PANEL_MOTION_BASE = [62, 68, 74, 80] as const;

/** Пути от колонки узлов к центру когнитивного поля (viewBox 0 0 100 100, ядро ≈ 50,50) */
export function buildCoreFeedPaths(agentCount: number): string[] {
  const paths: string[] = [];
  for (let i = 0; i < agentCount; i++) {
    const y = 6 + (i + 0.5) * (88 / agentCount);
    paths.push(`M 11 ${y} C 30 ${y}, 38 50, 50 50`);
  }
  return paths;
}

export const AGENT_REASON_SLOT_COUNT = 8;

export function buildAgentReasonPaths(chain: readonly number[]): { primary: string; ghost: string } {
  const y = (slot: number) => 3 + (slot + 0.5) * (94 / AGENT_REASON_SLOT_COUNT);
  const primary: string[] = [];
  const ghost: string[] = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i]!;
    const b = chain[i + 1]!;
    const y0 = y(a);
    const y1 = y(b);
    primary.push(`M 80 ${y0} C 46 ${y0}, 46 ${y1}, 80 ${y1}`);
    ghost.push(`M 20 ${y0} C 54 ${y0}, 54 ${y1}, 20 ${y1}`);
  }
  return { primary: primary.join(" "), ghost: ghost.join(" ") };
}

export const AGENT_TASK_LINE: Record<AgentPersona, string> = {
  trend: "Сверка кластеров и скорости сдвига",
  profit: "Контур маржи и ценовых фронтов",
  visual: "Контроль cinematic-насыщения креатива",
  seo: "Сшивка интентов и entity-graph",
  production: "Очереди DTF / FBO и полосы выхода",
  saturation: "Порог перенасыщения и дифференциация",
  emotion: "Эмоциональный CTR и отклик карточки",
  pressure: "Давление каналов и баланс спроса",
};

/** Метрики правой панели, усиливаемые при наведении на узел */
export const AGENT_MARKET_KEYS: Record<AgentPersona, readonly (keyof WarfarePressure)[]> = {
  trend: ["trendAcceleration", "animeClusterPressure"],
  profit: ["premiumOpportunity", "ctrFatigue"],
  visual: ["engagementDecline", "oversaturationRisk"],
  seo: ["ctrFatigue", "oversaturationRisk"],
  production: ["dtfOverload", "fboInstability"],
  saturation: ["oversaturationRisk", "engagementDecline"],
  emotion: ["engagementDecline", "ctrFatigue"],
  pressure: ["trendAcceleration", "fboInstability"],
};
