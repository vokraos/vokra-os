/**
 * Execution Orchestrator — launch routes, sequences, dependency logic, resource pressure.
 * Russian-first labels for UI; technical terms (SEO, FBO, DTF, SKU) allowed.
 */

export type RouteState =
  | "waiting"
  | "active"
  | "blocked"
  | "synchronized"
  | "production_ready"
  | "scaling"
  | "paused"
  | "completed"
  | "exhausted";

export const ROUTE_STATE_RU: Record<RouteState, string> = {
  waiting: "ожидает",
  active: "активно",
  blocked: "заблокировано",
  synchronized: "синхронизировано",
  production_ready: "готово к производству",
  scaling: "масштабирование",
  paused: "пауза",
  completed: "завершено",
  exhausted: "исчерпано",
};

export type ExecutionRouteKind =
  | "premium_capsule"
  | "fast_dtf_test"
  | "seo_reinforcement"
  | "visual_refresh"
  | "fbo_scale"
  | "production_stabilization"
  | "brand_correction";

export type OrchestratorSystem =
  | "trend_radar"
  | "signal_fabric"
  | "strategic_simulation"
  | "temporal_strategy"
  | "initiative_engine"
  | "brand_dna"
  | "production"
  | "seo"
  | "visual"
  | "campaign"
  | "mission_control"
  | "command"
  | "memory";

export type ExecutionTask = {
  id: string;
  labelRu: string;
  owner: OrchestratorSystem;
  state: RouteState;
  effortScore: number;
  pressure: number;
  confidence: number;
  dependsOnTaskIds: readonly string[];
};

export type ExecutionStage = {
  index: number;
  nameRu: string;
  status: RouteState;
  owner: OrchestratorSystem;
  dependencyRu: string;
  estimatedEffort: number;
  pressure: number;
  confidence: number;
  tasks: readonly ExecutionTask[];
};

export type LaunchSequence = {
  routeId: string;
  titleRu: string;
  stages: readonly ExecutionStage[];
};

export type ExecutionRoute = {
  id: string;
  kind: ExecutionRouteKind;
  titleRu: string;
  objectiveRu: string;
  reasonRu: string;
  urgency: "critical" | "high" | "standard" | "observe";
  expectedImpactRu: string;
  confidence: number;
  routeState: RouteState;
  systems: readonly OrchestratorSystem[];
  risksRu: string;
  blockersRu: readonly string[];
  nextActionRu: string;
  sequence: LaunchSequence;
};

export const ROUTE_URGENCY_RU: Record<ExecutionRoute["urgency"], string> = {
  critical: "критично",
  high: "высокая",
  standard: "стандарт",
  observe: "наблюдение",
};

export type DependencyEdge = {
  id: string;
  fromRu: string;
  toRu: string;
  conditionRu: string;
};

export type DependencyGraph = {
  summaryRu: string;
  edges: readonly DependencyEdge[];
};

export type ResourcePressure = {
  dtfQueue: number;
  packagingBottleneck: number;
  contentLoad: number;
  skuComplexity: number;
  seoBandwidth: number;
  campaignPressure: number;
  fboReadiness: number;
  summaryRu: string;
};

export type Blocker = {
  id: string;
  labelRu: string;
  severity: number;
  affectsRouteIds: readonly string[];
};

export type ExecutionOrchestrationSnapshot = {
  generatedAt: number;
  pulseGeneration: number;
  routes: readonly ExecutionRoute[];
  /** Primary route for main sequence UI */
  primaryRouteId: string;
  dependencyGraph: DependencyGraph;
  resourcePressure: ResourcePressure;
  blockers: readonly Blocker[];
  nextBestActionRu: string;
  executionConfidence: number;
  operationalDrag: number;
  systemsInvolvedRu: readonly string[];
  integrationRu: readonly string[];
  actionCommandLayer: import("../action-command/types").ActionCommandLayerSnapshot;
};

export const ROUTE_KIND_LABEL_RU: Record<ExecutionRouteKind, string> = {
  premium_capsule: "Премиальная капсула",
  fast_dtf_test: "Быстрый DTF-тест",
  seo_reinforcement: "Усиление SEO",
  visual_refresh: "Обновление визуала",
  fbo_scale: "Масштаб FBO",
  production_stabilization: "Стабилизация производства",
  brand_correction: "Коррекция бренда",
};

export const SYSTEM_LABEL_RU: Record<OrchestratorSystem, string> = {
  trend_radar: "Trend Radar",
  signal_fabric: "Сигнальная сеть",
  strategic_simulation: "Стратегическая симуляция",
  temporal_strategy: "Temporal Strategy",
  initiative_engine: "Initiative Engine",
  brand_dna: "Brand DNA",
  production: "Производство / DTF",
  seo: "SEO",
  visual: "Visual Intelligence",
  campaign: "Кампании / Reels",
  mission_control: "Mission Control",
  command: "Strategic Command",
  memory: "Память проектов",
};
