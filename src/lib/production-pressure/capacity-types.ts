export type CapacityLoadMetricId =
  | "activeLaunches"
  | "refreshTasks"
  | "fboPrepTasks"
  | "visualJobs"
  | "cardJobs"
  | "packagingLoad"
  | "blockedTasks";

export type ShiftScenarioType =
  | "small_shift"
  | "normal_shift"
  | "strong_shift"
  | "weekend_catchup"
  | "launch_day"
  | "fbo_prep_day"
  | "visual_content_day";

export type MetricMultiplier = { safe: number; max: number };

export type CapacityMultipliers = Partial<Record<CapacityLoadMetricId, MetricMultiplier>>;

export type CapacityLimitOverrides = Partial<
  Record<CapacityLoadMetricId, { safe?: number; max?: number }>
>;

export type ProductionShiftScenario = {
  id: string;
  name: string;
  active: boolean;
  baseCapacityProfileId: string | null;
  scenarioType: ShiftScenarioType;
  teamSize: number | null;
  printerCount: number | null;
  pressOperators: number | null;
  packers: number | null;
  extraHelpers: number;
  shiftHours: number | null;
  capacityMultipliers: CapacityMultipliers;
  safeOverrides: CapacityLimitOverrides;
  maxOverrides: CapacityLimitOverrides;
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type ShiftScenariosState = {
  scenarios: ProductionShiftScenario[];
  activeScenarioId: string | null;
};

export type ResolvedMetricLimit = {
  metricId: CapacityLoadMetricId;
  labelKey: string;
  baseSafe: number;
  baseMax: number;
  resolvedSafe: number;
  resolvedMax: number;
};

export type ResolvedCapacitySnapshot = {
  profileId: string | null;
  profileName: string | null;
  scenarioId: string | null;
  scenarioName: string | null;
  scenarioType: ShiftScenarioType | null;
  limits: ResolvedMetricLimit[];
};

export type CapacityInterpretState = "stable" | "pressured" | "overloaded" | "unknown";

export type ProductionCapacityProfile = {
  id: string;
  name: string;
  active: boolean;
  teamSize: number;
  printersAvailable: number;
  pressOperators: number;
  packers: number;
  shiftHours: number;
  safeConcurrentLaunches: number;
  maxConcurrentLaunches: number;
  safeDailyRefreshes: number;
  maxDailyRefreshes: number;
  safeFboPrepTasks: number;
  maxFboPrepTasks: number;
  safeVisualJobs: number;
  maxVisualJobs: number;
  safeCardJobs: number;
  maxCardJobs: number;
  safePackagingLoad: number;
  maxPackagingLoad: number;
  safeBlockedTasks: number;
  maxBlockedTasks: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type ProductionLoadSnapshot = {
  id: string;
  createdAt: number;
  activeLaunches: number;
  refreshTasks: number;
  fboPrepTasks: number;
  visualJobs: number;
  cardJobs: number;
  packagingLoad: number;
  blockedTasks: number;
  sourceNotes: string[];
};

export type CapacityMetricComparison = {
  metricId: CapacityLoadMetricId;
  labelKey: string;
  current: number;
  safe: number | null;
  max: number | null;
  baseSafe: number | null;
  baseMax: number | null;
  state: CapacityInterpretState;
  /** Labeled capacity usage % — only when profile limits exist. */
  usagePercent: number | null;
  summaryKey: string;
  summaryVars: Record<string, string>;
};

export type CapacityInterpretation = {
  profileId: string | null;
  profileName: string | null;
  shiftScenarioId: string | null;
  shiftScenarioName: string | null;
  shiftScenarioType: ShiftScenarioType | null;
  hasProfile: boolean;
  structuralOnly: boolean;
  overallState: CapacityInterpretState;
  comparisons: CapacityMetricComparison[];
  breachMetricId: CapacityLoadMetricId | null;
  resolvedCapacity: ResolvedCapacitySnapshot | null;
};

export type CapacityProfilesState = {
  profiles: ProductionCapacityProfile[];
  activeProfileId: string | null;
};
