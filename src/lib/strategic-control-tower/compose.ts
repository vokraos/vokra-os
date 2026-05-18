import { enrichControlTowerWithOsAudit } from "../os-health-audit";
import type { NavId } from "../../types";
import {
  deriveCorridorHealth,
  deriveEconomicsHealth,
  deriveExecutionHealth,
  deriveFboHealth,
  deriveHeroHealth,
  deriveLaunchHealth,
  deriveMemorySignal,
  deriveScalingHealth,
  deriveTimingHealth,
} from "./states";
import { healthRank, newControlTowerSnapshotId } from "./levels";
import type {
  ControlTowerGatherContext,
  ControlTowerOverallState,
  ControlTowerSystemId,
  ControlTowerSystemTile,
  StrategicControlTowerSnapshot,
  SystemHealthLevel,
} from "./types";

const SYSTEM_NAV: Record<ControlTowerSystemId, NavId> = {
  execution: "assortmentActions",
  hero: "competitiveMap",
  launch: "launchOperations",
  economics: "economicPressure",
  scaling: "scalingSafety",
  fbo: "fboFbsDecision",
  corridor: "corridorStrategy",
  timing: "marketTiming",
};

function deriveOverallState(
  states: Record<ControlTowerSystemId, SystemHealthLevel>,
  ctx: ControlTowerGatherContext,
): ControlTowerOverallState {
  const values = Object.values(states);
  const blockedCount = values.filter((v) => v === "blocked").length;
  const pressuredCount = values.filter((v) => v === "pressured" || v === "blocked").length;

  if (!ctx.snapshot || blockedCount >= 2) return "blocked";
  if (states.scaling === "blocked" || states.fbo === "blocked" || states.launch === "blocked") {
    return "blocked";
  }

  const expansionReady =
    states.scaling === "ready" &&
    (states.launch === "ready" || ctx.launchPlan?.launchReadiness === "expansion_ready") &&
    states.timing !== "blocked" &&
    states.timing !== "pressured" &&
    states.corridor !== "blocked";

  if (expansionReady && blockedCount === 0 && pressuredCount <= 1) return "expansion_ready";

  if (
    states.scaling === "pressured" ||
    states.launch === "pressured" ||
    states.timing === "pressured" ||
    states.economics === "pressured" ||
    pressuredCount >= 3
  ) {
    return "fragile";
  }

  if (pressuredCount >= 1 || values.filter((v) => v === "watch").length >= 4) return "pressured";

  return "stable";
}

function pickBlockedSystem(
  states: Record<ControlTowerSystemId, SystemHealthLevel>,
): { key: string; vars: Record<string, string>; nav: NavId } {
  const order: ControlTowerSystemId[] = [
    "scaling",
    "fbo",
    "launch",
    "execution",
    "economics",
    "timing",
    "corridor",
    "hero",
  ];
  for (const id of order) {
    if (states[id] === "blocked") {
      return {
        key: `sct.blocked.${id}`,
        vars: {},
        nav: SYSTEM_NAV[id],
      };
    }
  }
  return { key: "sct.blocked.none", vars: {}, nav: "controlTower" };
}

function pickRiskSystem(ctx: ControlTowerGatherContext): { key: string; vars: Record<string, string>; nav: NavId } {
  if (ctx.scalingReport.safetyLevel === "unsafe" || ctx.scalingReport.safetyLevel === "blocked") {
    return { key: "sct.risk.scaling", vars: { mode: ctx.scalingReport.scalingMode }, nav: "scalingSafety" };
  }
  if (ctx.adReport.adDependencyLevel === "dangerous" || ctx.adReport.adDependencyLevel === "critical") {
    return {
      key: "sct.risk.ads",
      vars: { level: ctx.adReport.adDependencyLevel },
      nav: "advertisingPressure",
    };
  }
  if (ctx.econReport.operationalLevel === "dangerous" || ctx.econReport.expansionLevel === "dangerous") {
    return { key: "sct.risk.economics", vars: {}, nav: "economicPressure" };
  }
  if (ctx.timingReport?.timingState === "burnout_risk") {
    return {
      key: "sct.risk.timing",
      vars: { corridor: ctx.timingReport.corridor },
      nav: "marketTiming",
    };
  }
  return { key: "sct.risk.none", vars: {}, nav: "controlTower" };
}

function pickLeverageSystem(ctx: ControlTowerGatherContext): { key: string; vars: Record<string, string>; nav: NavId } {
  const brief = ctx.founderBrief;
  if (brief?.highestLeverageMove?.navId) {
    return {
      key: "sct.leverage.founder",
      vars: { move: brief.highestLeverageMove.text.slice(0, 48) },
      nav: brief.highestLeverageMove.navId,
    };
  }
  const top = ctx.executionPlan?.todayActions[0];
  if (top) {
    return {
      key: "sct.leverage.execution",
      vars: { action: top.titleKey },
      nav: top.suggestedDestination ?? "assortmentActions",
    };
  }
  return { key: "sct.leverage.none", vars: {}, nav: "assortmentActions" };
}

