import { gatherEconomicPressureContext } from "../economic-pressure";
import { loadBundleForIntegrations, resolveUnitEconomics } from "../unit-economics";
import type { AdPressureGatherContext } from "./types";

export function gatherAdPressureContext(overrides?: Partial<Pick<AdPressureGatherContext, "corridor" | "marketplace" | "stockMode">>): AdPressureGatherContext {
  const econ = gatherEconomicPressureContext();
  const launchPlan = econ.launchPlan;
  const marketplace = overrides?.marketplace ?? launchPlan?.marketplace ?? "WB/Ozon";
  const stockMode = overrides?.stockMode ?? "FBO";
  const corridor =
    overrides?.corridor ??
    launchPlan?.collectionName ??
    econ.intel?.corridorSummary[0]?.corridor ??
    "—";

  const ueBundle = loadBundleForIntegrations();
  const launchEcon = launchPlan
    ? resolveUnitEconomics(
        {
          collectionId: launchPlan.collectionId,
          corridor: launchPlan.collectionName,
          marketplace,
          stockMode,
        },
        ueBundle,
      )
    : resolveUnitEconomics({ corridor, marketplace, stockMode }, ueBundle);

  return { econ, launchEcon, corridor, marketplace, stockMode };
}
