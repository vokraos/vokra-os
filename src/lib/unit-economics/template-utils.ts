import type { UnitEconomicsMatchContext, UnitEconomicsProfile, UnitEconomicsTemplate } from "./types";

/** Build an effective profile from template — does not persist. */
export function templateToEffectiveProfile(
  template: UnitEconomicsTemplate,
  ctx?: UnitEconomicsMatchContext,
): UnitEconomicsProfile {
  const now = Date.now();
  return {
    id: `eff-${template.id}`,
    name: template.name,
    corridor: ctx?.corridor ?? "",
    productFamily: ctx?.productFamily ?? template.productType,
    marketplace: ctx?.marketplace ?? template.marketplace,
    stockMode: ctx?.stockMode ?? template.stockMode,
    salePrice: template.salePrice,
    blankCost: template.blankCost,
    printCost: template.printCost,
    packagingCost: template.packagingCost,
    commissionPercent: template.commissionPercent,
    logisticsCost: template.logisticsCost,
    fboCost: template.fboCost,
    adCostEstimate: template.adCostEstimate,
    returnRiskPercent: template.returnRiskPercent,
    targetMarginPercent: template.targetMarginPercent,
    notes: template.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyTemplateToProfile(
  profile: UnitEconomicsProfile,
  template: UnitEconomicsTemplate,
  keepIdentity = true,
): UnitEconomicsProfile {
  return {
    ...profile,
    name: keepIdentity ? profile.name || template.name : template.name,
    marketplace: profile.marketplace || template.marketplace,
    stockMode: profile.stockMode || template.stockMode,
    salePrice: template.salePrice,
    blankCost: template.blankCost,
    printCost: template.printCost,
    packagingCost: template.packagingCost,
    commissionPercent: template.commissionPercent,
    logisticsCost: template.logisticsCost,
    fboCost: template.fboCost,
    adCostEstimate: template.adCostEstimate,
    returnRiskPercent: template.returnRiskPercent,
    targetMarginPercent: template.targetMarginPercent,
    notes: template.notes ? `${profile.notes}\n${template.notes}`.trim() : profile.notes,
    productFamily: profile.productFamily || template.productType,
    updatedAt: Date.now(),
  };
}

export function profileFromTemplate(template: UnitEconomicsTemplate, id: string): UnitEconomicsProfile {
  const now = Date.now();
  const base = templateToEffectiveProfile(template);
  return { ...base, id, name: template.name, createdAt: now, updatedAt: now };
}

export function templateFromProfile(profile: UnitEconomicsProfile, id: string, name: string): UnitEconomicsTemplate {
  const now = Date.now();
  return {
    id,
    name,
    productType: profile.productFamily || "custom",
    fitType: "regular",
    marketplace: profile.marketplace,
    stockMode: profile.stockMode,
    salePrice: profile.salePrice,
    blankCost: profile.blankCost,
    printCost: profile.printCost,
    packagingCost: profile.packagingCost,
    commissionPercent: profile.commissionPercent,
    logisticsCost: profile.logisticsCost,
    fboCost: profile.fboCost,
    adCostEstimate: profile.adCostEstimate,
    returnRiskPercent: profile.returnRiskPercent,
    targetMarginPercent: profile.targetMarginPercent,
    notes: profile.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function templateLabel(template: UnitEconomicsTemplate): string {
  return template.name || template.productType || template.id;
}
