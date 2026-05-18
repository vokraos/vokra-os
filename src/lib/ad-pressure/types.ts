import type { EconomicPressureGatherContext } from "../economic-pressure/types";
import type { UnitEconomicsResolvedMatch } from "../unit-economics/types";

export const AD_PRESSURE_MEMORY_SCHEMA = "vokra.adPressure.v1" as const;

export type AdPressureLevel = "low" | "manageable" | "elevated" | "dangerous" | "critical";

export type AdvertisingPressureReport = {
  id: string;
  createdAt: number;
  corridor: string;
  marketplace: string;
  stockMode: string;
  adDependencyLevel: AdPressureLevel;
  launchAdPressure: AdPressureLevel;
  refreshAdPressure: AdPressureLevel;
  saturationPressure: AdPressureLevel;
  unsafeAdSpendRisk: AdPressureLevel;
  expansionAdRisk: AdPressureLevel;
  heroAdDependency: AdPressureLevel;
  recommendedActionKey: string;
  recommendedActionVars: Record<string, string>;
  warningKeys: string[];
  confidenceNoteKey: string;
};

export type AdPressureGatherContext = {
  econ: EconomicPressureGatherContext;
  launchEcon: UnitEconomicsResolvedMatch | null;
  corridor: string;
  marketplace: string;
  stockMode: string;
};

export type AdPressureMemoryPayload = {
  schema: typeof AD_PRESSURE_MEMORY_SCHEMA;
  savedAt: number;
  reports: AdvertisingPressureReport[];
  warnings?: string[];
  recommendations?: string[];
};
