/** Operational orchestration layer — missions, stages, tasks, routing (not kanban). */

export type ExecutionState =
  | "queued"
  | "active"
  | "blocked"
  | "waiting"
  | "synchronized"
  | "completed"
  | "delayed"
  | "risk";

export type SystemOwner =
  | "trend_radar"
  | "visual_lab"
  | "seo_core"
  | "production_core"
  | "campaigns"
  | "marketplace_routing"
  | "brand_dna"
  | "mission_control"
  | "strategic_command";

export type MissionUrgency = "critical" | "high" | "standard" | "observe";

export type PlannerTask = {
  id: string;
  missionId: string;
  stageIndex: number;
  owner: SystemOwner;
  labelRu: string;
  state: ExecutionState;
  priority: number;
  dependsOn: readonly string[];
  effortScore: number;
  timelineRu: string;
  pressure: number;
};

export type MissionStage = {
  index: number;
  nameRu: string;
  state: ExecutionState;
  tasks: readonly PlannerTask[];
};

export type PlannerMission = {
  id: string;
  objectiveRu: string;
  reasonRu: string;
  urgency: MissionUrgency;
  expectedImpactRu: string;
  difficulty: number;
  timelineRu: string;
  systems: readonly SystemOwner[];
  dependenciesRu: string;
  risksRu: string;
  successRu: string;
  stages: readonly MissionStage[];
  adaptationsRu: readonly string[];
};

export type Bottleneck = {
  id: string;
  labelRu: string;
  severity: number;
  relatedSystem: SystemOwner;
};

export type SystemLoad = {
  system: SystemOwner;
  load: number;
  statusRu: string;
};

export type RoutingEdge = {
  from: SystemOwner;
  to: SystemOwner;
  intensity: number;
  labelRu: string;
};

export type ResourceAllocation = {
  productionPressure: number;
  contentLoad: number;
  seoBandwidth: number;
  skuComplexity: number;
  launchDensity: number;
  overloadRisk: number;
  redistributionRu: string;
};

export type LaunchQueueItem = {
  id: string;
  labelRu: string;
  windowRu: string;
  urgency: MissionUrgency;
};

export type ExecutionPlanSnapshot = {
  generatedAt: number;
  pulseGeneration: number;
  missions: readonly PlannerMission[];
  launchQueue: readonly LaunchQueueItem[];
  bottlenecks: readonly Bottleneck[];
  systemLoads: readonly SystemLoad[];
  routing: readonly RoutingEdge[];
  resourceAllocation: ResourceAllocation;
  sequencingNoteRu: string;
  upcomingLaunchesRu: readonly string[];
  integrationRu: readonly string[];
};

export const EXECUTION_STATE_RU: Record<ExecutionState, string> = {
  queued: "в очереди",
  active: "активно",
  blocked: "блокировка",
  waiting: "ожидание",
  synchronized: "синхронизировано",
  completed: "завершено",
  delayed: "задержка",
  risk: "риск",
};

export const SYSTEM_OWNER_RU: Record<SystemOwner, string> = {
  trend_radar: "Trend Radar",
  visual_lab: "Visual Lab",
  seo_core: "SEO Core",
  production_core: "Production Core",
  campaigns: "Кампании",
  marketplace_routing: "Маршрутизация маркетплейса",
  brand_dna: "Brand DNA",
  mission_control: "Mission Control",
  strategic_command: "Strategic Command",
};
