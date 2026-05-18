import type { ControlTowerGatherContext, SystemHealthLevel } from "./types";

export function deriveExecutionHealth(ctx: ControlTowerGatherContext): {
  health: SystemHealthLevel;
  summaryKey: string;
  summaryVars: Record<string, string>;
} {
  const plan = ctx.executionPlan;
  if (!ctx.snapshot) {
    return { health: "blocked", summaryKey: "sct.exec.noSnapshot", summaryVars: {} };
  }
  if (!plan) {
    return { health: "watch", summaryKey: "sct.exec.noPlan", summaryVars: {} };
  }
  const holds = plan.holdActions.length;
  const today = plan.todayActions.length;
  if (holds >= 4) {
    return {
      health: "pressured",
      summaryKey: "sct.exec.holds",
      summaryVars: { n: String(holds) },
    };
  }
  if (holds > 0) {
    return {
      health: "watch",
      summaryKey: "sct.exec.someHolds",
      summaryVars: { n: String(holds), today: String(today) },
    };
  }
  if (today > 0) {
    return {
      health: "ready",
      summaryKey: "sct.exec.today",
      summaryVars: { n: String(today) },
    };
  }
  return { health: "stable", summaryKey: "sct.exec.stable", summaryVars: {} };
}

export function deriveHeroHealth(ctx: ControlTowerGatherContext): {
  health: SystemHealthLevel;
  summaryKey: string;
  summaryVars: Record<string, string>;
} {
  const h = ctx.heroSnapshot;
  if (!h || !h.hasActiveWorkflow) {
    return { health: "stable", summaryKey: "sct.hero.idle", summaryVars: {} };
  }
  const needsReview = h.stages.some((s) => s.status === "needs_review");
  const missing = h.stages.filter((s) => s.status === "missing").length;
  if (needsReview) {
    return {
      health: "pressured",
      summaryKey: "sct.hero.review",
      summaryVars: { query: h.query.slice(0, 40) },
    };
  }
  if (missing >= 4) {
    return {
      health: "watch",
      summaryKey: "sct.hero.incomplete",
      summaryVars: { n: String(missing) },
    };
  }
  return {
    health: "ready",
    summaryKey: "sct.hero.active",
    summaryVars: { query: h.query.slice(0, 40) },
  };
}

export function deriveLaunchHealth(ctx: ControlTowerGatherContext): {
  health: SystemHealthLevel;
  summaryKey: string;
  summaryVars: Record<string, string>;
} {
  const plan = ctx.launchPlan;
  if (!plan) {
    return { health: "watch", summaryKey: "sct.launch.none", summaryVars: {} };
  }
  const readiness = plan.launchReadiness;
  const blockers = plan.blockers.length;
  if (readiness === "blocked" || blockers >= 3) {
    return {
      health: "blocked",
      summaryKey: "sct.launch.blocked",
      summaryVars: { n: String(blockers), readiness },
    };
  }
  if (readiness === "fragile") {
    return {
      health: "pressured",
      summaryKey: "sct.launch.fragile",
      summaryVars: { collection: plan.collectionName.slice(0, 36) },
    };
  }
  if (readiness === "expansion_ready" || readiness === "ready") {
    return {
      health: "ready",
      summaryKey: "sct.launch.ready",
      summaryVars: { readiness, collection: plan.collectionName.slice(0, 36) },
    };
  }
  return {
    health: "watch",
    summaryKey: "sct.launch.operational",
    summaryVars: { readiness },
  };
}

export function deriveEconomicsHealth(ctx: ControlTowerGatherContext): {
  health: SystemHealthLevel;
  summaryKey: string;
  summaryVars: Record<string, string>;
} {
  const econ = ctx.econReport;
  const price = ctx.priceReport;
  const ad = ctx.adReport;
  const criticalGuard = ctx.guardrails.filter((g) => g.severity === "critical").length;

  if (
    econ.operationalLevel === "critical" ||
    econ.expansionLevel === "critical" ||
    criticalGuard > 0
  ) {
    return {
      health: "blocked",
      summaryKey: "sct.econ.critical",
      summaryVars: { guard: String(criticalGuard) },
    };
  }
  if (
    econ.operationalLevel === "dangerous" ||
    econ.expansionLevel === "dangerous" ||
    price?.pricePressureLevel === "dangerous" ||
    price?.pricePressureLevel === "negative" ||
    ad.adDependencyLevel === "dangerous" ||
    ad.adDependencyLevel === "critical"
  ) {
    return {
      health: "pressured",
      summaryKey: "sct.econ.pressured",
      summaryVars: {
        op: econ.operationalLevel,
        exp: econ.expansionLevel,
      },
    };
  }
  if (econ.operationalLevel === "elevated" || ad.adDependencyLevel === "elevated") {
    return {
      health: "watch",
      summaryKey: "sct.econ.elevated",
      summaryVars: {},
    };
  }
  return { health: "stable", summaryKey: "sct.econ.stable", summaryVars: {} };
}

