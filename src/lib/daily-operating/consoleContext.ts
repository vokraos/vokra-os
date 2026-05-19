import type { AppLocale } from "../i18n/messages";
import { buildAssortmentConsoleDigests } from "../assortment-actions/digest";
import { getAssortmentStatusRevisionKey } from "../assortment-actions/cache";
import { getAdvertisingPressureDailyLine } from "../ad-pressure";
import { getCollectionExecutionDailyDigestLine } from "../collection-assortment-bridge";
import { getDailyWarRoomDailyLine, getDailyWarRoomDailyLineCached } from "../daily-war-room";
import { getEconomicPressureDailyLine } from "../economic-pressure";
import { getEveningCloseDailyLine } from "../evening-close";
import { formatExecutionFeedbackDailyLine } from "../execution-feedback";
import { formatGuardrailDailyLine, loadEconomicGuardrails } from "../economic-guardrails";
import {
  deriveSnapshotIntelligence,
  formatSnapshotTopActionLine,
  getActiveEntitySnapshot,
  selectEntitySnapshotBannerCounts,
} from "../entity-snapshot";
import { snapshotRevisionKey } from "../entity-snapshot/cache";
import { getFboFbsDecisionDailyLine } from "../fbo-fbs-decision";
import { getFounderBriefDailySummary, getFounderBriefDailySummaryFromCache } from "../founder-brief";
import { buildGuidedSetupPlan, formatGuidedSetupDailyLine } from "../guided-setup";
import { getHeroExecutionDailyDigestLine } from "../hero-assortment-bridge";
import { getHeroCommandDailyDigestLine } from "../hero-command";
import { getLaunchExecutionDailyDigestLine } from "../launch-ops";
import { buildPrimaryMarketTimingReport, formatMarketTimingDailyLine } from "../market-timing";
import { getMorningFlowDailyLine } from "../morning-operating-flow";
import { buildOperatorBrief, formatOperatorModeDailyLine, peekOperatorBriefSession } from "../operator-brief";
import { buildOsHealthAuditReport, formatOsHealthAuditDailyLine } from "../os-health-audit";
import { getPricePressureDailyLine } from "../price-positioning";
import { getProductionPressureDailyLine, getProductionPressureDailyLineCached } from "../production-pressure";
import { buildPrimaryCorridorStrategyReport, formatCorridorStrategyDailyLine } from "../corridor-strategy";
import { getScalingSafetyDailyLine } from "../scaling-safety";
import { isCommandCompositionRestricted, isSafeModeFeatureDisabled } from "../safe-mode";
import { buildControlTowerSnapshot, formatControlTowerDailyLine } from "../strategic-control-tower";
import { getUnitEconomicsDailyLine } from "../unit-economics";

type TFn = (key: string, vars?: Record<string, string>) => string;

export type DailyConsoleTickState = {
  es: number;
  aa: number;
  hc: number;
  fb: number;
  adp: number;
  ssf: number;
  ppr: number;
  ffd: number;
  cst: number;
  mtm: number;
  sct: number;
  oha: number;
  gsp: number;
  opm: number;
  efb: number;
  dwr: number;
  mflow: number;
  eclose: number;
};

export type DailyConsoleImmediateLines = {
  entitySnapBanner: ReturnType<typeof selectEntitySnapshotBannerCounts>;
  snapshotActionLine: string | null;
  assortmentLine: string | null;
  launchExecutionLine: string | null;
  collectionExecutionLine: string | null;
  heroExecutionLine: string | null;
  heroCommandLine: string | null;
};

export type DailyConsoleDeferredLines = {
  founderBriefSummary: { headline: string; sub: string } | null;
  economicPressureLine: string | null;
  unitEconomicsLine: string | null;
  guardrailLine: string | null;
  pricePressureLine: string | null;
  adPressureLine: string | null;
  scalingSafetyLine: string | null;
  productionPressureLine: string | null;
  fboFbsDecisionLine: string | null;
  corridorStrategyLine: string | null;
  marketTimingLine: string | null;
  controlTowerLine: string | null;
  executionFeedbackLine: string | null;
  osHealthAuditLine: string | null;
  guidedSetupLine: string | null;
  operatorModeLine: string | null;
  warRoomLine: string | null;
  morningFlowLine: string | null;
  eveningCloseLine: string | null;
  assortmentChecklistLine: string | null;
  assortmentReviewCarryLine: string | null;
  assortmentRepeatedBlockerLine: string | null;
  assortmentLearningLine: string | null;
  assortmentExecutiveReportLine: string | null;
};

