import {
  buildAdPressureMemoryPayload,
  buildPrimaryAdvertisingPressureReport,
  notifyAdPressureUpdated,
  reportToDisplay,
  saveAdPressureSession,
} from "../ad-pressure";
import {
  buildCorridorStrategyMemoryPayload,
  buildCorridorStrategyReports,
  notifyCorridorStrategyUpdated,
  saveCorridorStrategySession,
} from "../corridor-strategy";
import {
  buildDailyWarRoomMemoryPayload,
  buildDailyWarRoomSnapshot,
  notifyDailyWarRoomUpdated,
  saveDailyWarRoomSession,
} from "../daily-war-room";
import {
  buildEconomicPressureMemoryPayload,
  buildEconomicPressureReport,
  gatherEconomicPressureContext,
  notifyEconomicPressureUpdated,
  saveEconomicPressureSession,
} from "../economic-pressure";
import { peekEconomicPressureSession } from "../economic-pressure/session";
import { getActiveEntitySnapshot } from "../entity-snapshot";
import {
  buildFounderCommandBrief,
  gatherFounderBriefContext,
  notifyFounderBriefUpdated,
  saveLastFounderBrief,
} from "../founder-brief";
import {
  buildFboFbsDecisionMemoryPayload,
  buildFboFbsDecisionReport,
  notifyFboFbsDecisionUpdated,
  saveFboFbsDecisionSession,
} from "../fbo-fbs-decision";
import { peekFboFbsDecisionSession } from "../fbo-fbs-decision/session";
import {
  buildMarketTimingMemoryPayload,
  buildMarketTimingReports,
  notifyMarketTimingUpdated,
  saveMarketTimingSession,
} from "../market-timing";
import { peekMarketTimingSession } from "../market-timing/session";
import { peekLaunchOpsSession } from "../launch-ops/session";
import { buildLaunchPriceReport, buildAllPricePositioningReports } from "../price-positioning";
import {
  buildPricePositioningMemoryPayload,
  savePricePositioningSession,
} from "../price-positioning/session";
import { peekPricePositioningSession } from "../price-positioning/session";
import {
  buildProductionPressureMemoryPayload,
  buildProductionPressureReport,
  notifyProductionPressureUpdated,
  saveProductionPressureSession,
} from "../production-pressure";
import { peekProductionPressureSession } from "../production-pressure/session";
import {
  buildScalingSafetyMemoryPayload,
  buildScalingSafetyReport,
  notifyScalingSafetyUpdated,
  saveScalingSafetySession,
} from "../scaling-safety";
import { peekScalingSafetySession } from "../scaling-safety/session";
import {
  buildControlTowerMemoryPayload,
  buildControlTowerSnapshot,
  notifyControlTowerUpdated,
  saveControlTowerSession,
} from "../strategic-control-tower";
import { peekControlTowerSession } from "../strategic-control-tower/session";
import { peekDailyWarRoomSession } from "../daily-war-room/session";
import { peekCorridorStrategySession } from "../corridor-strategy/session";
import { peekAdPressureSession } from "../ad-pressure/session";
import { loadBundleForIntegrations } from "../unit-economics";
import { isSafeModeFeatureDisabled } from "../safe-mode";
import { saveOsReportWarmupState, peekOsReportWarmupState } from "./session";
import {
  OS_REPORT_WARMUP_EVENT,
  WARMUP_REPORT_ORDER,
  type OsReportWarmupState,
  type WarmupOptions,
  type WarmupReportId,
} from "./types";

const COOLDOWN_MS = 90_000;
const SESSION_FRESH_MS = 5 * 60_000;

let lastWarmupFinishedAt = 0;
let warmupInFlight = false;

/** For diagnostics / smoke tests — true while a warmup run holds the lock. */
export function isOsReportWarmupInFlight(): boolean {
  return warmupInFlight;
}

type TFn = (key: string, vars?: Record<string, string>) => string;

