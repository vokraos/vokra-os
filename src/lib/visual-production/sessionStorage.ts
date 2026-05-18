import { parseVisualProductionQueueEnvelope } from "./parseQueue";
import type { VisualProductionQueueEnvelope } from "./types";
import { VISUAL_PRODUCTION_SESSION_KEY } from "./types";

export function loadVisualProductionQueueFromSession(): VisualProductionQueueEnvelope | null {
  try {
    const raw = sessionStorage.getItem(VISUAL_PRODUCTION_SESSION_KEY);
    if (!raw) return null;
    return parseVisualProductionQueueEnvelope(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveVisualProductionQueueToSession(envelope: VisualProductionQueueEnvelope): void {
  const next: VisualProductionQueueEnvelope = { ...envelope, updatedAt: Date.now() };
  try {
    sessionStorage.setItem(VISUAL_PRODUCTION_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function clearVisualProductionSession(): void {
  try {
    sessionStorage.removeItem(VISUAL_PRODUCTION_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function queueToJsonString(envelope: VisualProductionQueueEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}