export type DailyConsoleBuildInput = {
  t: TFn;
  locale: AppLocale;
  safeEnabled: boolean;
  safeDisabledKey: string;
};

export const EMPTY_DEFERRED_LINES: DailyConsoleDeferredLines = {
  founderBriefSummary: null,
  economicPressureLine: null,
  unitEconomicsLine: null,
  guardrailLine: null,
  pricePressureLine: null,
  adPressureLine: null,
  scalingSafetyLine: null,
  productionPressureLine: null,
  fboFbsDecisionLine: null,
  corridorStrategyLine: null,
  marketTimingLine: null,
  controlTowerLine: null,
  executionFeedbackLine: null,
  osHealthAuditLine: null,
  guidedSetupLine: null,
  operatorModeLine: null,
  warRoomLine: null,
  morningFlowLine: null,
  eveningCloseLine: null,
  assortmentChecklistLine: null,
  assortmentReviewCarryLine: null,
  assortmentRepeatedBlockerLine: null,
  assortmentLearningLine: null,
  assortmentExecutiveReportLine: null,
};

let immediateCache: { key: string; value: DailyConsoleImmediateLines } | null = null;
let deferredCache: { key: string; value: DailyConsoleDeferredLines } | null = null;
let assortmentDigestCache: { key: string; value: ReturnType<typeof buildAssortmentConsoleDigests> } | null = null;

export function invalidateDailyConsoleLineCache(): void {
  immediateCache = null;
  deferredCache = null;
  assortmentDigestCache = null;
}

export function buildDailyConsoleCacheKey(
  ticks: DailyConsoleTickState,
  locale: AppLocale,
  safeEnabled: boolean,
  safeDisabledKey: string,
): string {
  const snap = getActiveEntitySnapshot();
  const snapKey = snap ? snapshotRevisionKey(snap) : "none";
  const statusKey = snap ? getAssortmentStatusRevisionKey(snap.id) : "0";
  const tickKey = [
    ticks.es,
    ticks.aa,
    ticks.hc,
    ticks.fb,
    ticks.adp,
    ticks.ssf,
    ticks.ppr,
    ticks.ffd,
    ticks.cst,
    ticks.mtm,
    ticks.sct,
    ticks.oha,
    ticks.gsp,
    ticks.opm,
    ticks.efb,
    ticks.dwr,
    ticks.mflow,
    ticks.eclose,
  ].join(":");
  return `${snapKey}|${statusKey}|${locale}|${safeEnabled ? 1 : 0}|${safeDisabledKey}|${isCommandCompositionRestricted() ? 1 : 0}|${tickKey}`;
}

function getAssortmentDigests(input: DailyConsoleBuildInput, cacheKey: string) {
  if (assortmentDigestCache?.key === cacheKey) return assortmentDigestCache.value;
  const value = buildAssortmentConsoleDigests(input.t);
  assortmentDigestCache = { key: cacheKey, value };
  return value;
}

function buildImmediateLines(input: DailyConsoleBuildInput, cacheKey: string): DailyConsoleImmediateLines {
  const { t } = input;
  const assortment = getAssortmentDigests(input, cacheKey);
  const launchExecutionLine = getLaunchExecutionDailyDigestLine(t);
  const collectionExecutionLine = launchExecutionLine ? null : getCollectionExecutionDailyDigestLine(t);
  const heroExecutionLine =
    launchExecutionLine || collectionExecutionLine ? null : getHeroExecutionDailyDigestLine(t);
  const heroCommandLine =
    launchExecutionLine || collectionExecutionLine || heroExecutionLine ? null : getHeroCommandDailyDigestLine(t);

  const snapshot = getActiveEntitySnapshot();
  let snapshotActionLine: string | null = null;
  if (snapshot) {
    snapshotActionLine = formatSnapshotTopActionLine(t, deriveSnapshotIntelligence(snapshot));
  }

  return {
    entitySnapBanner: selectEntitySnapshotBannerCounts(),
    snapshotActionLine,
    assortmentLine: assortment?.dailyLine ?? null,
    launchExecutionLine,
    collectionExecutionLine,
    heroExecutionLine,
    heroCommandLine,
  };
}

