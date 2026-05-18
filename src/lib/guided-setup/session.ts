import type { GuidedSetupMemoryPayload } from "./types";

const GSP_SESSION_KEY = "vokra.guidedSetup.state" as const;

export function saveGuidedSetupSession(payload: GuidedSetupMemoryPayload): void {
  try {
    sessionStorage.setItem(GSP_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekGuidedSetupSession(): GuidedSetupMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(GSP_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as GuidedSetupMemoryPayload;
    return o?.plan?.id ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromGuidedSetupMemoryPayload(payload: GuidedSetupMemoryPayload): void {
  saveGuidedSetupSession(payload);
}
