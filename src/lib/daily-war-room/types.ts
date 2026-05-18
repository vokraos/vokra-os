import type { NavId } from "../../types";

export const DAILY_WAR_ROOM_MEMORY_SCHEMA = "vokra.dailyWarRoom.v1" as const;
export const DAILY_WAR_ROOM_EVENT = "vokra:daily-war-room-updated" as const;

export type DailyWarRoomState = "clear" | "focused" | "pressured" | "overloaded" | "blocked";

export type WarRoomLine = {
  text: string;
  navId?: NavId;
};

export type DailyWarRoomSnapshot = {
  id: string;
  createdAt: number;
  dateLabel: string;
  dailyState: DailyWarRoomState;
  founderFocus: WarRoomLine;
  operatorFocus: WarRoomLine;
  productionFocus: WarRoomLine;
  launchFocus: WarRoomLine;
  heroFocus: WarRoomLine;
  scalingFocus: WarRoomLine;
  blockedItems: WarRoomLine[];
  postponeItems: WarRoomLine[];
  founderDecisions: WarRoomLine[];
  teamInstructions: WarRoomLine[];
  watchList: WarRoomLine[];
  nextRoute: WarRoomLine;
  confidenceNote: string;
};

export type DailyWarRoomMemoryPayload = {
  schema: typeof DAILY_WAR_ROOM_MEMORY_SCHEMA;
  savedAt: number;
  snapshot: DailyWarRoomSnapshot;
};
