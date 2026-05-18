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
import { gatherScalingSafetyContext } from "../scaling-safety/gather";
import { deriveScalingSafety } from "../scaling-safety/derive";
import { loadBundleForIntegrations, resolveUnitEconomics } from "../unit-economics";
import type { FboFbsDecisionGatherContext } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function gatherFboFbsDecisionContext(t: TFn): FboFbsDecisionGatherContext {
  const econCtx = gatherEconomicPressureContext();
  const econReport = buildEconomicPressureReport(econCtx, t);
  const scalingReport = deriveScalingSafety(gatherScalingSafetyContext(t));
  const guardrails = loadEconomicGuardrails(guardrailContextFromPressure(econReport));
  const launchPlan = econCtx.launchPlan;
  const marketplace = launchPlan?.marketplace ?? "WB/Ozon";
  const corridor =
    launchPlan?.collectionName ?? econCtx.intel?.corridorSummary[0]?.corridor ?? "—";
  const targetLabel = launchPlan?.collectionName ?? corridor;

  const ueBundle = loadBundleForIntegrations();
  const launchEconFbo = launchPlan
    ? resolveUnitEconomics(
        {
          collectionId: launchPlan.collectionId,
          corridor,
          marketplace,
          stockMode: "FBO",
        },
        ueBundle,
      )
    : resolveUnitEconomics({ corridor, marketplace, stockMode: "FBO" }, ueBundle);

  const priceReport = launchPlan
    ? buildLaunchPriceReport({ collectionId: launchPlan.collectionId, corridor, marketplace, stockMode: "FBO" })
    : launchEconFbo
      ? buildLaunchPriceReport({ corridor, marketplace, stockMode: "FBO" })
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
    scalingReport,
    guardrails,
    launchPlan,
    priceReport,
    adReport,
    launchEconFbo,
    executionPlan,
    targetLabel,
    corridor,
    marketplace,
  };
}

export function inferCurrentStockMode(ctx: FboFbsDecisionGatherContext): string {
  const fbo = ctx.econCtx.intel?.fboExposureSummary;
  if (!fbo) return ctx.launchEconFbo?.profile.stockMode ?? "unknown";
  if (fbo.fboLikeRows > 0 && fbo.fbsLikeRows > 0) return "mixed";
  if (fbo.fboLikeRows > fbo.fbsLikeRows) return "FBO";
  if (fbo.fbsLikeRows > 0) return "FBS";
  return "unknown";
}
