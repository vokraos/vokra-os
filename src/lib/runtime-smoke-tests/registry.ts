import type { SmokeCheckResult, SmokeCheckStatus, SmokeRunOptions } from "./types";
import type { AppLocale } from "../i18n/messages";
import {
  smokeBuildCorridorStrategy,
  smokeBuildControlTower,
  smokeBuildEconomicPressure,
  smokeBuildFboFbsDecision,
  smokeBuildFounderBrief,
  smokeBuildMarketTiming,
  smokeBuildOperatorWorkOrder,
  smokeBuildProductionPressure,
  smokeBuildScalingSafety,
  smokeBuildWarRoom,
} from "./report-builders";
import { assertMemoryModuleNavTargetsResolve, assertRoleNavMapsReferenceKnownNavIds } from "./navigation";
import { assertSmokeRecursionGuardTrips, assertWarmupLatchClear } from "./recursion-guard";
import { runSafeModeRoundTripCheck } from "./safe-mode";
import { runSmokeWarmup } from "./warmup-check";

export type SmokeCheckDef = {
  id: string;
  labelKey: string;
  run: (locale: AppLocale, opts: SmokeRunOptions) => void;
};

function timeCheck(fn: () => void): { status: SmokeCheckStatus; detail?: string; ms: number } {
  const t0 = performance.now();
  try {
    fn();
    return { status: "passed", ms: Math.round(performance.now() - t0) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith("skipped:")) {
      return { status: "skipped", detail: msg, ms: Math.round(performance.now() - t0) };
    }
    return { status: "failed", detail: msg, ms: Math.round(performance.now() - t0) };
  }
}

export const SMOKE_CHECK_REGISTRY: readonly SmokeCheckDef[] = [
  { id: "economic_pressure", labelKey: "smoke.check.economicPressure", run: () => smokeBuildEconomicPressure() },
  { id: "scaling_safety", labelKey: "smoke.check.scalingSafety", run: () => smokeBuildScalingSafety() },
  { id: "fbo_fbs_decision", labelKey: "smoke.check.fboFbs", run: () => smokeBuildFboFbsDecision() },
  { id: "production_pressure", labelKey: "smoke.check.productionPressure", run: () => smokeBuildProductionPressure() },
  { id: "corridor_strategy", labelKey: "smoke.check.corridorStrategy", run: () => smokeBuildCorridorStrategy() },
  { id: "market_timing", labelKey: "smoke.check.marketTiming", run: () => smokeBuildMarketTiming() },
  { id: "founder_brief", labelKey: "smoke.check.founderBrief", run: () => smokeBuildFounderBrief() },
  {
    id: "control_tower",
    labelKey: "smoke.check.controlTower",
    run: (_l, opts) => smokeBuildControlTower((opts.locale ?? "ru") as AppLocale),
  },
  {
    id: "war_room",
    labelKey: "smoke.check.warRoom",
    run: (_l, opts) => smokeBuildWarRoom((opts.locale ?? "ru") as AppLocale),
  },
  {
    id: "operator_work_order",
    labelKey: "smoke.check.operatorWorkOrder",
    run: (_l, opts) => smokeBuildOperatorWorkOrder((opts.locale ?? "ru") as AppLocale),
  },
  {
    id: "warmup_os_reports",
    labelKey: "smoke.check.warmup",
    run: (_l, opts) => runSmokeWarmup((opts.locale ?? "ru") as AppLocale, opts.forceWarmup ?? true),
  },
  { id: "safe_mode_roundtrip", labelKey: "smoke.check.safeMode", run: () => runSafeModeRoundTripCheck() },
  {
    id: "role_nav_maps",
    labelKey: "smoke.check.roleNavMaps",
    run: () => assertRoleNavMapsReferenceKnownNavIds(),
  },
  {
    id: "memory_module_targets",
    labelKey: "smoke.check.memoryTargets",
    run: () => assertMemoryModuleNavTargetsResolve(),
  },
  {
    id: "recursion_guard",
    labelKey: "smoke.check.recursionGuard",
    run: () => assertSmokeRecursionGuardTrips(),
  },
  {
    id: "warmup_latch_clear",
    labelKey: "smoke.check.warmupLatch",
    run: () => assertWarmupLatchClear(),
  },
];

export function runRegisteredCheck(def: SmokeCheckDef, locale: AppLocale, opts: SmokeRunOptions): SmokeCheckResult {
  const r = timeCheck(() => def.run(locale, opts));
  return {
    id: def.id,
    labelKey: def.labelKey,
    status: r.status,
    detail: r.detail,
    durationMs: r.ms,
  };
}
