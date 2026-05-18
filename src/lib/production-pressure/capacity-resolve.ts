import type {
  CapacityLoadMetricId,
  CapacityMultipliers,
  ProductionCapacityProfile,
  ProductionShiftScenario,
  ResolvedCapacitySnapshot,
  ResolvedMetricLimit,
} from "./capacity-types";
import { presetMultipliersForType } from "./scenario-presets";

type MetricKeys = {
  safe: keyof ProductionCapacityProfile;
  max: keyof ProductionCapacityProfile;
  labelKey: string;
};

const METRIC_KEYS: Record<CapacityLoadMetricId, MetricKeys> = {
  activeLaunches: {
    safe: "safeConcurrentLaunches",
    max: "maxConcurrentLaunches",
    labelKey: "prod.capacity.metric.activeLaunches",
  },
  refreshTasks: {
    safe: "safeDailyRefreshes",
    max: "maxDailyRefreshes",
    labelKey: "prod.capacity.metric.refreshTasks",
  },
  fboPrepTasks: {
    safe: "safeFboPrepTasks",
    max: "maxFboPrepTasks",
    labelKey: "prod.capacity.metric.fboPrepTasks",
  },
  visualJobs: {
    safe: "safeVisualJobs",
    max: "maxVisualJobs",
    labelKey: "prod.capacity.metric.visualJobs",
  },
  cardJobs: {
    safe: "safeCardJobs",
    max: "maxCardJobs",
    labelKey: "prod.capacity.metric.cardJobs",
  },
  packagingLoad: {
    safe: "safePackagingLoad",
    max: "maxPackagingLoad",
    labelKey: "prod.capacity.metric.packagingLoad",
  },
  blockedTasks: {
    safe: "safeBlockedTasks",
    max: "maxBlockedTasks",
    labelKey: "prod.capacity.metric.blockedTasks",
  },
};

function clampNonNeg(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function mergeMultipliers(
  type: ProductionShiftScenario["scenarioType"],
  custom: CapacityMultipliers,
): CapacityMultipliers {
  const preset = presetMultipliersForType(type);
  const out: CapacityMultipliers = { ...preset };
  for (const id of Object.keys(custom) as CapacityLoadMetricId[]) {
    const c = custom[id];
    const p = preset[id];
    if (c && p) {
      out[id] = { safe: c.safe ?? p.safe, max: c.max ?? p.max };
    } else if (c) {
      out[id] = c;
    }
  }
  return out;
}

function resolveLimit(
  baseSafe: number,
  baseMax: number,
  mult: { safe: number; max: number },
  safeOverride?: number,
  maxOverride?: number,
): { resolvedSafe: number; resolvedMax: number } {
  let resolvedSafe =
    safeOverride !== undefined ? clampNonNeg(safeOverride) : clampNonNeg(baseSafe * mult.safe);
  let resolvedMax =
    maxOverride !== undefined ? clampNonNeg(maxOverride) : clampNonNeg(baseMax * mult.max);
  resolvedMax = Math.max(resolvedSafe, resolvedMax);
  return { resolvedSafe, resolvedMax };
}

export function resolveCapacitySnapshot(
  profile: ProductionCapacityProfile | null,
  scenario: ProductionShiftScenario | null,
): ResolvedCapacitySnapshot | null {
  if (!profile) return null;

  const multipliers = scenario
    ? mergeMultipliers(scenario.scenarioType, scenario.capacityMultipliers)
    : presetMultipliersForType("normal_shift");

  const limits: ResolvedMetricLimit[] = (Object.keys(METRIC_KEYS) as CapacityLoadMetricId[]).map(
    (metricId) => {
      const keys = METRIC_KEYS[metricId];
      const baseSafe = profile[keys.safe] as number;
      const baseMax = profile[keys.max] as number;
      const mult = multipliers[metricId] ?? { safe: 1, max: 1 };
      const safeOv = scenario?.safeOverrides[metricId]?.safe;
      const maxOv = scenario?.maxOverrides[metricId]?.max;
      const { resolvedSafe, resolvedMax } = resolveLimit(
        baseSafe,
        baseMax,
        mult,
        safeOv,
        maxOv,
      );
      return {
        metricId,
        labelKey: keys.labelKey,
        baseSafe,
        baseMax,
        resolvedSafe,
        resolvedMax,
      };
    },
  );

  return {
    profileId: profile.id,
    profileName: profile.name,
    scenarioId: scenario?.id ?? null,
    scenarioName: scenario?.name ?? null,
    scenarioType: scenario?.scenarioType ?? null,
    limits,
  };
}

export function resolvedLimitsToProfile(
  profile: ProductionCapacityProfile,
  resolved: ResolvedCapacitySnapshot,
): ProductionCapacityProfile {
  const next = { ...profile };
  for (const lim of resolved.limits) {
    const keys = METRIC_KEYS[lim.metricId];
    (next[keys.safe] as number) = lim.resolvedSafe;
    (next[keys.max] as number) = lim.resolvedMax;
  }
  return next;
}
