import {
  buildAssortmentExecutionPlan,
  deriveAssortmentActions,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { buildPrimaryAdvertisingPressureReport } from "../ad-pressure";
import { getActiveEntitySnapshot } from "../entity-snapshot";
import { buildEconomicPressureReport, gatherEconomicPressureContext } from "../economic-pressure";
import { guardrailContextFromPressure, loadEconomicGuardrails } from "../economic-guardrails";
import { buildLaunchPriceReport } from "../price-positioning";
import { loadBundleForIntegrations, resolveUnitEconomics } from "../unit-economics";
import type { ScalingSafetyGatherContext } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function gatherScalingSafetyContext(t: TFn): ScalingSafetyGatherContext {
  const econCtx = gatherEconomicPressureContext();
  const econReport = buildEconomicPressureReport(econCtx, t);
  const guardrails = loadEconomicGuardrails(guardrailContextFromPressure(econReport));
  const launchPlan = econCtx.launchPlan;
  const marketplace = launchPlan?.marketplace ?? "WB/Ozon";
  const stockMode = "FBO";
  const corridor =
    launchPlan?.collectionName ?? econCtx.intel?.corridorSummary[0]?.corridor ?? "—";
  const targetLabel = launchPlan?.collectionName ?? corridor;

  const ueBundle = loadBundleForIntegrations();
  const launchEcon = launchPlan
    ? resolveUnitEconomics(
        {
          collectionId: launchPlan.collectionId,
          corridor: launchPlan.collectionId,
          marketplace,
          stockMode,
        },
        ueBundle,
      )
    : resolveUnitEconomics({ corridor, marketplace, stockMode }, ueBundle);

  const priceReport = launchPlan
    ? buildLaunchPriceReport({
        collectionId: launchPlan.collectionId,
        corridor,
        marketplace,
        stockMode,
      })
    : launchEcon
      ? buildLaunchPriceReport({ corridor, marketplace, stockMode })
      : null;

  const adReport = buildPrimaryAdvertisingPressureReport();

  let executionPlan = null;
  const snapshot = getActiveEntitySnapshot();
  if (snapshot) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    executionPlan = buildAssortmentExecutionPlan(snapshot.id, merged);
  }

  return {
    econCtx,
    econReport,
    priceReport,
    adReport,
    guardrails,
    launchPlan,
    heroFatigue: econCtx.heroFatigue,
    launchEcon,
    executionPlan,
    targetLabel,
    corridor,
    marketplace,
    stockMode,
  };
}

export function snapshotCleanupPressure(ctx: ScalingSafetyGatherContext): number {
  if (!ctx.econCtx.snapshot || !ctx.econCtx.intel) return 85;
  const ms = ctx.econCtx.intel.missingFieldSummary;
  const seo = ctx.econCtx.intel.seoGapSummary;
  let score = Math.min(50, ms.totalSlots * 2);
  score += Math.min(30, seo.cardsMissingSeo * 2);
  const cleanupHold = ctx.executionPlan?.holdActions.filter((a) =>
    a.executiveQueues.includes("requires_cleanup"),
  ).length;
  score += Math.min(25, (cleanupHold ?? 0) * 5);
  return Math.min(100, score);
}
