import type { UnitEconomicsTemplate } from "./types";

/** Built-in template kinds — founder duplicates/edits; not auto-applied. */
export const TEMPLATE_PRODUCT_TYPES = [
  "regular_tshirt_fbs",
  "regular_tshirt_fbo",
  "oversize_fbs",
  "oversize_fbo",
  "premium_capsule",
  "corporate_merch",
  "exhibition_capsule",
  "hoodie_future",
  "outerwear_future",
] as const;

export type TemplateProductType = (typeof TEMPLATE_PRODUCT_TYPES)[number];

const BASE = {
  commissionPercent: 15,
  returnRiskPercent: 8,
  targetMarginPercent: 25,
  logisticsCost: 45,
  printCost: 120,
  packagingCost: 25,
};

export function presetTemplateDefaults(productType: TemplateProductType): Omit<
  UnitEconomicsTemplate,
  "id" | "name" | "createdAt" | "updatedAt"
> {
  const fbo = productType.includes("fbo");
  const oversize = productType.includes("oversize");
  const sale = oversize ? 2490 : productType.includes("premium") || productType.includes("exhibition") ? 3290 : 1990;
  return {
    productType,
    fitType: oversize ? "oversize" : productType.includes("hoodie") ? "hoodie" : productType.includes("outerwear") ? "outerwear" : "regular",
    marketplace: "WB/Ozon",
    stockMode: fbo ? "FBO" : "FBS",
    salePrice: sale,
    blankCost: oversize ? 520 : 380,
    printCost: BASE.printCost,
    packagingCost: BASE.packagingCost,
    commissionPercent: BASE.commissionPercent,
    logisticsCost: fbo ? 65 : BASE.logisticsCost,
    fboCost: fbo ? 85 : 0,
    adCostEstimate: fbo ? 55 : 42,
    returnRiskPercent: BASE.returnRiskPercent,
    targetMarginPercent: BASE.targetMarginPercent,
    notes: "",
  };
}

export function templateDisplayName(productType: TemplateProductType, t: (k: string) => string): string {
  return t(`ue.tpl.preset.${productType}`);
}
