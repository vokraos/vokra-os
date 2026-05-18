import type { IntegrationReadinessMemoryPayload } from "./types";

const SESSION_KEY = "vokra.integrationReadiness.lastSession.v1" as const;

export function saveIntegrationReadinessSession(payload: IntegrationReadinessMemoryPayload): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekIntegrationReadinessSession(): IntegrationReadinessMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as IntegrationReadinessMemoryPayload;
    return o?.report?.id ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromIntegrationReadinessMemoryPayload(
  payload: IntegrationReadinessMemoryPayload,
): void {
  saveIntegrationReadinessSession(payload);
}
