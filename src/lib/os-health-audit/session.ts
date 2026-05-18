import type { OsHealthAuditMemoryPayload } from "./types";

const OHA_SESSION_KEY = "vokra.osHealthAudit.state" as const;

export function saveOsHealthAuditSession(payload: OsHealthAuditMemoryPayload): void {
  try {
    sessionStorage.setItem(OHA_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekOsHealthAuditSession(): OsHealthAuditMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(OHA_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as OsHealthAuditMemoryPayload;
    return o?.report?.id ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromOsHealthAuditMemoryPayload(payload: OsHealthAuditMemoryPayload): void {
  saveOsHealthAuditSession(payload);
}
