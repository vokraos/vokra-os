import { MORNING_FLOW_MEMORY_SCHEMA, type MorningFlowMemoryPayload, type MorningOperatingFlow } from "./types";
import type { MorningFlowStoredProgress } from "./store";

export function buildMorningFlowMemoryPayload(
  flow: MorningOperatingFlow,
  progress: MorningFlowStoredProgress,
): MorningFlowMemoryPayload {
  return {
    schema: MORNING_FLOW_MEMORY_SCHEMA,
    savedAt: Date.now(),
    flow,
    progress: {
      dateKey: progress.dateKey,
      completedSteps: progress.completedSteps,
      blockedSteps: progress.blockedSteps,
      startSnapshot: progress.startSnapshot,
    },
  };
}

export function parseMorningFlowMemoryPayload(raw: string): MorningFlowMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null) return null;
    const p = o as MorningFlowMemoryPayload;
    if (p.schema !== MORNING_FLOW_MEMORY_SCHEMA || !p.flow?.id) return null;
    return p;
  } catch {
    return null;
  }
}
