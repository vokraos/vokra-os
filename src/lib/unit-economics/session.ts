import type { UnitEconomicsMemoryPayload } from "./types";
import { saveUnitEconomicsBundle } from "./storage";

const UE_SESSION_KEY = "vokra.unitEconomics.state" as const;

export function saveUnitEconomicsSession(payload: UnitEconomicsMemoryPayload): void {
  try {
    sessionStorage.setItem(UE_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
  saveUnitEconomicsBundle({
    profiles: payload.profiles,
    templates: payload.templates ?? [],
    assignments: payload.assignments ?? [],
  });
}

export function peekUnitEconomicsSession(): UnitEconomicsMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(UE_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as UnitEconomicsMemoryPayload;
    return o?.profiles ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromUnitEconomicsMemoryPayload(payload: UnitEconomicsMemoryPayload): void {
  saveUnitEconomicsSession(payload);
}
