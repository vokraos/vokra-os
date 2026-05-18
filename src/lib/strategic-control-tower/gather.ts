import { buildPrimaryAdvertisingPressureReport } from "../ad-pressure";
import { buildPrimaryCorridorStrategyReport } from "../corridor-strategy";
import { buildEconomicPressureReport, gatherEconomicPressureContext } from "../economic-pressure";
import { loadEconomicGuardrails } from "../economic-guardrails";
import { buildFboFbsDecisionReport } from "../fbo-fbs-decision";
import { gatherFounderBriefContext } from "../founder-brief";
import { loadLastFounderBrief } from "../founder-brief/storage";
import { buildPrimaryMarketTimingReport } from "../market-timing";
import { peekLaunchOpsSession } from "../launch-ops/session";
import { loadLatestLaunchReviewForCollection } from "../launch-ops/review/storage";
import { buildLaunchPriceReport } from "../price-positioning";
import { buildScalingSafetyReport } from "../scaling-safety";
import { getActiveEntitySnapshot } from "../entity-snapshot";
import { buildHeroCommandSnapshot, gatherHeroWorkflowArtifacts, hasAnyHeroWorkflowSignal } from "../hero-command";
import {
  buildAssortmentExecutionPlan,
  deriveAssortmentActions,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { peekMarketTimingSession } from "../market-timing/session";
import { peekCorridorStrategySession } from "../corridor-strategy/session";
import { peekScalingSafetySession } from "../scaling-safety/session";
import { peekFboFbsDecisionSession } from "../fbo-fbs-decision/session";
import type { ControlTowerGatherContext } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function countSavedModuleHints(): number {
  let n = 0;
  if (peekMarketTimingSession()) n += 1;
  if (peekCorridorStrategySession()) n += 1;
  if (peekScalingSafetySession()) n += 1;
  if (peekFboFbsDecisionSession()) n += 1;
  if (peekLaunchOpsSession()) n += 1;
  return n;
}

export function gatherControlTowerContext(t: TFn): ControlTowerGatherContext {
  const snapshot = getActiveEntitySnapshot();
  const fbCtx = gatherFounderBriefContext();
  const founderBrief = loadLastFounderBrief();

  let executionPlan = fbCtx.executionPlan;
  if (snapshot && !executionPlan) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    executionPlan = buildAssortmentExecutionPlan(snapshot.id, merged);
  }

  const artifacts = gatherHeroWorkflowArtifacts();
  const heroSnapshot =
    hasAnyHeroWorkflowSignal(artifacts) || fbCtx.heroSnapshot
      ? fbCtx.heroSnapshot ?? buildHeroCommandSnapshot(artifacts)
      : null;

  const launchSession = peekLaunchOpsSession();
  const launchPlan = launchSession?.plan ?? fbCtx.launchPlan;
  const collectionId = launchPlan?.collectionId;
  const launchReview =
    fbCtx.launchReview ??
    (collectionId ? loadLatestLaunchReviewForCollection(collectionId) : null) ??
    launchSession?.review ??
    null;

  const econCtx = gatherEconomicPressureContext();
  const econReport = buildEconomicPressureReport(econCtx, t);
  const priceReport = launchPlan
    ? buildLaunchPriceReport({ collectionId: launchPlan.collectionId })
  : null;

  return {
    snapshot,
    founderBrief,
    executionPlan,
    heroSnapshot,
    launchPlan,
    launchReview,
    econReport,
    priceReport,
    adReport: buildPrimaryAdvertisingPressureReport(),
    scalingReport: buildScalingSafetyReport(t),
    fboReport: buildFboFbsDecisionReport(t),
    corridorReport: buildPrimaryCorridorStrategyReport(t),
    timingReport: buildPrimaryMarketTimingReport(t),
    guardrails: loadEconomicGuardrails(),
    savedModuleHints: countSavedModuleHints(),
  };
}
