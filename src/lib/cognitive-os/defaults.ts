import type { NavId } from "../../types";
import type { ModuleCognitiveSnapshot } from "./types";

export function defaultSnapshot(): ModuleCognitiveSnapshot {
  return {
    activity: "steady",
    signalHealth: 72,
    sync: "synced",
    pressure: 38,
    confidence: 64,
    incomingRu: null,
    outgoingRu: null,
    brandGate: "ok",
  };
}

/** Начальное состояние сети по ключевым модулям */
export function initialModules(): Partial<Record<NavId, ModuleCognitiveSnapshot>> {
  const m: Partial<Record<NavId, ModuleCognitiveSnapshot>> = {};
  const ids: NavId[] = [
    "missionControl",
    "executiveIntelligence",
    "organismModel",
    "strategicSimulation",
    "temporalStrategy",
    "executionPlanner",
    "executionOrchestrator",
    "signalFabric",
    "feedbackLoop",
    "command",
    "operations",
    "operationsBrief",
    "seo",
    "rich",
    "reels",
    "dna",
    "brandEvolution",
    "visual",
    "visualStrategy",
    "competitors",
    "trends",
    "analytics",
    "memory",
    "executiveMemory",
    "strategyEvolution",
    "campaign",
    "prompts",
    "promptComposer",
    "promptPack",
    "visualProduction",
    "visualAssets",
    "cardProduction",
    "marketplaceOperations",
    "skuIntelligence",
    "competitiveMap",
    "ingestionReadiness",
    "dataImport",
    "entityFusion",
    "dataCleanup",
    "assortmentActions",
    "collectionBuilder",
    "dashboard",
    "settings",
  ];
  for (const id of ids) {
    const s = defaultSnapshot();
    if (id === "missionControl") {
      s.activity = "priority";
      s.confidence = 78;
      s.pressure = 44;
    }
    if (id === "executiveIntelligence") {
      s.activity = "priority";
      s.confidence = 90;
      s.pressure = 30;
      s.signalHealth = 88;
      s.sync = "synced";
    }
    if (id === "organismModel") {
      s.activity = "sync";
      s.confidence = 87;
      s.pressure = 34;
      s.signalHealth = 85;
      s.sync = "synced";
      s.incomingRu = "Слой физиологии компании: health, stress, energy, resilience.";
      s.outgoingRu = "Кормит Mission Control и Executive Intelligence общим stability narrative.";
    }
    if (id === "strategicSimulation") {
      s.activity = "sync";
      s.confidence = 86;
      s.pressure = 36;
      s.signalHealth = 80;
    }
    if (id === "temporalStrategy") {
      s.activity = "steady";
      s.confidence = 84;
      s.pressure = 34;
      s.signalHealth = 78;
    }
    if (id === "executionPlanner") {
      s.activity = "active";
      s.confidence = 82;
      s.pressure = 46;
      s.signalHealth = 76;
      s.sync = "synced";
    }
    if (id === "executionOrchestrator") {
      s.activity = "sync";
      s.confidence = 85;
      s.pressure = 42;
      s.signalHealth = 78;
      s.sync = "synced";
    }
    if (id === "signalFabric") {
      s.activity = "sync";
      s.confidence = 84;
      s.pressure = 40;
      s.signalHealth = 80;
    }
    if (id === "feedbackLoop") {
      s.activity = "sync";
      s.confidence = 81;
      s.pressure = 36;
      s.signalHealth = 86;
      s.sync = "synced";
    }
    if (id === "dna") {
      s.activity = "sync";
      s.brandGate = "ok";
      s.confidence = 88;
    }
    if (id === "brandEvolution") {
      s.activity = "steady";
      s.confidence = 86;
      s.pressure = 32;
      s.signalHealth = 84;
      s.sync = "synced";
    }
    if (id === "executiveMemory") {
      s.activity = "steady";
      s.confidence = 83;
      s.pressure = 26;
      s.signalHealth = 80;
      s.sync = "synced";
      s.incomingRu = "Стратегическая память организма: эпохи, паттерны, drift.";
      s.outgoingRu = "Кормит live cognition и executive strip микро-сдвигами.";
    }
    if (id === "strategyEvolution") {
      s.activity = "steady";
      s.confidence = 82;
      s.pressure = 28;
      s.signalHealth = 82;
      s.sync = "synced";
      s.incomingRu = "Самоэволюция стратегии: веса, петли обучения, траектории зрелости.";
      s.outgoingRu = "Тонкая калибровка инициатив, симуляции и исполнения по накопленной истории.";
    }
    if (id === "trends") {
      s.pressure = 52;
    }
    if (id === "ingestionReadiness") {
      s.activity = "steady";
      s.sync = "drift";
      s.confidence = 71;
      s.pressure = 48;
      s.signalHealth = 74;
      s.incomingRu = "Контур синхронизации: каналы, нормализация, fusion — без внешних API.";
      s.outgoingRu = "Единый язык сигналов для карточек, витрины и производства.";
    }
    if (id === "dataImport") {
      s.activity = "steady";
      s.sync = "catchup";
      s.confidence = 69;
      s.pressure = 44;
      s.signalHealth = 73;
      s.incomingRu = "Импорт CSV/Excel: тип отчёта, маппинг колонок, предпросмотр — без загрузки файлов.";
      s.outgoingRu = "Кормит SKU, карточки и ingestion после появления локального парсера.";
    }
    if (id === "entityFusion") {
      s.activity = "sync";
      s.sync = "drift";
      s.confidence = 70;
      s.pressure = 46;
      s.signalHealth = 72;
      s.incomingRu = "Слияние импорта с сущностями: матчи, конфликты, стратегическое воздействие — без merge в прод.";
      s.outgoingRu = "Готовит entity-core и операционный контур к согласованным обновлениям SKU/волн.";
    }
    if (id === "dataCleanup") {
      s.activity = "active";
      s.sync = "catchup";
      s.confidence = 72;
      s.pressure = 42;
      s.signalHealth = 74;
      s.incomingRu = "Очистка импортированных SKU/карточек: эвристики, пакетные правки, новый снимок без API.";
      s.outgoingRu = "Кормит SKU Intelligence, операции и миссию обновлённым локальным слоем сущностей.";
    }
    if (id === "assortmentActions") {
      s.activity = "priority";
      s.sync = "synced";
      s.confidence = 76;
      s.pressure = 40;
      s.signalHealth = 78;
      s.incomingRu = "Списки действий по ассортименту: фиксы, рост, риски, FBO, коллекции — экспорт без API.";
      s.outgoingRu = "Кормит операции, коллекции и визуальный контур приоритетами из импорта.";
    }
    if (id === "competitiveMap") {
      s.activity = "steady";
      s.sync = "synced";
      s.confidence = 74;
      s.pressure = 36;
      s.signalHealth = 80;
      s.incomingRu = "Кластеры поиска и коридоры конкуренции из локального импорта — без live API и парсинга витрины.";
      s.outgoingRu = "Связывает SKU Intelligence, операции, Prompt Pack и визуальный контур через структурное давление.";
    }
    m[id] = s;
  }
  return m;
}
