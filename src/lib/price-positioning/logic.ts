import type { UnitEconomicsProfile } from "../unit-economics/types";
import type { UnitEconomicsResolvedMatch } from "../unit-economics/types";
import { newPricePositioningReportId } from "./ids";
import type { PricePositioningContext, PricePositioningReport, PricePressureLevel, PositioningRisk } from "./types";

function n(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

function computeTargetPrice(profile: UnitEconomicsProfile): number {
  const fixedNoAd =
    n(profile.blankCost) +
    n(profile.printCost) +
    n(profile.packagingCost) +
    n(profile.logisticsCost) +
    n(profile.fboCost);
  const pct = n(profile.commissionPercent) + n(profile.returnRiskPercent) + n(profile.targetMarginPercent);
  if (pct >= 100) return 0;
  return Math.round((fixedNoAd / (1 - pct / 100)) * 100) / 100;
}

function isPremiumCorridor(corridor?: string, productFamily?: string): boolean {
  const s = `${corridor ?? ""} ${productFamily ?? ""}`.toLowerCase();
  return /premium|luxury|capsule|archive|exhibition|corporate/.test(s);
}

function hasPremiumProof(notes?: string): boolean {
  const s = (notes ?? "").toLowerCase();
  return /proof|premium|brand|quality|certificate|отзыв|качество|бренд/.test(s);
}

function pricePressureLevelFromSignals(args: {
  salePrice: number;
  breakEven: number;
  marginPercent: number;
  targetMargin: number;
  adSafetyGap: number;
  premiumProofRequired: boolean;
  positioningRisk: PositioningRisk;
}): PricePressureLevel {
  const { salePrice, breakEven, marginPercent, targetMargin, adSafetyGap, premiumProofRequired, positioningRisk } =
    args;
  if (salePrice <= breakEven || marginPercent < 0) return "negative";
  if (salePrice <= breakEven * 1.06 || marginPercent < targetMargin - 10 || adSafetyGap < -8) return "dangerous";
  if (marginPercent < targetMargin - 4 || adSafetyGap < 0 || salePrice <= breakEven * 1.12) return "tight";
  if (
    marginPercent < targetMargin - 1 ||
    premiumProofRequired ||
    positioningRisk !== "none" ||
    adSafetyGap < 12
  ) {
    return "watch";
  }
  return "safe";
}

export function buildPricePositioningReport(
  resolved: UnitEconomicsResolvedMatch,
  ctx: PricePositioningContext = {},
  existingId?: string,
): PricePositioningReport {
  const { profile, calculated } = resolved;
  const salePrice = n(profile.salePrice);
  const breakEven = calculated.breakEvenPrice;
  const targetPrice = computeTargetPrice(profile);
  const marginGap = Math.round((calculated.estimatedMarginPercent - profile.targetMarginPercent) * 10) / 10;
  const adSafetyGap = Math.round((calculated.maxAdCostBeforeTargetBreak - profile.adCostEstimate) * 100) / 100;

  const warningKeys: string[] = [];
  let positioningRisk: PositioningRisk = "none";

  if (salePrice <= breakEven) warningKeys.push("ppr.warn.atOrBelowBreakEven");
  else if (salePrice <= breakEven * 1.08) warningKeys.push("ppr.warn.nearBreakEven");

  if (marginGap < -0.5) {
    warningKeys.push("ppr.warn.belowTargetMargin");
    positioningRisk = "below_target_margin";
  }

  if (profile.adCostEstimate > calculated.maxAdCostBeforeTargetBreak + 0.01) {
    warningKeys.push("ppr.warn.adsUnsafe");
    if (positioningRisk === "none") positioningRisk = "ads_unsafe";
  }

  const premiumCorridor = isPremiumCorridor(ctx.corridor ?? profile.corridor, ctx.productFamily ?? profile.productFamily);
  const premiumProofRequired =
    premiumCorridor &&
    salePrice >= targetPrice * 1.05 &&
    !hasPremiumProof(ctx.economicsNotes ?? profile.notes);

  if (premiumProofRequired) {
    warningKeys.push("ppr.warn.premiumProofRequired");
    positioningRisk = "premium_without_proof";
  }

  if (premiumCorridor && salePrice < targetPrice * 0.88 && salePrice > 0) {
    warningKeys.push("ppr.warn.lowPricePremiumCorridor");
    positioningRisk = "low_price_positioning";
  }

  const fbo = (profile.stockMode ?? "").toLowerCase().includes("fbo") || profile.fboCost > 0;
  if (fbo && (marginGap < -3 || salePrice <= breakEven * 1.1)) {
    warningKeys.push("ppr.warn.fboPricePressure");
    if (positioningRisk === "none") positioningRisk = "fbo_price_pressure";
  }

  if (premiumCorridor && salePrice > 0 && targetPrice > 0 && salePrice < breakEven * 1.15 && marginGap < 2) {
    warningKeys.push("ppr.warn.corridorMismatch");
    if (positioningRisk === "none") positioningRisk = "corridor_price_mismatch";
  }

  const pricePressureLevel = pricePressureLevelFromSignals({
    salePrice,
    breakEven,
    marginPercent: calculated.estimatedMarginPercent,
    targetMargin: profile.targetMarginPercent,
    adSafetyGap,
    premiumProofRequired,
    positioningRisk,
  });

  let recommendedPriceActionKey = "ppr.action.maintain";
  if (pricePressureLevel === "negative") recommendedPriceActionKey = "ppr.action.raiseAboveBreakEven";
  else if (pricePressureLevel === "dangerous") recommendedPriceActionKey = "ppr.action.reviewPriceAndAds";
  else if (premiumProofRequired) recommendedPriceActionKey = "ppr.action.premiumProofOrLowerPrice";
  else if (profile.adCostEstimate > calculated.maxAdCostBeforeTargetBreak) recommendedPriceActionKey = "ppr.action.reduceAds";
  else if (marginGap < -2) recommendedPriceActionKey = "ppr.action.raiseTowardTarget";

  const vars = {
    sale: String(salePrice),
    breakEven: String(breakEven),
    target: String(targetPrice),
    margin: String(calculated.estimatedMarginPercent),
    targetMargin: String(profile.targetMarginPercent),
    marginGap: String(marginGap),
    adGap: String(adSafetyGap),
    maxAd: String(Math.round(calculated.maxAdCostBeforeTargetBreak)),
    ad: String(Math.round(profile.adCostEstimate)),
    label: resolved.sourceLabel,
  };

  return {
    id: existingId ?? newPricePositioningReportId(),
    createdAt: Date.now(),
    sourceEconomicsProfileId: resolved.sourceKind === "profile" ? resolved.sourceId : profile.id.startsWith("eff-") ? null : profile.id,
    sourceTemplateId: resolved.templateId ?? null,
    sourceAssignmentId: resolved.assignmentId ?? null,
    targetLabel: ctx.corridor ?? profile.corridor ?? profile.name ?? resolved.sourceLabel,
    marketplace: profile.marketplace,
    stockMode: profile.stockMode,
    salePrice,
    breakEvenPrice: breakEven,
    targetPrice,
    estimatedMarginPercent: calculated.estimatedMarginPercent,
    marginGap,
    adSafetyGap,
    pricePressureLevel,
    positioningRisk,
    recommendedPriceActionKey,
    recommendedPriceActionVars: vars,
    premiumProofRequired,
    warningKeys: [...new Set(warningKeys)].slice(0, 8),
    confidenceNoteKey: "ppr.confidence.manual",
  };
}

export function pricePressureRank(level: PricePressureLevel): number {
  if (level === "negative") return 5;
  if (level === "dangerous") return 4;
  if (level === "tight") return 3;
  if (level === "watch") return 2;
  return 1;
}
