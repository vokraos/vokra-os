import type { SnapshotIntelligence } from "../../entity-snapshot/intelligence";
import type { AssortmentAction } from "../types";
import { corridorIsMixedFbo } from "./effort";
import { corridorTotalFor } from "./leverage";

const TRUST_NOTE_KEY = "aa.trust.noSalesData" as const;

function uniq(keys: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of keys) {
    if (!seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

/** Vars for reason keys that use `{n}`, `{corridor}`, etc. */
export function explainLineVars(a: AssortmentAction): Record<string, string> {
  const touched = a.affectedSkuIds.length + a.affectedCardIds.length;
  return {
    n: String(touched),
    skus: String(a.affectedSkuIds.length),
    cards: String(a.affectedCardIds.length),
    corridor: (a.corridor ?? "").trim() || "—",
    marketplace: (a.marketplace ?? "").trim() || "—",
  };
}

export function formatAssortmentReasonLine(
  t: (key: string, vars?: Record<string, string>) => string,
  a: AssortmentAction,
  key: string,
): string {
  const vars = { ...explainLineVars(a), ...a.titleVars };
  if (key === "aa.explain.risk.guardrail" && a.titleVars.egrTitleKey) {
    return `${t(a.titleVars.egrTitleKey, vars)} · ${t("egr.confidence.manual")}`;
  }
  if (key === "aa.explain.risk.unitEconomicsSource" && vars.ueSource) {
    return t(key, vars);
  }
  if (vars.pprLevel) {
    vars.pprLevel = t(`ppr.level.${vars.pprLevel}`);
  }
  if (vars.adpLevel) {
    vars.adpLevel = t(`adp.level.${vars.adpLevel}`);
  }
  if (key.startsWith("aa.explain.risk.price") || key.startsWith("aa.explain.risk.ad") || key.startsWith("aa.explain.risk.target")) {
    return t(key, vars);
  }
  if (
    key === "aa.explain.risk.adDependency" ||
    key === "aa.explain.risk.unsafeLaunchAds" ||
    key === "aa.explain.risk.saturationAdBurden"
  ) {
    return t(key, vars);
  }
  if (vars.ssfMode) {
    vars.ssfMode = t(`ssf.mode.${vars.ssfMode}`);
  }
  if (vars.ssfLevel) {
    vars.ssfLevel = t(`ssf.level.${vars.ssfLevel}`);
  }
  if (key === "aa.explain.risk.scalingSafety") {
    return t(key, vars);
  }
  if (vars.prodState) {
    vars.prodState = t(`ppr.state.${vars.prodState}`);
  }
  if (key === "aa.explain.risk.productionPressure") {
    return t(key, vars);
  }
  if (vars.prodShift) {
    vars.prodShift = t(`prod.shift.type.${vars.prodShift}`);
  }
  if (key === "aa.explain.risk.productionShift") {
    return t(key, vars);
  }
  if (key === "aa.explain.risk.shiftRequirement") {
    const scenario = vars.shiftReqScenario
      ? t(`prod.shift.type.${vars.shiftReqScenario}`)
      : vars.shiftReq
        ? t(`prod.shiftReq.type.${vars.shiftReq}`)
        : t("prod.shiftReq.type.switch_scenario");
    return t(key, { scenario });
  }
  if (vars.ffdMode) {
    vars.ffdMode = t(`ffd.mode.${vars.ffdMode}`);
  }
  if (vars.ffdReadiness) {
    vars.ffdReadiness = t(`ffd.readiness.${vars.ffdReadiness}`);
  }
  if (key === "aa.explain.risk.fboFbsDecision") {
    return t(key, vars);
  }
  if (vars.cstState) {
    vars.cstState = t(`cst.state.${vars.cstState}`);
  }
  if (vars.cstStrategy) {
    vars.cstStrategy = t(`cst.strategy.${vars.cstStrategy}`);
  }
  if (key === "aa.explain.risk.corridorStrategy") {
    return t(key, vars);
  }
  if (vars.mtmState) {
    vars.mtmState = t(`mtm.state.${vars.mtmState}`);
  }
  if (vars.mtmLaunchCadence) {
    vars.mtmLaunchCadence = t(`mtm.cadence.${vars.mtmLaunchCadence}`);
  }
  if (key === "aa.explain.risk.marketTiming") {
    return t(key, vars);
  }
  if (vars.egrSeverity) {
    vars.egrSeverity = t(`egr.severity.${vars.egrSeverity}`);
  }
  if (vars.egrType) {
    vars.egrType = t(`egr.type.${vars.egrType}`);
  }
  return t(key, vars);
}

export function buildAssortmentExplainability(
  intel: SnapshotIntelligence,
  a: AssortmentAction,
  dupClusters: number,
  maxTouch: number,
): Pick<AssortmentAction, "priorityReasons" | "leverageReasons" | "riskReasons" | "effortReasons" | "trustNote"> {
  const touched = a.affectedSkuIds.length + a.affectedCardIds.length;
  const topCorridor = intel.corridorSummary[0]?.corridor;
  const maxCorTotal = Math.max(1, intel.corridorSummary[0]?.total ?? 1);
  const corTot = corridorTotalFor(intel, a.corridor);
  const corRatio = a.corridor ? corTot / maxCorTotal : 0;
  const touchRatio = touched / maxTouch;

  const leverage: string[] = [];
  if (a.corridor && topCorridor && a.corridor === topCorridor) {
    leverage.push("aa.explain.leverage.largestCorridor");
  } else if (a.corridor && corRatio >= 0.35) {
    leverage.push("aa.explain.leverage.majorCorridor");
  }
  if (touched >= 16) leverage.push("aa.explain.leverage.manyEntities");
  else if (touched >= 6) leverage.push("aa.explain.leverage.severalEntities");
  if (a.leverageScore >= 72) leverage.push("aa.explain.leverage.scoreHigh");
  if (a.actionType === "create_collection" || a.actionType === "launch_wave") {
    leverage.push("aa.explain.leverage.growthShape");
  }
  if (a.actionType === "prepare_fbo" || a.actionType === "promote_hero_candidate") {
    leverage.push("aa.explain.leverage.opsAnchor");
  }

  const effort: string[] = [];
  if (corridorIsMixedFbo(intel, a.corridor)) effort.push("aa.explain.effort.mixedFboFbs");
  if (a.difficulty === "low" && (a.actionType === "improve_seo" || a.actionType === "assign_corridor")) {
    effort.push("aa.explain.effort.simpleFillIn");
  }
  if (a.effortScore <= 38) effort.push("aa.explain.effort.lowEffortBand");
  if (a.effortScore >= 72) effort.push("aa.explain.effort.heavyOperation");
  if (touchRatio < 0.06 && a.effortScore < 58) effort.push("aa.explain.effort.smallBatch");
  if (a.difficulty === "high") effort.push("aa.explain.effort.difficultyHigh");

  const risk: string[] = [];
  const mp = (a.marketplace ?? "").toLowerCase();
  if (!mp || mp === "unknown" || mp === "—") risk.push("aa.explain.risk.unknownMarketplace");
  if (a.actionType === "split_marketplace_group") risk.push("aa.explain.risk.channelMix");
  if (dupClusters > 0 && a.titleKey.includes("dup")) risk.push("aa.explain.risk.duplicateSkuCodes");
  if (a.category === "risk") risk.push("aa.explain.risk.riskCategory");
  if (a.operationalRisk >= 62) risk.push("aa.explain.risk.scoreHigh");
  if (a.actionType === "archive_weak_sku") risk.push("aa.explain.risk.weakRecords");
  if (a.priority === "critical") risk.push("aa.explain.risk.flaggedCritical");

  const priority: string[] = [];
  if (a.urgencyBand === "critical") priority.push("aa.explain.priority.urgencyCritical");
  else if (a.urgencyBand === "elevated") priority.push("aa.explain.priority.urgencyElevated");
  if (a.executiveQueues.includes("quick_wins")) priority.push("aa.explain.priority.taggedQuickWin");
  if (a.executiveQueues.includes("high_leverage")) priority.push("aa.explain.priority.taggedHighLeverage");
  if (a.executiveQueues.includes("risky_expansion")) priority.push("aa.explain.priority.taggedRiskyExpansion");
  if (a.executiveQueues.includes("requires_cleanup") && (a.category === "growth" || a.actionType === "launch_wave")) {
    priority.push("aa.explain.priority.cleanupBeforeGrowth");
  }
  if (a.executionPressure >= 70) priority.push("aa.explain.priority.highPressure");
  if (a.confidence <= 40) priority.push("aa.explain.priority.lowConfidenceSignal");

  return {
    leverageReasons: uniq(leverage),
    effortReasons: uniq(effort),
    riskReasons: uniq(risk),
    priorityReasons: uniq(priority),
    trustNote: TRUST_NOTE_KEY,
  };
}
