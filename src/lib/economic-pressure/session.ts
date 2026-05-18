import type { EconomicPressureMemoryPayload } from "./types";

const ECON_SESSION_KEY = "vokra.economicPressure.state" as const;

export function saveEconomicPressureSession(payload: EconomicPressureMemoryPayload): void {
  try {
    sessionStorage.setItem(ECON_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekEconomicPressureSession(): EconomicPressureMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(ECON_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as EconomicPressureMemoryPayload;
    return o?.report ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromEconomicPressureMemoryPayload(payload: EconomicPressureMemoryPayload): void {
  saveEconomicPressureSession(payload);
}
