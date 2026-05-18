import { lsGet, lsSet } from "../storage";
import type {
  DailyOperationsPilot,
  DailyPilotScreenKey,
  DailyPilotStepId,
  DailyPilotVerdict,
} from "./types";
import { DAILY_PILOT_STEP_ORDER } from "./steps";

export const DAILY_PILOT_DRAFT_KEY = "vokra.dailyOperationsPilot.draft.v1" as const;
export const DAILY_PILOT_RESTORE_SESSION_KEY = "vokra.dailyOperationsPilot.restore.v1" as const;
export const DAILY_PILOT_SAVED_EVENT = "vokra.dailyPilot.saved" as const;

function isStepId(x: unknown): x is DailyPilotStepId {
  return typeof x === "string" && (DAILY_PILOT_STEP_ORDER as readonly string[]).includes(x);
}

function sanitizeSteps(raw: unknown): DailyPilotStepId[] {
  if (!Array.isArray(raw)) return [];
  const out: DailyPilotStepId[] = [];
  for (const v of raw) {
    if (isStepId(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

const SCREEN_KEYS: readonly DailyPilotScreenKey[] = [
  "release_check",
  "morning_start",
  "war_room",
  "operator_mode",
  "production_pressure",
  "evening_close",
  "daily_pilot",
];

function isScreenKey(x: unknown): x is DailyPilotScreenKey {
  return typeof x === "string" && (SCREEN_KEYS as readonly string[]).includes(x);
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

function sanitizeCurrentStep(x: unknown): DailyPilotStepId {
  if (isStepId(x)) return x;
  return DAILY_PILOT_STEP_ORDER[0]!;
}

export function createEmptyDailyOperationsPilot(): DailyOperationsPilot {
  const now = Date.now();
  return {
    id: `dop_${now}`,
    createdAt: now,
    dateLabel: "",
    currentStep: DAILY_PILOT_STEP_ORDER[0]!,
    completedSteps: [],
    blockedSteps: [],
    morningStatus: "",
    operatorStatus: "",
    productionStatus: "",
    feedbackStatus: "",
    eveningCloseStatus: "",
    usefulScreens: [],
    confusingScreens: [],
    frictionNotes: "",
    missingData: "",
    finalVerdict: "usable_with_friction",
    recommendedFixes: "",
    confidenceNote: "",
  };
}

export function parseDailyOperationsPilotPayload(raw: string): DailyOperationsPilot | null {
  try {
    const o = JSON.parse(raw) as Partial<DailyOperationsPilot>;
    if (!o || typeof o !== "object") return null;
    if (typeof o.id !== "string" || !o.id.trim()) return null;
    if (typeof o.createdAt !== "number" || !Number.isFinite(o.createdAt)) return null;

    const completedSteps = sanitizeSteps(o.completedSteps);
    const blockedSteps = sanitizeSteps(o.blockedSteps);
    const overlap = completedSteps.filter((id) => blockedSteps.includes(id));
    const completed = completedSteps.filter((id) => !overlap.includes(id));
    const blocked = blockedSteps.filter((id) => !overlap.includes(id));

    return {
      id: o.id.trim(),
      createdAt: o.createdAt,
      dateLabel: typeof o.dateLabel === "string" ? o.dateLabel : "",
      currentStep: sanitizeCurrentStep(o.currentStep),
      completedSteps: completed,
      blockedSteps: blocked,
      morningStatus: typeof o.morningStatus === "string" ? o.morningStatus : "",
      operatorStatus: typeof o.operatorStatus === "string" ? o.operatorStatus : "",
      productionStatus: typeof o.productionStatus === "string" ? o.productionStatus : "",
      feedbackStatus: typeof o.feedbackStatus === "string" ? o.feedbackStatus : "",
      eveningCloseStatus: typeof o.eveningCloseStatus === "string" ? o.eveningCloseStatus : "",
      usefulScreens: sanitizeScreens(o.usefulScreens),
      confusingScreens: sanitizeScreens(o.confusingScreens),
      frictionNotes: typeof o.frictionNotes === "string" ? o.frictionNotes : "",
      missingData: typeof o.missingData === "string" ? o.missingData : "",
      finalVerdict: sanitizeVerdict(o.finalVerdict),
      recommendedFixes: typeof o.recommendedFixes === "string" ? o.recommendedFixes : "",
      confidenceNote: typeof o.confidenceNote === "string" ? o.confidenceNote : "",
    };
  } catch {
    return null;
  }
}

export function loadDailyPilotDraft(): DailyOperationsPilot | null {
  const raw = lsGet(DAILY_PILOT_DRAFT_KEY);
  if (!raw?.trim()) return null;
  return parseDailyOperationsPilotPayload(raw);
}

export function saveDailyPilotDraft(p: DailyOperationsPilot) {
  lsSet(DAILY_PILOT_DRAFT_KEY, JSON.stringify(p));
}

export function queueDailyPilotRestore(serialized: string) {
  try {
    sessionStorage.setItem(DAILY_PILOT_RESTORE_SESSION_KEY, serialized);
  } catch {
    /* quota */
  }
}

export function consumeDailyPilotRestore(): string | null {
  try {
    const v = sessionStorage.getItem(DAILY_PILOT_RESTORE_SESSION_KEY);
    sessionStorage.removeItem(DAILY_PILOT_RESTORE_SESSION_KEY);
    return v;
  } catch {
    return null;
  }
}

export function notifyDailyPilotSaved() {
  try {
    window.dispatchEvent(new Event(DAILY_PILOT_SAVED_EVENT));
  } catch {
    /* ignore */
  }
}

export { SCREEN_KEYS as DAILY_PILOT_SCREEN_KEYS };
