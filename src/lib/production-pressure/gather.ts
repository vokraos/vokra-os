import {
  buildAssortmentExecutionPlan,
  deriveAssortmentActions,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { getExecutionFeedbackSignals } from "../execution-feedback";
import { getFboFbsSignals } from "../fbo-fbs-decision/signals";
import { getActiveEntitySnapshot, deriveSnapshotIntelligence } from "../entity-snapshot";
import { loadVisualProductionQueueFromSession } from "../visual-production/sessionStorage";
import { loadCardProductionBoardFromSession } from "../card-production/sessionStorage";
import { peekLaunchOpsSession } from "../launch-ops/session";
import { getScalingSafetySignals } from "../scaling-safety/signals";
import { applyProductionInputToContext } from "../production-input";
import type { AppLocale } from "../i18n/messages";
import type { ProductionPressureGatherContext } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function waveActive(status: string): boolean {
  return status === "in_progress" || status === "ready" || status === "pending";
}

export function gatherProductionPressureContext(t: TFn, _locale: AppLocale = "en"): ProductionPressureGatherContext {
  const snapshot = getActiveEntitySnapshot();
  const launchSession = peekLaunchOpsSession();
  const launchPlan = launchSession?.plan ?? null;
  const intel = snapshot ? deriveSnapshotIntelligence(snapshot) : null;

  let executionPlan = null;
  let todayActionCount = 0;
  let weekActionCount = 0;
  let launchActionCount = 0;
  let refreshActionCount = 0;

  if (snapshot) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    executionPlan = buildAssortmentExecutionPlan(snapshot.id, merged);
    todayActionCount = executionPlan.todayActions.length;
    weekActionCount = executionPlan.weekActions.length;
    launchActionCount = [...executionPlan.todayActions, ...executionPlan.weekActions].filter(
      (a) => a.actionType === "launch_wave" || a.launchDerived,
    ).length;
    refreshActionCount = [...executionPlan.todayActions, ...executionPlan.weekActions].filter(
      (a) => a.actionType === "refresh_visual" || a.actionType === "archive_weak_sku",
    ).length;
  }

  const visualQueue = loadVisualProductionQueueFromSession();
  const visualQueueCount =
    visualQueue?.jobs.filter((j) => j.status !== "approved" && j.status !== "rejected").length ?? 0;

  const cardBoard = loadCardProductionBoardFromSession();
  const cardDraftCount =
    cardBoard?.plans.filter((p) => p.cardStatus === "draft" || p.cardStatus === "assembling").length ?? 0;

  const waves = launchPlan
    ? [launchPlan.heroWave, launchPlan.supportWave, launchPlan.expansionWave, launchPlan.archiveRefreshWave]
    : [];
  const activeWaveCount = waves.filter((w) => waveActive(w.status)).length;
  const heroActive = launchPlan ? waveActive(launchPlan.heroWave.status) : false;
  const refreshActive = launchPlan ? waveActive(launchPlan.archiveRefreshWave.status) : false;
  const supportActive = launchPlan ? waveActive(launchPlan.supportWave.status) : false;
  const overlappingWaves =
    (heroActive && refreshActive) ||
    (heroActive && supportActive && launchPlan?.launchReadiness !== "ready") ||
    activeWaveCount >= 3;

  const skuCount = snapshot?.skuEntities.length ?? 0;
  const cardCount = snapshot?.cardEntities.length ?? 0;
  const supportSkuDensity = skuCount > 0 ? Math.min(100, Math.round((cardCount / skuCount) * 40)) : 0;

  const launchPressure = launchPlan?.launchPressure ?? 0;
  const fboPressure = launchPlan?.fboPressure ?? 0;
  const fbsPressure = launchPlan?.fbsPressure ?? 0;

  const heuristicOrchestration = applyProductionInputToContext({
    visualQueueCount,
    orchestrationDtf: Math.min(100, Math.round(launchPressure * 0.4 + visualQueueCount * 6)),
    orchestrationPackaging: Math.min(100, Math.round(launchPressure * 0.35 + cardDraftCount * 8)),
  });

  return {
    snapshotId: snapshot?.id ?? null,
    targetLabel: launchPlan?.collectionName ?? launchPlan?.heroWave.title ?? "—",
    corridor: launchPlan?.collectionName ?? intel?.corridorSummary[0]?.corridor ?? "—",
    launchPlan,
    executionPlan,
    scalingSignals: getScalingSafetySignals(),
    feedbackSignals: getExecutionFeedbackSignals(t),
    fboSignals: getFboFbsSignals(),
    todayActionCount,
    weekActionCount,
    launchActionCount,
    refreshActionCount,
    visualQueueCount: heuristicOrchestration.visualQueueCount,
    cardDraftCount,
    activeWaveCount,
    overlappingWaves,
    supportSkuDensity,
    orchestrationPackaging: heuristicOrchestration.orchestrationPackaging,
    orchestrationDtf: heuristicOrchestration.orchestrationDtf,
    launchPressure,
    fboPressure,
    fbsPressure,
  };
}
