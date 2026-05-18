import type { CognitivePulseEvent } from "./types";

/** Каталог межмодульных импульсов (симуляция живой сети) */
export const COGNITIVE_PULSE_CATALOG: readonly CognitivePulseEvent[] = [
  {
    id: "trend-oversize-premium",
    source: "trends",
    titleRu: "Рост спроса: oversize premium",
    detailRu:
      "Тренд-радар: премиальный oversize-коридор ускоряется — командный центр, производство, SEO, визуал и кампании переводятся в синхронный ответ.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "command", "operations", "seo", "rich", "visual", "visualStrategy", "campaign", "analytics", "dna", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "trend-anime-sat",
    source: "trends",
    titleRu: "Насыщение anime luxury",
    detailRu: "Тренд-радар: рост плотности в премиальном коридоре; требуется согласование визуала и SEO.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "visual", "visualStrategy", "seo", "rich", "competitors", "analytics", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "analytics-ctr-still",
    source: "analytics",
    titleRu: "Спад CTR: cinematic still-life",
    detailRu: "Аналитика: ослабление отклика на статичные карточки; приоритет motion и перестройка героя.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "visual", "visualStrategy", "reels", "seo", "competitors", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "comp-price-hero",
    source: "competitors",
    titleRu: "Паритет цен на hero-SKU",
    detailRu: "Конкуренты: сближение ценовых якорей; контур производства и командный центр.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "operations", "command", "analytics", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "seo-semantic-shift",
    source: "seo",
    titleRu: "Семантический сдвиг",
    detailRu: "SEO: расширение кластера long-tail; rich content и память проекта получают новый маршрут.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "rich", "memory", "analytics", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "visual-brand-watch",
    source: "visual",
    titleRu: "Отклонение от cinematic noir",
    detailRu: "Визуальный контур: проверка Brand DNA; риск выхода за премиальный минимализм.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "visualStrategy", "dna", "rich", "reels", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "reels-motion-up",
    source: "reels",
    titleRu: "Приоритет motion-ритма",
    detailRu: "Reels: усиление динамики под давление CTR; синхронизация с SEO и rich.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "visual", "visualStrategy", "seo", "rich", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "ops-queue-pressure",
    source: "operations",
    titleRu: "Давление очереди производства",
    detailRu: "Операции: перегруз маршрута печати; стратегия и Mission Control — перераспределение.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "command", "analytics", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "command-strategic-window",
    source: "command",
    titleRu: "Окно роста: тактическое",
    detailRu: "Командный центр: зафиксировано окно; тренды и аналитика переводятся в приоритет.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "trends", "analytics", "campaign", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "memory-layer-sync",
    source: "memory",
    titleRu: "Слой памяти: синхронизация",
    detailRu: "Память проекта: обновление осколков для SEO и rich; снижение когнитивного дрейфа.",
    targets: ["missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "seo", "rich", "prompts", "promptComposer", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "dna-governor-tighten",
    source: "dna",
    titleRu: "Brand DNA: усиление надзора",
    detailRu: "Конституция бренда: временное ужесточение gate для визуала и кампаний.",
    targets: ["visual", "visualStrategy", "rich", "reels", "campaign", "missionControl", "strategicSimulation", "temporalStrategy", "executionPlanner", "executionOrchestrator", "signalFabric", "feedbackLoop", "brandEvolution", "executiveIntelligence", "organismModel"],
  },
  {
    id: "eic-executive-synthesis",
    source: "executiveIntelligence",
    titleRu: "Executive Intelligence: синтез режима",
    detailRu:
      "Центральный исполнительный слой зафиксировал режим, давление и директивы — Initiative Engine, оркестратор, командный слой и temporal получают согласованный импульс без расширения шума.",
    targets: [
      "missionControl",
      "strategicSimulation",
      "temporalStrategy",
      "executionPlanner",
      "executionOrchestrator",
      "signalFabric",
      "feedbackLoop",
      "brandEvolution",
      "command",
      "dna",
      "trends",
      "memory",
      "campaign",
      "organismModel",
    ],
  },
] as const;

export function randomPulseEvent(): CognitivePulseEvent {
  const i = Math.floor(Math.random() * COGNITIVE_PULSE_CATALOG.length);
  return COGNITIVE_PULSE_CATALOG[i]!;
}
