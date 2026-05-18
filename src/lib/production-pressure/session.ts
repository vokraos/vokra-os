import { restoreCapacityProfilesFromMemory } from "./capacity-store";
import { restoreShiftScenariosFromMemory } from "./shift-store";
import type { ProductionPressureMemoryPayload } from "./types";

const PPR_SESSION_KEY = "vokra.productionPressure.state" as const;

export function saveProductionPressureSession(payload: ProductionPressureMemoryPayload): void {
  try {
    sessionStorage.setItem(PPR_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekProductionPressureSession(): ProductionPressureMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(PPR_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as ProductionPressureMemoryPayload;
    return o?.report ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromProductionPressureMemoryPayload(payload: ProductionPressureMemoryPayload): void {
  if (payload.capacityProfiles?.length) {
    restoreCapacityProfilesFromMemory(payload.capacityProfiles, payload.activeProfileId ?? null);
  }
  if (payload.shiftScenarios?.length) {
    restoreShiftScenariosFromMemory(payload.shiftScenarios, payload.activeScenarioId ?? null);
  }
  saveProductionPressureSession(payload);
}