function newWarmupId(): string {
  return `orw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultT(key: string, vars?: Record<string, string>): string {
  if (!vars) return key;
  return key.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

export function notifyOsReportWarmupUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OS_REPORT_WARMUP_EVENT));
  }
}

function sessionFresh(savedAt: number | undefined): boolean {
  return typeof savedAt === "number" && Date.now() - savedAt < SESSION_FRESH_MS;
}

function shouldSkipEntireWarmup(force: boolean | undefined, reason: WarmupOptions["reason"]): boolean {
  if (force) return false;
  const elapsed = Date.now() - lastWarmupFinishedAt;
  if (elapsed < COOLDOWN_MS) return true;
  if (reason === "app_start") {
    const prev = peekOsReportWarmupState();
    if (prev && (prev.status === "complete" || prev.status === "partial") && elapsed < COOLDOWN_MS * 2) {
      return true;
    }
  }
  return false;
}

function warmRawPrerequisites(): void {
  loadBundleForIntegrations();
  getActiveEntitySnapshot();
}

type WarmStepResult = "warmed" | "skipped";

function warmSingleReport(id: WarmupReportId, t: TFn, locale: "en" | "ru", force: boolean): WarmStepResult {
  switch (id) {
    case "economic_pressure": {
      const cached = peekEconomicPressureSession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const ctx = gatherEconomicPressureContext();
      const report = buildEconomicPressureReport(ctx, t);
      saveEconomicPressureSession(buildEconomicPressureMemoryPayload(report, report.guardrailSummary));
      notifyEconomicPressureUpdated();
      return "warmed";
    }
    case "price_positioning": {
      const cached = peekPricePositioningSession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const launch = peekLaunchOpsSession()?.plan;
      let reports = buildAllPricePositioningReports().slice(0, 8);
      if (launch) {
        const primary = buildLaunchPriceReport({ collectionId: launch.collectionId });
        if (primary) reports = [primary];
      }
      if (!reports.length) return "skipped";
      savePricePositioningSession(buildPricePositioningMemoryPayload(reports));
      return "warmed";
    }
    case "advertising_pressure": {
      const cached = peekAdPressureSession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const report = buildPrimaryAdvertisingPressureReport();
      const display = reportToDisplay(report, t);
      saveAdPressureSession(
        buildAdPressureMemoryPayload([report], {
          warnings: display.warnings,
          recommendations: [display.recommendedAction],
        }),
      );
      notifyAdPressureUpdated();
      return "warmed";
    }
    case "scaling_safety": {
      const cached = peekScalingSafetySession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const report = buildScalingSafetyReport(t);
      saveScalingSafetySession(buildScalingSafetyMemoryPayload(report));
      notifyScalingSafetyUpdated();
      return "warmed";
    }
    case "fbo_fbs_decision": {
      const cached = peekFboFbsDecisionSession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const report = buildFboFbsDecisionReport(t);
      saveFboFbsDecisionSession(buildFboFbsDecisionMemoryPayload(report));
      notifyFboFbsDecisionUpdated();
      return "warmed";
    }
    case "production_pressure": {
      const cached = peekProductionPressureSession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const report = buildProductionPressureReport(t, undefined, locale);
      saveProductionPressureSession(buildProductionPressureMemoryPayload(report));
      notifyProductionPressureUpdated();
      return "warmed";
    }
    case "corridor_strategy": {
      const cached = peekCorridorStrategySession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const reports = buildCorridorStrategyReports(t);
      if (!reports.length) return "skipped";
      saveCorridorStrategySession(buildCorridorStrategyMemoryPayload(reports));
      notifyCorridorStrategyUpdated();
      return "warmed";
    }
    case "market_timing": {
      const cached = peekMarketTimingSession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const reports = buildMarketTimingReports(t);
      if (!reports.length) return "skipped";
      saveMarketTimingSession(buildMarketTimingMemoryPayload(reports));
      notifyMarketTimingUpdated();
      return "warmed";
    }
    case "founder_brief": {
      const brief = buildFounderCommandBrief(gatherFounderBriefContext(), t);
      saveLastFounderBrief(brief);
      notifyFounderBriefUpdated();
      return "warmed";
    }
    case "control_tower": {
      const cached = peekControlTowerSession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const snapshot = buildControlTowerSnapshot(t, locale);
      saveControlTowerSession(buildControlTowerMemoryPayload(snapshot));
      notifyControlTowerUpdated();
      return "warmed";
    }
    case "war_room": {
      const cached = peekDailyWarRoomSession();
      if (!force && sessionFresh(cached?.savedAt)) return "skipped";
      const snapshot = buildDailyWarRoomSnapshot(t, locale);
      saveDailyWarRoomSession(buildDailyWarRoomMemoryPayload(snapshot));
      notifyDailyWarRoomUpdated();
      return "warmed";
    }
    default:
      return "skipped";
  }
}

function finalizeStatus(
  warmed: WarmupReportId[],
  failed: WarmupReportId[],
  skipped: WarmupReportId[],
): OsReportWarmupState["status"] {
  if (failed.length && warmed.length === 0 && skipped.length === 0) return "failed";
  if (failed.length) return "partial";
  const covered = warmed.length + skipped.length;
  if (covered >= WARMUP_REPORT_ORDER.length) return "complete";
  if (warmed.length > 0 || skipped.length > 0) return "partial";
  return "idle";
}

function confidenceKey(
  status: OsReportWarmupState["status"],
  failed: WarmupReportId[],
): string {
  if (status === "complete") return "warmup.confidence.complete";
  if (status === "partial" && failed.length) return "warmup.confidence.partial";
  if (status === "failed") return "warmup.confidence.failed";
  if (status === "idle") return "warmup.confidence.skipped";
  return "warmup.confidence.partial";
}

/** Build domain + command report sessions in dependency-safe order. Never throws. */
export function warmupOsReports(options: WarmupOptions = {}): OsReportWarmupState {
  const reason = options.reason ?? "manual";
  const force = options.force ?? false;
  const locale = options.locale ?? "en";
  const t = options.t ?? defaultT;

  if (isSafeModeFeatureDisabled("report_warmup")) {
    const prev = peekOsReportWarmupState();
    const skippedState: OsReportWarmupState = {
      id: prev?.id ?? newWarmupId(),
      createdAt: Date.now(),
      status: "idle",
      reason,
      warmedReports: prev?.warmedReports ?? [],
      failedReports: prev?.failedReports ?? [],
      skippedReports: [...WARMUP_REPORT_ORDER],
      lastError: null,
      confidenceNote: "warmup.confidence.safeMode",
    };
    saveOsReportWarmupState(skippedState);
    notifyOsReportWarmupUpdated();
    return skippedState;
  }

  if (shouldSkipEntireWarmup(force, reason)) {
    const prev = peekOsReportWarmupState();
    const skippedState: OsReportWarmupState = {
      id: prev?.id ?? newWarmupId(),
      createdAt: Date.now(),
      status: "idle",
      reason,
      warmedReports: prev?.warmedReports ?? [],
      failedReports: prev?.failedReports ?? [],
      skippedReports: [...WARMUP_REPORT_ORDER],
      lastError: null,
      confidenceNote: "warmup.confidence.cooldown",
    };
    saveOsReportWarmupState(skippedState);
    notifyOsReportWarmupUpdated();
    return skippedState;
  }

  if (warmupInFlight) {
    return (
      peekOsReportWarmupState() ?? {
        id: newWarmupId(),
        createdAt: Date.now(),
        status: "warming",
        reason,
        warmedReports: [],
        failedReports: [],
        skippedReports: [],
        lastError: null,
        confidenceNote: "warmup.confidence.warming",
      }
    );
  }

  warmupInFlight = true;
  const warmedReports: WarmupReportId[] = [];
  const failedReports: WarmupReportId[] = [];
  const skippedReports: WarmupReportId[] = [];
  let lastError: string | null = null;

  const warmingState: OsReportWarmupState = {
    id: newWarmupId(),
    createdAt: Date.now(),
    status: "warming",
    reason,
    warmedReports: [],
    failedReports: [],
    skippedReports: [],
    lastError: null,
    confidenceNote: "warmup.confidence.warming",
  };
  saveOsReportWarmupState(warmingState);
  notifyOsReportWarmupUpdated();

  try {
    warmRawPrerequisites();
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
  }

  for (const reportId of WARMUP_REPORT_ORDER) {
    try {
      const step = warmSingleReport(reportId, t, locale, force);
      if (step === "skipped") skippedReports.push(reportId);
      else warmedReports.push(reportId);
    } catch (e) {
      failedReports.push(reportId);
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  const status = finalizeStatus(warmedReports, failedReports, skippedReports);
  const finalState: OsReportWarmupState = {
    id: warmingState.id,
    createdAt: Date.now(),
    status,
    reason,
    warmedReports,
    failedReports,
    skippedReports,
    lastError,
    confidenceNote: confidenceKey(status, failedReports),
  };

  saveOsReportWarmupState(finalState);
  lastWarmupFinishedAt = Date.now();
  warmupInFlight = false;
  notifyOsReportWarmupUpdated();
  return finalState;
}

/** Defer warmup so UI render is never blocked. */
export function scheduleOsReportWarmup(options: WarmupOptions = {}): void {
  if (typeof window === "undefined") return;
  if (isSafeModeFeatureDisabled("report_warmup")) return;

  const run = () => {
    try {
      warmupOsReports(options);
    } catch {
      warmupInFlight = false;
      const failState: OsReportWarmupState = {
        id: newWarmupId(),
        createdAt: Date.now(),
        status: "failed",
        reason: options.reason ?? "manual",
        warmedReports: [],
        failedReports: [],
        skippedReports: [],
        lastError: "warmup.unhandled",
        confidenceNote: "warmup.confidence.failed",
      };
      saveOsReportWarmupState(failState);
      notifyOsReportWarmupUpdated();
    }
  };

  window.setTimeout(() => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 4000 });
    } else {
      run();
    }
  }, 0);
}

export function subscribeOsReportWarmup(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const fn = () => listener();
  window.addEventListener(OS_REPORT_WARMUP_EVENT, fn);
  return () => window.removeEventListener(OS_REPORT_WARMUP_EVENT, fn);
}
