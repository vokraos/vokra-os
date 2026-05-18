import type { DailyWarRoomState } from "../daily-war-room/types";

export const EVENING_CLOSE_MEMORY_SCHEMA = "vokra.eveningClose.v1" as const;
export const EVENING_CLOSE_EVENT = "vokra:evening-close-updated" as const;

export type TomorrowReadiness = "clear" | "manageable" | "pressured" | "unstable" | "blocked";

export type CloseLine = { text: string };

export type EveningCloseSnapshot = {
  id: string;
  createdAt: number;
  dateLabel: string;
  dateKey: string;
  dailyState: DailyWarRoomState;
  completedToday: CloseLine[];
  delayedToday: CloseLine[];
  blockedToday: CloseLine[];
  overloadedAreas: CloseLine[];
  productionIssues: CloseLine[];
  launchIssues: CloseLine[];
  heroIssues: CloseLine[];
  operatorIssues: CloseLine[];
  founderDecisionsForTomorrow: CloseLine[];
  tomorrowCarryForward: CloseLine[];
  tomorrowWarnings: CloseLine[];
  tomorrowReadiness: TomorrowReadiness;
  preloadMorningFocus: CloseLine[];
  confidenceNote: string;
};

export type EveningCloseMemoryPayload = {
  schema: typeof EVENING_CLOSE_MEMORY_SCHEMA;
  savedAt: number;
  snapshot: EveningCloseSnapshot;
};
