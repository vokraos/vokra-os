import type { NavId } from "../../types";

/** Never removed from primary daily nav when Clean Day is on. */
export const CLEAN_DAY_PROTECTED_NAV_IDS: readonly NavId[] = ["memory", "safeMode", "osHealthAudit"] as const;

export type CleanDayModeState = {
  enabled: boolean;
  createdAt: number;
  hiddenNavIds: NavId[];
  sourceBacklogItemIds: string[];
  confidenceNote: string;
};

export const DEFAULT_CLEAN_DAY_MODE_STATE: CleanDayModeState = {
  enabled: false,
  createdAt: 0,
  hiddenNavIds: [],
  sourceBacklogItemIds: [],
  confidenceNote: "",
};
