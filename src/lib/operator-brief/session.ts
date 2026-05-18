import type { OperatorBriefMemoryPayload } from "./types";

const OPB_SESSION_KEY = "vokra.operatorBrief.state" as const;

export function saveOperatorBriefSession(payload: OperatorBriefMemoryPayload): void {
  try {
    sessionStorage.setItem(OPB_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekOperatorBriefSession(): OperatorBriefMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(OPB_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as OperatorBriefMemoryPayload;
    return o?.brief?.id ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromOperatorBriefMemoryPayload(payload: OperatorBriefMemoryPayload): void {
  saveOperatorBriefSession(payload);
}
