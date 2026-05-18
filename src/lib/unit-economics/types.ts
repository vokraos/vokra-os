import type { EconomicGuardrail } from "../economic-guardrails/types";
import type { PricePositioningReport } from "../price-positioning/types";

export const UNIT_ECONOMICS_MEMORY_SCHEMA = "vokra.unitEconomics.v1" as const;
export const UNIT_ECONOMICS_MEMORY_SCHEMA_V2 = "vokra.unitEconomics.v2" as const;
export const UNIT_ECONOMICS_PROFILES_STORAGE_KEY = "vokra.unitEconomics.profiles" as const;
export const UNIT_ECONOMICS_TEMPLATES_STORAGE_KEY = "vokra.unitEconomics.templates" as const;
export const UNIT_ECONOMICS_ASSIGNMENTS_STORAGE_KEY = "vokra.unitEconomics.assignments" as const;

export type MarginPressureLevel = "healthy" | "acceptable" | "tight" | "dangerous" | "negative";

export type UnitEconomicsProfile = {
  id: string;
  name: string;
  corridor: string;
  productFamily: string;
  marketplace: string;
  stockMode: string;
  salePrice: number;
  blankCost: number;
  printCost: number;
  packagingCost: number;
  commissionPercent: number;
  logisticsCost: number;
  fboCost: number;
  adCostEstimate: number;
  returnRiskPercent: number;
  targetMarginPercent: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type UnitEconomicsTemplate = {
  id: string;
  name: string;
  productType: string;
  fitType: string;
  marketplace: string;
  stockMode: string;
  salePrice: number;
  blankCost: number;
  printCost: number;
  packagingCost: number;
  commissionPercent: number;
  logisticsCost: number;
  fboCost: number;
  adCostEstimate: number;
  returnRiskPercent: number;
  targetMarginPercent: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type UnitEconomicsAssignmentTargetType =
  | "corridor"
  | "product_family"
  | "collection"
  | "sku_group"
  | "launch_wave";

export type UnitEconomicsAssignment = {
  id: string;
  templateId: string | null;
  profileId: string | null;
  targetType: UnitEconomicsAssignmentTargetType;
  targetId: string;
  targetLabel: string;
  marketplace: string;
  stockMode: string;
  createdAt: number;
};

export type UnitEconomicsCalculated = {
  estimatedGrossProfit: number;
  estimatedMarginPercent: number;
  breakEvenPrice: number;
  maxAdCostBeforeTargetBreak: number;
  marginPressureLevel: MarginPressureLevel;
  safetyBandKey: string;
  safetyBandVars: Record<string, string>;
  targetMarginGapPercent: number;
};

export type UnitEconomicsProfileRow = {
  profile: UnitEconomicsProfile;
  calculated: UnitEconomicsCalculated;
};

export type UnitEconomicsMatchContext = {
  corridor?: string;
  productFamily?: string;
  productType?: string;
  fitType?: string;
  marketplace?: string;
  stockMode?: string;
  collectionId?: string;
  skuGroupId?: string;
  launchWaveId?: string;
};

export type EconomicsSourceKind = "assignment" | "profile" | "template" | "none";

export type UnitEconomicsResolvedMatch = {
  sourceKind: EconomicsSourceKind;
  sourceId: string;
  /** i18n key or plain label for display */
  sourceLabel: string;
  sourceLabelKey?: string;
  sourceLabelVars?: Record<string, string>;
  profile: UnitEconomicsProfile;
  calculated: UnitEconomicsCalculated;
  assignmentId?: string;
  templateId?: string;
};

export type UnitEconomicsBundle = {
  profiles: UnitEconomicsProfile[];
  templates: UnitEconomicsTemplate[];
  assignments: UnitEconomicsAssignment[];
};

export type TemplateCoverageSummary = {
  coveredCorridors: number;
  totalCorridors: number;
  uncoveredCorridors: string[];
};

export type UnitEconomicsMemoryPayload = {
  schema: typeof UNIT_ECONOMICS_MEMORY_SCHEMA | typeof UNIT_ECONOMICS_MEMORY_SCHEMA_V2;
  savedAt: number;
  profiles: UnitEconomicsProfile[];
  templates?: UnitEconomicsTemplate[];
  assignments?: UnitEconomicsAssignment[];
  guardrails?: EconomicGuardrail[];
  guardrailSummary?: string[];
  priceReports?: PricePositioningReport[];
};
