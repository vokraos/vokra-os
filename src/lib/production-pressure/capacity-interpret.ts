import type {
  CapacityInterpretState,
  CapacityLoadMetricId,
  CapacityInterpretation,
  CapacityMetricComparison,
  ProductionCapacityProfile,
  ProductionLoadSnapshot,
  ResolvedCapacitySnapshot,
} from "./capacity-types";

type MetricDef = {
  id: CapacityLoadMetricId;
  labelKey: string;
  current: (load: ProductionLoadSnapshot) => number;
  safe: (p: ProductionCapacityProfile) => number;
  max: (p: ProductionCapacityProfile) => number;
};

const METRICS: MetricDef[] = [
  {
    id: "activeLaunches",
    labelKey: "prod.capacity.metric.activeLaunches",
    current: (l) => l.activeLaunches,
    safe: (p) => p.safeConcurrentLaunches,
    max: (p) => p.maxConcurrentLaunches,
  },
  {
    id: "refreshTasks",
    labelKey: "prod.capacity.metric.refreshTasks",
    current: (l) => l.refreshTasks,
    safe: (p) => p.safeDailyRefreshes,
    max: (p) => p.maxDailyRefreshes,
  },
  {
    id: "fboPrepTasks",
    labelKey: "prod.capacity.metric.fboPrepTasks",
    current: (l) => l.fboPrepTasks,
    safe: (p) => p.safeFboPrepTasks,
    max: (p) => p.maxFboPrepTasks,
  },
  {
    id: "visualJobs",
    labelKey: "prod.capacity.metric.visualJobs",
    current: (l) => l.visualJobs,
    safe: (p) => p.safeVisualJobs,
    max: (p) => p.maxVisualJobs,
  },
  {
    id: "cardJobs",
    labelKey: "prod.capacity.metric.cardJobs",
    current: (l) => l.cardJobs,
    safe: (p) => p.safeCardJobs,
    max: (p) => p.maxCardJobs,
  },
  {
    id: "packagingLoad",
    labelKey: "prod.capacity.metric.packagingLoad",
    current: (l) => l.packagingLoad,
    safe: (p) => p.safePackagingLoad,
    max: (p) => p.maxPackagingLoad,
  },
  {
    id: "blockedTasks",
    labelKey: "prod.capacity.metric.blockedTasks",
    current: (l) => l.blockedTasks,
    safe: (p) => p.safeBlockedTasks,
    max: (p) => p.maxBlockedTasks,
  },
];

export function interpretMetricValue(
  current: number,
  safe: number,
  max: number,
): CapacityInterpretState {
  if (current <= safe) return "stable";
  if (current >= max) return "overloaded";
  return "pressured";
}

function usagePercent(current: number, max: number): number | null {
  if (max <= 0) return null;
  return Math.min(999, Math.round((current / max) * 100));
}

function rankState(s: CapacityInterpretState): number {
  if (s === "overloaded") return 3;
  if (s === "pressured") return 2;
  if (s === "stable") return 1;
  return 0;
}

function baseForMetric(
  resolved: ResolvedCapacitySnapshot | null,
  metricId: CapacityLoadMetricId,
): { baseSafe: number | null; baseMax: number | null } {
  const lim = resolved?.limits.find((l) => l.metricId === metricId);
  if (!lim) return { baseSafe: null, baseMax: null };
  return { baseSafe: lim.baseSafe, baseMax: lim.baseMax };
}

export function interpretCapacityLoad(
  load: ProductionLoadSnapshot,
  profile: ProductionCapacityProfile | null,
  resolved: ResolvedCapacitySnapshot | null = null,
): CapacityInterpretation {
  if (!profile) {
    return {
      profileId: null,
      profileName: null,
      shiftScenarioId: null,
      shiftScenarioName: null,
      shiftScenarioType: null,
      hasProfile: false,
      structuralOnly: true,
      overallState: "unknown",
      comparisons: METRICS.map((m) => ({
        metricId: m.id,
        labelKey: m.labelKey,
        current: m.current(load),
        safe: null,
        max: null,
        baseSafe: null,
        baseMax: null,
        state: "unknown" as const,
        usagePercent: null,
        summaryKey: "prod.capacity.summary.noProfile",
        summaryVars: { current: String(m.current(load)), metric: m.id },
      })),
      breachMetricId: null,
      resolvedCapacity: null,
    };
  }

  const comparisons: CapacityMetricComparison[] = METRICS.map((m) => {
    const current = m.current(load);
    const safe = m.safe(profile);
    const max = m.max(profile);
    const state = interpretMetricValue(current, safe, max);
    const pct = usagePercent(current, max);
    const { baseSafe, baseMax } = baseForMetric(resolved, m.id);
    let summaryKey = "prod.capacity.summary.stable";
    if (state === "pressured") summaryKey = "prod.capacity.summary.pressured";
    if (state === "overloaded") summaryKey = "prod.capacity.summary.overloaded";
    return {
      metricId: m.id,
      labelKey: m.labelKey,
      current,
      safe,
      max,
      baseSafe,
      baseMax,
      state,
      usagePercent: pct,
      summaryKey,
      summaryVars: {
        current: String(current),
        safe: String(safe),
        max: String(max),
        baseSafe: baseSafe !== null ? String(baseSafe) : "—",
        baseMax: baseMax !== null ? String(baseMax) : "—",
        pct: pct !== null ? String(pct) : "—",
      },
    };
  });

  const sorted = [...comparisons].sort((a, b) => rankState(b.state) - rankState(a.state));
  const breach = sorted.find((c) => c.state === "overloaded" || c.state === "pressured") ?? null;
  const overallState = sorted[0]?.state ?? "stable";

  return {
    profileId: profile.id,
    profileName: profile.name,
    shiftScenarioId: resolved?.scenarioId ?? null,
    shiftScenarioName: resolved?.scenarioName ?? null,
    shiftScenarioType: resolved?.scenarioType ?? null,
    hasProfile: true,
    structuralOnly: false,
    overallState: overallState === "unknown" ? "stable" : overallState,
    comparisons,
    breachMetricId: breach?.metricId ?? null,
    resolvedCapacity: resolved,
  };
}

export function pickCapacityBreachComparison(
  capacity: CapacityInterpretation | null,
): CapacityMetricComparison | null {
  if (!capacity?.hasProfile) return null;
  const overloaded = capacity.comparisons.find((c) => c.state === "overloaded");
  if (overloaded) return overloaded;
  return capacity.comparisons.find((c) => c.state === "pressured") ?? null;
}
