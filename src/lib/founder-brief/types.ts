import type { NavId } from "../../types";

export const FOUNDER_BRIEF_MEMORY_SCHEMA = "vokra.founderBrief.v1" as const;

export type BriefField = {
  text: string;
  navId: NavId;
};

export type FounderCommandBrief = {
  id: string;
  createdAt: number;
  activeSnapshotSummary: string;
  topTodayAction: BriefField;
  topBlockedItem: BriefField;
  highestLeverageMove: BriefField;
  heroStatus: BriefField;
  launchStatus: BriefField;
  collectionStatus: BriefField;
  dataStatus: BriefField;
  executionStatus: BriefField;
  memorySignal: BriefField;
  doNotTouch: BriefField;
  nextBestRoute: BriefField;
  confidenceNote: string;
  /** What shifted vs last saved brief (if any). */
  sinceLastReview: string;
};

export type FounderBriefMemoryPayload = {
  schema: typeof FOUNDER_BRIEF_MEMORY_SCHEMA;
  savedAt: number;
  brief: FounderCommandBrief;
};

export const FOUNDER_BRIEF_LAST_STORAGE_KEY = "vokra.founderBrief.last.v1" as const;