function pickTopPriority(
  overall: ControlTowerOverallState,
  states: Record<ControlTowerSystemId, SystemHealthLevel>,
  blocked: { key: string; nav: NavId },
  risk: { key: string; nav: NavId },
): { key: string; vars: Record<string, string>; route: NavId } {
  if (overall === "blocked") {
    return { key: blocked.key, vars: {}, route: blocked.nav };
  }
  if (overall === "expansion_ready") {
    return { key: "sct.priority.expansion", vars: {}, route: "scalingSafety" };
  }

  const ranked = (Object.entries(states) as [ControlTowerSystemId, SystemHealthLevel][])
    .sort((a, b) => healthRank(b[1]) - healthRank(a[1]))
    .filter(([, h]) => healthRank(h) >= healthRank("pressured"));

  if (ranked[0]) {
    const [id] = ranked[0];
    return {
      key: `sct.priority.${id}`,
      vars: {},
      route: SYSTEM_NAV[id],
    };
  }

  if (risk.key !== "sct.risk.none") {
    return { key: risk.key, vars: {}, route: risk.nav };
  }

  return { key: "sct.priority.stable", vars: {}, route: "founderBrief" };
}

function buildWarnings(ctx: ControlTowerGatherContext, states: Record<ControlTowerSystemId, SystemHealthLevel>): string[] {
  const keys: string[] = [];
  if (!ctx.snapshot) keys.push("sct.warn.noSnapshot");
  if (states.scaling === "blocked") keys.push("sct.warn.scalingBlocked");
  if (states.fbo === "blocked") keys.push("sct.warn.fboBlocked");
  if (states.launch === "blocked") keys.push("sct.warn.launchBlocked");
  if (ctx.guardrails.some((g) => g.severity === "critical")) keys.push("sct.warn.guardrails");
  if (ctx.timingReport?.launchCadence === "overloaded" || ctx.timingReport?.launchCadence === "chaotic") {
    keys.push("sct.warn.timingOverload");
  }
  if (ctx.corridorReport?.corridorState === "unstable") keys.push("sct.warn.corridorUnstable");
  return [...new Set(keys)].slice(0, 6);
}

function buildTiles(
  ctx: ControlTowerGatherContext,
  parts: Record<
    ControlTowerSystemId,
    { health: SystemHealthLevel; summaryKey: string; summaryVars: Record<string, string> }
  >,
): ControlTowerSystemTile[] {
  const mem = deriveMemorySignal(ctx);
  const tiles: ControlTowerSystemTile[] = (Object.keys(SYSTEM_NAV) as ControlTowerSystemId[]).map((id) => ({
    id,
    health: parts[id].health,
    summaryKey: parts[id].summaryKey,
    summaryVars: parts[id].summaryVars,
    navId: SYSTEM_NAV[id],
  }));
  tiles.push({
    id: "memory",
    health: ctx.savedModuleHints >= 3 ? "ready" : ctx.savedModuleHints > 0 ? "watch" : "stable",
    summaryKey: mem.summaryKey,
    summaryVars: mem.summaryVars,
    navId: "memory",
  });
  return tiles;
}

export function buildStrategicControlTowerSnapshot(
  ctx: ControlTowerGatherContext,
  existingId?: string,
): StrategicControlTowerSnapshot {
  const exec = deriveExecutionHealth(ctx);
  const hero = deriveHeroHealth(ctx);
  const launch = deriveLaunchHealth(ctx);
  const econ = deriveEconomicsHealth(ctx);
  const scaling = deriveScalingHealth(ctx);
  const fbo = deriveFboHealth(ctx);
  const corridor = deriveCorridorHealth(ctx);
  const timing = deriveTimingHealth(ctx);
  const mem = deriveMemorySignal(ctx);

  const parts = {
    execution: exec,
    hero,
    launch,
    economics: econ,
    scaling,
    fbo,
    corridor,
    timing,
  };

  const states: Record<ControlTowerSystemId, SystemHealthLevel> = {
    execution: exec.health,
    hero: hero.health,
    launch: launch.health,
    economics: econ.health,
    scaling: scaling.health,
    fbo: fbo.health,
    corridor: corridor.health,
    timing: timing.health,
  };

  const overallState = deriveOverallState(states, ctx);
  const blocked = pickBlockedSystem(states);
  const risk = pickRiskSystem(ctx);
  const leverage = pickLeverageSystem(ctx);
  const priority = pickTopPriority(overallState, states, blocked, risk);

  return enrichControlTowerWithOsAudit({
    id: existingId ?? newControlTowerSnapshotId(),
    createdAt: Date.now(),
    overallState,
    topPriorityKey: priority.key,
    topPriorityVars: priority.vars,
    blockedSystemKey: blocked.key,
    blockedSystemVars: blocked.vars,
    leverageSystemKey: leverage.key,
    leverageSystemVars: leverage.vars,
    riskSystemKey: risk.key,
    riskSystemVars: risk.vars,
    executionState: exec.health,
    heroState: hero.health,
    launchState: launch.health,
    economicsState: econ.health,
    scalingState: scaling.health,
    fboState: fbo.health,
    corridorState: corridor.health,
    timingState: timing.health,
    memorySignalKey: mem.summaryKey,
    memorySignalVars: mem.summaryVars,
    nextBestRoute: priority.route,
    warningKeys: buildWarnings(ctx, states),
    confidenceNoteKey: ctx.snapshot ? "sct.confidence.manual" : "sct.confidence.noSnapshot",
    tiles: buildTiles(ctx, parts),
    osAuditHealth: "adequate",
    osAuditTopMissingKey: "oha.missing.none",
    osAuditTopMissingVars: {},
    osAuditShowLink: false,
    executionFeedbackLineKey: null,
    executionFeedbackLineVars: {},
    productionPressureLineKey: null,
    productionPressureLineVars: {},
  });
}
