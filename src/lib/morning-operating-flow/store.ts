import { lsGet, lsSet } from "../storage";
import type { DailyWarRoomSnapshot } from "../daily-war-room/types";
import type { MorningFlowStepId } from "./types";

const PROGRESS_KEY = "vokra.morningFlow.progress.v1" as const;

export type MorningFlowStoredProgress = {
  dateKey: string;
  flowId: string;
  completedSteps: MorningFlowStepId[];
  blockedSteps: MorningFlowStepId[];
  startSnapshot: DailyWarRoomSnapshot | null;
  savedAt: number;
};

export function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadMorningFlowProgress(): MorningFlowStoredProgress | null {
  try {
    const raw = lsGet(PROGRESS_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as MorningFlowStoredProgress;
    if (o?.dateKey !== todayDateKey()) return null;
    return {
      dateKey: o.dateKey,
      flowId: o.flowId ?? `mflow-${Date.now()}`,
      completedSteps: Array.isArray(o.completedSteps) ? o.completedSteps : [],
      blockedSteps: Array.isArray(o.blockedSteps) ? o.blockedSteps : [],
      startSnapshot: o.startSnapshot ?? null,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveMorningFlowProgress(progress: MorningFlowStoredProgress): void {
  lsSet(PROGRESS_KEY, JSON.stringify(progress));
}

export function clearMorningFlowProgress(): void {
  lsSet(PROGRESS_KEY, "");
}
