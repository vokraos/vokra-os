import { buildDailyWarRoomSnapshot } from "../daily-war-room";
import type { AppLocale } from "../i18n/messages";
import { buildMorningOperatingFlow } from "./compose";
import { loadMorningFlowProgress, saveMorningFlowProgress, todayDateKey } from "./store";
import { MORNING_FLOW_EVENT, type MorningFlowStepId } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function notifyMorningFlowUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MORNING_FLOW_EVENT));
}

function persistPatch(
  patch: Partial<{
    completedSteps: MorningFlowStepId[];
    blockedSteps: MorningFlowStepId[];
    startSnapshot: ReturnType<typeof buildDailyWarRoomSnapshot> | null;
  }>,
  flowId: string,
): void {
  const prev = loadMorningFlowProgress();
  const dateKey = todayDateKey();
  saveMorningFlowProgress({
    dateKey,
    flowId: prev?.flowId ?? flowId,
    completedSteps: patch.completedSteps ?? prev?.completedSteps ?? [],
    blockedSteps: patch.blockedSteps ?? prev?.blockedSteps ?? [],
    startSnapshot: patch.startSnapshot !== undefined ? patch.startSnapshot : (prev?.startSnapshot ?? null),
    savedAt: Date.now(),
  });
  notifyMorningFlowUpdated();
}

export function markMorningStepDone(
  stepId: MorningFlowStepId,
  t: TFn,
  locale: AppLocale,
  flowId: string,
): ReturnType<typeof buildMorningOperatingFlow> {
  const prev = loadMorningFlowProgress();
  const completed = new Set(prev?.completedSteps ?? []);
  const blocked = new Set(prev?.blockedSteps ?? []);
  completed.add(stepId);
  blocked.delete(stepId);

  let startSnapshot = prev?.startSnapshot ?? null;
  if (stepId === "save_start_snapshot") {
    startSnapshot = buildDailyWarRoomSnapshot(t, locale);
  }

  persistPatch(
    { completedSteps: [...completed], blockedSteps: [...blocked], startSnapshot },
    flowId,
  );
  return buildMorningOperatingFlow(t, locale, flowId);
}

export function markMorningStepBlocked(
  stepId: MorningFlowStepId,
  t: TFn,
  locale: AppLocale,
  flowId: string,
): ReturnType<typeof buildMorningOperatingFlow> {
  const prev = loadMorningFlowProgress();
  const completed = new Set(prev?.completedSteps ?? []);
  const blocked = new Set(prev?.blockedSteps ?? []);
  blocked.add(stepId);
  completed.delete(stepId);
  persistPatch({ completedSteps: [...completed], blockedSteps: [...blocked] }, flowId);
  return buildMorningOperatingFlow(t, locale, flowId);
}

export function resetMorningStep(
  stepId: MorningFlowStepId,
  t: TFn,
  locale: AppLocale,
  flowId: string,
): ReturnType<typeof buildMorningOperatingFlow> {
  const prev = loadMorningFlowProgress();
  const completed = new Set(prev?.completedSteps ?? []);
  const blocked = new Set(prev?.blockedSteps ?? []);
  completed.delete(stepId);
  blocked.delete(stepId);
  persistPatch({ completedSteps: [...completed], blockedSteps: [...blocked] }, flowId);
  return buildMorningOperatingFlow(t, locale, flowId);
}