export function deriveScalingHealth(ctx: ControlTowerGatherContext): {
  health: SystemHealthLevel;
  summaryKey: string;
  summaryVars: Record<string, string>;
} {
  const r = ctx.scalingReport;
  if (r.safetyLevel === "blocked") {
    return {
      health: "blocked",
      summaryKey: "sct.scaling.blocked",
      summaryVars: { mode: r.scalingMode },
    };
  }
  if (r.safetyLevel === "unsafe" || r.safetyLevel === "fragile") {
    return {
      health: "pressured",
      summaryKey: "sct.scaling.fragile",
      summaryVars: { mode: r.scalingMode },
    };
  }
  if (r.safetyLevel === "cautious" || r.scalingMode === "scale_carefully") {
    return {
      health: "watch",
      summaryKey: "sct.scaling.cautious",
      summaryVars: { mode: r.scalingMode },
    };
  }
  if (r.safetyLevel === "safe" && r.scalingMode === "scale") {
    return {
      health: "ready",
      summaryKey: "sct.scaling.safe",
      summaryVars: { mode: r.scalingMode },
    };
  }
  return { health: "stable", summaryKey: "sct.scaling.stable", summaryVars: { mode: r.scalingMode } };
}

export function deriveFboHealth(ctx: ControlTowerGatherContext): {
  health: SystemHealthLevel;
  summaryKey: string;
  summaryVars: Record<string, string>;
} {
  const r = ctx.fboReport;
  if (r.readiness === "blocked" || r.recommendedMode === "stop_fbo_expansion") {
    return {
      health: "blocked",
      summaryKey: "sct.fbo.blocked",
      summaryVars: { mode: r.recommendedMode },
    };
  }
  if (r.recommendedMode === "cleanup_before_fbo" || r.readiness === "fragile") {
    return {
      health: "pressured",
      summaryKey: "sct.fbo.cleanup",
      summaryVars: { mode: r.recommendedMode },
    };
  }
  if (r.recommendedMode === "test_fbo_small" || r.recommendedMode === "mixed_mode") {
    return {
      health: "watch",
      summaryKey: "sct.fbo.test",
      summaryVars: { mode: r.recommendedMode },
    };
  }
  if (r.recommendedMode === "move_to_fbo" && r.readiness === "expansion_ready") {
    return {
      health: "ready",
      summaryKey: "sct.fbo.ready",
      summaryVars: { mode: r.recommendedMode },
    };
  }
  return { health: "stable", summaryKey: "sct.fbo.fbs", summaryVars: { mode: r.recommendedMode } };
}

export function deriveCorridorHealth(ctx: ControlTowerGatherContext): {
  health: SystemHealthLevel;
  summaryKey: string;
  summaryVars: Record<string, string>;
} {
  const r = ctx.corridorReport;
  if (!r) {
    return { health: "watch", summaryKey: "sct.corridor.none", summaryVars: {} };
  }
  if (r.corridorState === "unstable" || r.recommendedStrategy === "reduce" || r.recommendedStrategy === "archive") {
    return {
      health: "blocked",
      summaryKey: "sct.corridor.blocked",
      summaryVars: { corridor: r.corridor, strategy: r.recommendedStrategy },
    };
  }
  if (r.corridorState === "fragmented" || r.corridorState === "refresh_needed") {
    return {
      health: "pressured",
      summaryKey: "sct.corridor.pressured",
      summaryVars: { corridor: r.corridor, state: r.corridorState },
    };
  }
  if (r.recommendedStrategy === "dominate" && r.corridorState === "scalable") {
    return {
      health: "ready",
      summaryKey: "sct.corridor.ready",
      summaryVars: { corridor: r.corridor },
    };
  }
  return {
    health: "watch",
    summaryKey: "sct.corridor.watch",
    summaryVars: { corridor: r.corridor, strategy: r.recommendedStrategy },
  };
}

export function deriveTimingHealth(ctx: ControlTowerGatherContext): {
  health: SystemHealthLevel;
  summaryKey: string;
  summaryVars: Record<string, string>;
} {
  const r = ctx.timingReport;
  if (!r) {
    return { health: "watch", summaryKey: "sct.timing.none", summaryVars: {} };
  }
  if (
    r.timingState === "unstable" ||
    r.launchCadence === "chaotic" ||
    r.timingState === "overlapping"
  ) {
    return {
      health: "blocked",
      summaryKey: "sct.timing.blocked",
      summaryVars: { corridor: r.corridor, state: r.timingState },
    };
  }
  if (r.timingState === "burnout_risk" || r.timingState === "crowded") {
    return {
      health: "pressured",
      summaryKey: "sct.timing.pressured",
      summaryVars: { corridor: r.corridor, cadence: r.launchCadence },
    };
  }
  if (r.timingState === "refresh_due") {
    return {
      health: "watch",
      summaryKey: "sct.timing.refresh",
      summaryVars: { corridor: r.corridor },
    };
  }
  if (r.timingState === "well_spaced") {
    return {
      health: "stable",
      summaryKey: "sct.timing.stable",
      summaryVars: { corridor: r.corridor },
    };
  }
  return {
    health: "watch",
    summaryKey: "sct.timing.watch",
    summaryVars: { corridor: r.corridor, state: r.timingState },
  };
}

export function deriveMemorySignal(ctx: ControlTowerGatherContext): {
  summaryKey: string;
  summaryVars: Record<string, string>;
} {
  const n = ctx.savedModuleHints;
  if (n >= 4) {
    return { summaryKey: "sct.memory.rich", summaryVars: { n: String(n) } };
  }
  if (n > 0) {
    return { summaryKey: "sct.memory.some", summaryVars: { n: String(n) } };
  }
  return { summaryKey: "sct.memory.empty", summaryVars: {} };
}
