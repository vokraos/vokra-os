/** Manual stability checklist before practical OS use (founder / developer). */

export type ReleaseChecklistItemId =
  | "app_rendered"
  | "safe_mode_not_active"
  | "report_warmup_complete_or_partial"
  | "daily_operating_opens"
  | "war_room_opens"
  | "founder_brief_opens"
  | "production_pressure_opens"
  | "operator_mode_opens"
  | "project_memory_opens"
  | "guided_setup_opens"
  | "console_has_no_fatal_errors"
  | "local_storage_readable"
  | "memory_reopen_available";

export type ReleaseVerdict = "ready" | "usable_with_warnings" | "needs_fix" | "blocked";

export type StabilityReleaseChecklist = {
  id: string;
  createdAt: number;
  releaseLabel: string;
  checkedItems: ReleaseChecklistItemId[];
  failedItems: ReleaseChecklistItemId[];
  warnings: string[];
  verdict: ReleaseVerdict;
  notes: string;
  confidenceNote: string;
};

export type ReleaseChecklistLastSummary = {
  updatedAt: number;
  checklistId: string;
  releaseLabel: string;
  verdict: ReleaseVerdict;
  failedItems: ReleaseChecklistItemId[];
  notesExcerpt: string;
};
