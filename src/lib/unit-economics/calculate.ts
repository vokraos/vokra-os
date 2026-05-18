import type { MarginPressureLevel, UnitEconomicsCalculated, UnitEconomicsProfile } from "./types";

function n(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

export function marginPressureFromPercent(
  marginPercent: number,
  targetMarginPercent: number,
): MarginPressureLevel {
  if (marginPercent < 0) return "negative";
  if (marginPercent < 5 || marginPercent < targetMarginPercent - 12) return "dangerous";
  if (marginPercent < 12 || marginPercent < targetMarginPercent - 6) return "tight";
  if (marginPercent < targetMarginPercent - 1) return "acceptable";
  return "healthy";
}

export function calculateUnitEconomics(profile: UnitEconomicsProfile): UnitEconomicsCalculated {
  const salePrice = Math.max(0, n(profile.salePrice));
  const fixed =
    n(profile.blankCost) +
    n(profile.printCost) +
    n(profile.packagingCost) +
    n(profile.logisticsCost) +
    n(profile.fboCost) +
    n(profile.adCostEstimate);
  const pct = n(profile.commissionPercent) + n(profile.returnRiskPercent);
  const commissionAmt = salePrice * (n(profile.commissionPercent) / 100);
  const returnAmt = salePrice * (n(profile.returnRiskPercent) / 100);
  const estimatedGrossProfit = salePrice - fixed - commissionAmt - returnAmt;
  const estimatedMarginPercent = salePrice > 0 ? (estimatedGrossProfit / salePrice) * 100 : 0;

  const fixedNoAd =
    n(profile.blankCost) +
    n(profile.printCost) +
    n(profile.packagingCost) +
    n(profile.logisticsCost) +
    n(profile.fboCost);
  const breakEvenPrice = pct < 100 ? fixedNoAd / (1 - pct / 100) : 0;

  const targetProfit = salePrice * (n(profile.targetMarginPercent) / 100);
  const maxAdCostBeforeTargetBreak = Math.max(
    0,
    salePrice - fixedNoAd - commissionAmt - returnAmt - targetProfit,
  );

  const targetMarginGapPercent = estimatedMarginPercent - n(profile.targetMarginPercent);
  const marginPressureLevel = marginPressureFromPercent(estimatedMarginPercent, n(profile.targetMarginPercent));

  let safetyBandKey = "ue.safety.onTarget";
  const safetyBandVars: Record<string, string> = {
    gap: String(Math.round(targetMarginGapPercent * 10) / 10),
    target: String(n(profile.targetMarginPercent)),
  };
  if (targetMarginGapPercent < -0.5) {
    safetyBandKey = "ue.safety.belowTarget";
  } else if (targetMarginGapPercent > 0.5) {
    safetyBandKey = "ue.safety.aboveTarget";
  }

  return {
    estimatedGrossProfit: Math.round(estimatedGrossProfit * 100) / 100,
    estimatedMarginPercent: Math.round(estimatedMarginPercent * 10) / 10,
    breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
    maxAdCostBeforeTargetBreak: Math.round(maxAdCostBeforeTargetBreak * 100) / 100,
    marginPressureLevel,
    safetyBandKey,
    safetyBandVars,
    targetMarginGapPercent: Math.round(targetMarginGapPercent * 10) / 10,
  };
}

export function marginPressureRank(level: MarginPressureLevel): number {
  if (level === "negative") return 5;
  if (level === "dangerous") return 4;
  if (level === "tight") return 3;
  if (level === "acceptable") return 2;
  return 1;
}
