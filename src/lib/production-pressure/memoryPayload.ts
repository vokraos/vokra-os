import { loadCapacityProfilesState } from "./capacity-store";
import { loadShiftScenariosState } from "./shift-store";
import {
  PRODUCTION_PRESSURE_MEMORY_SCHEMA,
  PRODUCTION_PRESSURE_MEMORY_SCHEMA_V2,
  PRODUCTION_PRESSURE_MEMORY_SCHEMA_V3,
  PRODUCTION_PRESSURE_MEMORY_SCHEMA_V4,
  PRODUCTION_PRESSURE_MEMORY_SCHEMA_V5,
  type ProductionPressureMemoryPayload,
  type ProductionPressureReport,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isValidSchema(s: unknown): boolean {
  return (
    s === PRODUCTION_PRESSURE_MEMORY_SCHEMA ||
    s === PRODUCTION_PRESSURE_MEMORY_SCHEMA_V2 ||
    s === PRODUCTION_PRESSURE_MEMORY_SCHEMA_V3 ||
    s === PRODUCTION_PRESSURE_MEMORY_SCHEMA_V4 ||
    s === PRODUCTION_PRESSURE_MEMORY_SCHEMA_V5
  );
}

export function parseProductionPressureMemoryPayload(raw: string): ProductionPressureMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || !isValidSchema(o.schema) || !isRecord(o.report)) return null;
    const report = o.report as ProductionPressureReport;
    if (typeof report.id !== "string") return null;
    return {
      schema: o.schema as ProductionPressureMemoryPayload["schema"],
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      report,
      bottlenecks: Array.isArray(o.bottlenecks) ? (o.bottlenecks as ProductionPressureMemoryPayload["bottlenecks"]) : undefined,
      dangerousZones: Array.isArray(o.dangerousZones) ? (o.dangerousZones as string[]) : undefined,
      recommendations: Array.isArray(o.recommendations) ? (o.recommendations as string[]) : undefined,
      capacityProfiles: Array.isArray(o.capacityProfiles)
        ? (o.capacityProfiles as ProductionPressureMemoryPayload["capacityProfiles"])
        : undefined,
      activeProfileId: typeof o.activeProfileId === "string" ? o.activeProfileId : o.activeProfileId === null ? null : undefined,
      loadSnapshot: isRecord(o.loadSnapshot) ? (o.loadSnapshot as ProductionPressureMemoryPayload["loadSnapshot"]) : undefined,
      capacityComparisons: isRecord(o.capacityComparisons)
        ? (o.capacityComparisons as ProductionPressureMemoryPayload["capacityComparisons"])
        : undefined,
      shiftScenarios: Array.isArray(o.shiftScenarios)
        ? (o.shiftScenarios as ProductionPressureMemoryPayload["shiftScenarios"])
        : undefined,
      activeScenarioId:
        typeof o.activeScenarioId === "string" ? o.activeScenarioId : o.activeScenarioId === null ? null : undefined,
      resolvedCapacity: isRecord(o.resolvedCapacity)
        ? (o.resolvedCapacity as ProductionPressureMemoryPayload["resolvedCapacity"])
        : undefined,
      shiftRequirement: isRecord(o.shiftRequirement)
        ? (o.shiftRequirement as ProductionPressureMemoryPayload["shiftRequirement"])
        : isRecord(report.shiftRequirement)
          ? report.shiftRequirement
          : undefined,
      dailyPlan: isRecord(o.dailyPlan)
        ? (o.dailyPlan as ProductionPressureMemoryPayload["dailyPlan"])
        : isRecord(report.dailyPlan)
          ? report.dailyPlan
          : undefined,
    };
  } catch {
    return null;
  }
}

export function buildProductionPressureMemoryPayload(
  report: ProductionPressureReport,
  extras?: Pick<
    ProductionPressureMemoryPayload,
    "bottlenecks" | "dangerousZones" | "recommendations"
  >,
): ProductionPressureMemoryPayload {
  const capState = loadCapacityProfilesState();
  const shiftState = loadShiftScenariosState();
  return {
    schema: PRODUCTION_PRESSURE_MEMORY_SCHEMA_V5,
    savedAt: Date.now(),
    report,
    shiftRequirement: report.shiftRequirement,
    dailyPlan: report.dailyPlan,
    bottlenecks: extras?.bottlenecks ?? report.operatorBottlenecks,
    dangerousZones: extras?.dangerousZones ?? report.dangerousZones,
    recommendations: extras?.recommendations ?? report.recommendedActions,
    capacityProfiles: capState.profiles,
    activeProfileId: capState.activeProfileId,
    loadSnapshot: report.loadSnapshot,
    capacityComparisons: report.capacity,
    shiftScenarios: shiftState.scenarios,
    activeScenarioId: shiftState.activeScenarioId,
    resolvedCapacity: report.resolvedCapacity,
  };
}