function buildDeferredLines(input: DailyConsoleBuildInput, cacheKey: string): DailyConsoleDeferredLines {
  const { t, locale } = input;
  const assortment = getAssortmentDigests(input, cacheKey);

  const founderBriefSummary = isCommandCompositionRestricted()
    ? getFounderBriefDailySummaryFromCache(t)
    : getFounderBriefDailySummary(t);

  const productionPressureLine = isSafeModeFeatureDisabled("production_composition")
    ? getProductionPressureDailyLineCached(t)
    : getProductionPressureDailyLine(t);

  const operatorModeLine = isSafeModeFeatureDisabled("operator_work_order")
    ? formatOperatorModeDailyLine(peekOperatorBriefSession()?.brief ?? null, t)
    : formatOperatorModeDailyLine(buildOperatorBrief(t), t);

  const warRoomLine = isCommandCompositionRestricted()
    ? getDailyWarRoomDailyLineCached(t)
    : getDailyWarRoomDailyLine(t, locale);

  const controlTowerLine = isCommandCompositionRestricted()
    ? t("safe.console.controlTowerUnavailable")
    : formatControlTowerDailyLine(buildControlTowerSnapshot(t, locale), t);

  const executionFeedbackLine = isCommandCompositionRestricted()
    ? null
    : formatExecutionFeedbackDailyLine(t, locale);

  return {
    founderBriefSummary,
    economicPressureLine: getEconomicPressureDailyLine(t),
    unitEconomicsLine: getUnitEconomicsDailyLine(t),
    guardrailLine: formatGuardrailDailyLine(loadEconomicGuardrails(), t),
    pricePressureLine: getPricePressureDailyLine(t),
    adPressureLine: getAdvertisingPressureDailyLine(t),
    scalingSafetyLine: getScalingSafetyDailyLine(t),
    productionPressureLine,
    fboFbsDecisionLine: getFboFbsDecisionDailyLine(t),
    corridorStrategyLine: formatCorridorStrategyDailyLine(buildPrimaryCorridorStrategyReport(t), t),
    marketTimingLine: formatMarketTimingDailyLine(buildPrimaryMarketTimingReport(t), t),
    controlTowerLine,
    executionFeedbackLine,
    osHealthAuditLine: formatOsHealthAuditDailyLine(buildOsHealthAuditReport(), t),
    guidedSetupLine: formatGuidedSetupDailyLine(buildGuidedSetupPlan(undefined, t, locale), t),
    operatorModeLine,
    warRoomLine,
    morningFlowLine: getMorningFlowDailyLine(t, locale),
    eveningCloseLine: getEveningCloseDailyLine(t, locale),
    assortmentChecklistLine: assortment?.checklistLine ?? null,
    assortmentReviewCarryLine: assortment?.reviewCarryLine ?? null,
    assortmentRepeatedBlockerLine: assortment?.repeatedBlockerLine ?? null,
    assortmentLearningLine: assortment?.learningLine ?? null,
    assortmentExecutiveReportLine: assortment?.executiveReportLine ?? null,
  };
}

export function getCachedImmediateConsoleLines(
  cacheKey: string,
  input: DailyConsoleBuildInput,
): DailyConsoleImmediateLines {
  if (immediateCache?.key === cacheKey) return immediateCache.value;
  const value = buildImmediateLines(input, cacheKey);
  immediateCache = { key: cacheKey, value };
  return value;
}

export function getCachedDeferredConsoleLines(
  cacheKey: string,
  input: DailyConsoleBuildInput,
): DailyConsoleDeferredLines {
  if (deferredCache?.key === cacheKey) return deferredCache.value;
  const value = buildDeferredLines(input, cacheKey);
  deferredCache = { key: cacheKey, value };
  return value;
}

export function peekCachedDeferredConsoleLines(cacheKey: string): DailyConsoleDeferredLines | null {
  return deferredCache?.key === cacheKey ? deferredCache.value : null;
}

/** Merges immediate + deferred tiers for entity snap block rendering. */
export function mergeConsoleLineTiers(
  immediate: DailyConsoleImmediateLines,
  deferred: DailyConsoleDeferredLines,
) {
  return { ...deferred, ...immediate };
}
