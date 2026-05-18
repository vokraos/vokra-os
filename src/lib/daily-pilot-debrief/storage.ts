import { lsGet, lsSet } from "../storage";
import type { DailyPilotScreenKey, DailyPilotStepId, DailyPilotVerdict } from "../daily-operations-pilot/types";
import type { DailyPilotDebrief } from "./types";
import { DAILY_PILOT_STEP_ORDER } from "../daily-operations-pilot/steps";

export const DAILY_PILOT_DEBRIEF_DRAFT_KEY = "vokra.dailyPilotDebrief.draft.v1" as const;
export const DAILY_PILOT_DEBRIEF_RESTORE_SESSION_KEY = "vokra.dailyPilotDebrief.restore.v1" as const;
export const DAILY_PILOT_DEBRIEF_CHANGED_EVENT = "vokra.dailyPilotDebrief.changed" as const;

/** Warn in OS Health Audit when pilot marks this many+ surfaces as confusing. */
export const DAILY_PILOT_CONFUSING_WARN_THRESHOLD = 3;

function isStepId(x: unknown): x is DailyPilotStepId {
  return typeof x === "string" && (DAILY_PILOT_STEP_ORDER as readonly string[]).includes(x);
}

function sanitizeSkipped(raw: unknown): DailyPilotStepId[] {
  if (!Array.isArray(raw)) return [];
  const out: DailyPilotStepId[] = [];
  for (const v of raw) {
    if (isStepId(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

const PILOT_SCREEN_KEYS: readonly DailyPilotScreenKey[] = [
  "release_check",
  "morning_start",
  "war_room",
  "operator_mode",
  "production_pressure",
  "evening_close",
  "daily_pilot",
];

function isScreenKey(x: unknown): x is DailyPilotScreenKey {
  return typeof x === "string" && (PILOT_SCREEN_KEYS as readonly string[]).includes(x);
}

function sanitizeScreens(raw: unknown): DailyPilotScreenKey[] {
  if (!Array.isArray(raw)) return [];
  const out: DailyPilotScreenKey[] = [];
  for (const v of raw) {
    if (isScreenKey(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

function sanitizeVerdict(x: unknown): DailyPilotVerdict {
  if (
    x === "ready_for_daily_use" ||
    x === "usable_with_friction" ||
    x === "too_complex" ||
    x === "blocked"
  ) {
    return x;
  }
  return "usable_with_friction";
}

export function parseDailyPilotDebriefPayload(raw: string): DailyPilotDebrief | null {
  try {
    const o = JSON.parse(raw) as Partial<DailyPilotDebrief>;
    if (!o || typeof o !== "object") return null;
    if (typeof o.id !== "string" || !o.id.trim()) return null;
    if (typeof o.createdAt !== "number" || !Number.isFinite(o.createdAt)) return null;
    if (typeof o.sourcePilotId !== "string" || !o.sourcePilotId.trim()) return null;

    return {
      id: o.id.trim(),
      createdAt: o.createdAt,
      sourcePilotId: o.sourcePilotId.trim(),
      dateLabel: typeof o.dateLabel === "string" ? o.dateLabel : "",
      pilotVerdict: sanitizeVerdict(o.pilotVerdict),
      workedWell: typeof o.workedWell === "string" ? o.workedWell : "",
      causedFriction: typeof o.causedFriction === "string" ? o.causedFriction : "",
      skippedScreens: sanitizeSkipped(o.skippedScreens),
      confusingScreens: sanitizeScreens(o.confusingScreens),
      missingData: typeof o.missingData === "string" ? o.missingData : "",
      recommendedSimplifications: typeof o.recommendedSimplifications === "string" ? o.recommendedSimplifications : "",
      recommendedFixes: typeof o.recommendedFixes === "string" ? o.recommendedFixes : "",
      hideFromDailyUseCandidates: sanitizeScreens(o.hideFromDailyUseCandidates),
      keepInDailyUse: sanitizeScreens(o.keepInDailyUse),
      nextPilotRecommendation: typeof o.nextPilotRecommendation === "string" ? o.nextPilotRecommendation : "",
      confidenceNote: typeof o.confidenceNote === "string" ? o.confidenceNote : "",
    };
  } catch {
    return null;
  }
}

export function loadPilotDebriefDraft(): DailyPilotDebrief | null {
  const raw = lsGet(DAILY_PILOT_DEBRIEF_DRAFT_KEY);
  if (!raw?.trim()) return null;
  return parseDailyPilotDebriefPayload(raw);
}

export function savePilotDebriefDraft(d: DailyPilotDebrief) {
  lsSet(DAILY_PILOT_DEBRIEF_DRAFT_KEY, JSON.stringify(d));
}

export function notifyPilotDebriefChanged() {
  try {
    window.dispatchEvent(new Event(DAILY_PILOT_DEBRIEF_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function queueDailyPilotDebriefRestore(serialized: string) {
  try {
    sessionStorage.setItem(DAILY_PILOT_DEBRIEF_RESTORE_SESSION_KEY, serialized);
  } catch {
    /* ignore */
  }
}

export function consumeDailyPilotDebriefRestore(): string | null {
  try {
    const v = sessionStorage.getItem(DAILY_PILOT_DEBRIEF_RESTORE_SESSION_KEY);
    sessionStorage.removeItem(DAILY_PILOT_DEBRIEF_RESTORE_SESSION_KEY);
    return v;
  } catch {
    return null;
  }
}

export function excerptDebriefFixes(text: string, maxLines: number): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd());
  return lines.filter((l) => l.length).slice(0, maxLines).join("\n");
}
