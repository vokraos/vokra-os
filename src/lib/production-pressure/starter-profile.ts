import type { ProductionCapacityProfile } from "./capacity-types";

function newId(): string {
  return `pcp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Editable template — founder must set real limits; not OS truth. */
export function createStarterCapacityProfile(): ProductionCapacityProfile {
  const now = Date.now();
  return {
    id: newId(),
    name: "Starter",
    active: true,
    teamSize: 2,
    printersAvailable: 1,
    pressOperators: 1,
    packers: 1,
    shiftHours: 8,
    safeConcurrentLaunches: 2,
    maxConcurrentLaunches: 4,
    safeDailyRefreshes: 3,
    maxDailyRefreshes: 6,
    safeFboPrepTasks: 5,
    maxFboPrepTasks: 10,
    safeVisualJobs: 5,
    maxVisualJobs: 8,
    safeCardJobs: 5,
    maxCardJobs: 8,
    safePackagingLoad: 5,
    maxPackagingLoad: 8,
    safeBlockedTasks: 2,
    maxBlockedTasks: 4,
    notes: "Starter template — replace every limit with your real production capacity.",
    createdAt: now,
    updatedAt: now,
  };
}
