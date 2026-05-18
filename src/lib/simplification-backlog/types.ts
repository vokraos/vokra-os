import type { NavId } from "../../types";

export type SimplificationItemType =
  | "hide_from_daily"
  | "rename"
  | "compress"
  | "move_up"
  | "remove_duplicate"
  | "wording"
  | "navigation"
  | "workflow_fix"
  | "data_gap";

export type SimplificationSeverity = "low" | "medium" | "high" | "critical";

export type SimplificationEffort = "small" | "medium" | "large";

export type SimplificationItemStatus = "open" | "accepted" | "done" | "deferred" | "rejected";

export type SimplificationBacklogItem = {
  id: string;
  createdAt: number;
  sourceDebriefId: string;
  sourcePilotId: string;
  itemType: SimplificationItemType;
  title: string;
  reason: string;
  /** Primary nav / module id when applicable. */
  affectedModule: NavId | "";
  severity: SimplificationSeverity;
  effort: SimplificationEffort;
  status: SimplificationItemStatus;
  suggestedFix: string;
  confidenceNote: string;
};

export type SimplificationBacklogState = {
  items: SimplificationBacklogItem[];
  updatedAt: number;
};
