import { buildCapacityInterpretation } from "./capacity-context";
import { gatherProductionPressureContext } from "./gather";
import { buildProductionLoadSnapshot } from "./load-snapshot";
import { deriveProductionPressureReport } from "./recommendations";
import { deriveShiftRequirement } from "./shift-requirement";
import type { AppLocale } from "../i18n/messages";
import type { ProductionPressureReport } from "./types";

export const PRODUCTION_PRESSURE_EVENT = "vokra:production-pressure-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildProductionPressureReport(
  t: TFn,
  existingId?: string,
  locale: AppLocale = "en",
): ProductionPressureReport {
  const ctx = gatherProductionPressureContext(t, locale);
  const loadSnapshot = buildProductionLoadSnapshot(ctx);
  const capacity = buildCapacityInterpretation(loadSnapshot);
  const shiftRequirement = deriveShiftRequirement(loadSnapshot, capacity);
  return deriveProductionPressureReport(ctx, {
    loadSnapshot,
    capacity,
    shiftRequirement,
    existingId,
  });
}

export function notifyProductionPressureUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PRODUCTION_PRESSURE_EVENT));
}
