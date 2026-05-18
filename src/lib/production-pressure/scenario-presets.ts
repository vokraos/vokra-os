import type { CapacityLoadMetricId, CapacityMultipliers, ShiftScenarioType } from "./capacity-types";

const ALL_METRICS: CapacityLoadMetricId[] = [
  "activeLaunches",
  "refreshTasks",
  "fboPrepTasks",
  "visualJobs",
  "cardJobs",
  "packagingLoad",
  "blockedTasks",
];

function mul(safe: number, max: number): CapacityMultipliers[CapacityLoadMetricId] {
  return { safe, max };
}

/** Founder-editable presets — not attendance truth. */
export function presetMultipliersForType(type: ShiftScenarioType): CapacityMultipliers {
  const one = (n: number) => ALL_METRICS.reduce<CapacityMultipliers>((acc, id) => {
    acc[id] = mul(n, n);
    return acc;
  }, {});

  switch (type) {
    case "normal_shift":
      return one(1);
    case "small_shift":
      return {
        activeLaunches: mul(0.7, 0.75),
        refreshTasks: mul(0.8, 0.85),
        fboPrepTasks: mul(0.85, 0.9),
        visualJobs: mul(0.75, 0.8),
        cardJobs: mul(0.75, 0.8),
        packagingLoad: mul(0.8, 0.85),
        blockedTasks: mul(0.9, 0.95),
      };
    case "strong_shift":
      return {
        activeLaunches: mul(1.15, 1.2),
        refreshTasks: mul(1.1, 1.15),
        fboPrepTasks: mul(1.15, 1.2),
        visualJobs: mul(1.15, 1.2),
        cardJobs: mul(1.15, 1.2),
        packagingLoad: mul(1.1, 1.15),
        blockedTasks: mul(1.05, 1.1),
      };
    case "weekend_catchup":
      return {
        activeLaunches: mul(0.6, 0.65),
        refreshTasks: mul(1.3, 1.35),
        fboPrepTasks: mul(0.9, 0.95),
        visualJobs: mul(1.25, 1.3),
        cardJobs: mul(1.25, 1.3),
        packagingLoad: mul(1.15, 1.2),
        blockedTasks: mul(1, 1),
      };
    case "launch_day":
      return {
        activeLaunches: mul(1.4, 1.45),
        refreshTasks: mul(0.75, 0.8),
        fboPrepTasks: mul(0.7, 0.75),
        visualJobs: mul(0.9, 0.95),
        cardJobs: mul(0.95, 1),
        packagingLoad: mul(0.85, 0.9),
        blockedTasks: mul(0.95, 1),
      };
    case "fbo_prep_day":
      return {
        activeLaunches: mul(0.6, 0.65),
        refreshTasks: mul(0.85, 0.9),
        fboPrepTasks: mul(1.5, 1.55),
        visualJobs: mul(0.8, 0.85),
        cardJobs: mul(0.85, 0.9),
        packagingLoad: mul(0.9, 0.95),
        blockedTasks: mul(1, 1),
      };
    case "visual_content_day":
      return {
        activeLaunches: mul(0.75, 0.8),
        refreshTasks: mul(1.1, 1.15),
        fboPrepTasks: mul(0.7, 0.75),
        visualJobs: mul(1.4, 1.45),
        cardJobs: mul(1.35, 1.4),
        packagingLoad: mul(1.05, 1.1),
        blockedTasks: mul(1, 1),
      };
    default:
      return one(1);
  }
}
