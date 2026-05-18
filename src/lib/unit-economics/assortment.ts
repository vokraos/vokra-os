import type { AssortmentAction } from "../assortment-actions/types";
import { resolveUnitEconomics } from "./resolve";
import { profileLabel } from "./match";
import { templateLabel } from "./template-utils";
import type { UnitEconomicsBundle } from "./types";

/** Add explainability only — does not change scores. */
export function augmentAssortmentWithUnitEconomics(
  action: AssortmentAction,
  bundle: UnitEconomicsBundle,
): Partial<Pick<AssortmentAction, "riskReasons" | "leverageReasons" | "trustNote" | "titleVars">> {
  const resolved = resolveUnitEconomics(
    { corridor: action.corridor, marketplace: action.marketplace, productFamily: action.titleVars.productFamily },
    bundle,
  );
  if (!resolved) return {};

  const { calculated, profile } = resolved;
  const riskReasons = [...action.riskReasons];
  const leverageReasons = [...action.leverageReasons];
  const tpl = resolved.templateId ? bundle.templates.find((x) => x.id === resolved.templateId) : undefined;
  const sourceName =
    tpl && (resolved.sourceKind === "template" || resolved.sourceKind === "assignment")
      ? templateLabel(tpl)
      : profileLabel(profile);

  const titleVars = {
    ...action.titleVars,
    ueLabel: profileLabel(profile),
    ueSource: sourceName,
    ueSourceKind: resolved.sourceKind,
    ueMargin: String(calculated.estimatedMarginPercent),
    ueLevel: calculated.marginPressureLevel,
    ueMaxAd: String(Math.round(calculated.maxAdCostBeforeTargetBreak)),
    ueAd: String(Math.round(profile.adCostEstimate)),
  };

  const marginKey = "aa.explain.risk.unitMargin";
  if (!riskReasons.includes(marginKey)) riskReasons.push(marginKey);

  const tplKey = "aa.explain.risk.unitEconomicsSource";
  if (resolved.sourceKind === "template" || resolved.sourceKind === "assignment") {
    if (!riskReasons.includes(tplKey)) riskReasons.push(tplKey);
  }

  if (
    calculated.marginPressureLevel === "dangerous" ||
    calculated.marginPressureLevel === "negative" ||
    calculated.marginPressureLevel === "tight"
  ) {
    const expKey = "aa.explain.risk.unitExpansionUnsafe";
    if (!riskReasons.includes(expKey)) riskReasons.push(expKey);
  }

  if (profile.adCostEstimate > calculated.maxAdCostBeforeTargetBreak) {
    const adKey = "aa.explain.risk.unitAdUnsafe";
    if (!riskReasons.includes(adKey)) leverageReasons.push(adKey);
  } else if (calculated.marginPressureLevel === "healthy") {
    const safeKey = "aa.explain.leverage.unitExpansionBand";
    if (!leverageReasons.includes(safeKey)) leverageReasons.push(safeKey);
  }

  return {
    riskReasons: riskReasons.slice(0, 6),
    leverageReasons: leverageReasons.slice(0, 5),
    trustNote: "aa.trust.unitEconomicsManual",
    titleVars,
  };
}
