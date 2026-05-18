import type { AdPressureMemoryPayload } from "./types";

const AD_SESSION_KEY = "vokra.adPressure.state" as const;

export function saveAdPressureSession(payload: AdPressureMemoryPayload): void {
  try {
    sessionStorage.setItem(AD_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekAdPressureSession(): AdPressureMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(AD_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as AdPressureMemoryPayload;
    return o?.reports?.length ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromAdPressureMemoryPayload(payload: AdPressureMemoryPayload): void {
  saveAdPressureSession(payload);
}
