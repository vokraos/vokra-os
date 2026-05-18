import type { NavId } from "../../types";
import type { ReleaseChecklistItemId } from "./types";

export const RELEASE_CHECKLIST_ITEMS: readonly {
  id: ReleaseChecklistItemId;
  hintNav?: NavId;
}[] = [
  { id: "app_rendered", hintNav: "home" },
  { id: "safe_mode_not_active", hintNav: "safeMode" },
  { id: "report_warmup_complete_or_partial", hintNav: "osHealthAudit" },
  { id: "daily_operating_opens", hintNav: "home" },
  { id: "war_room_opens", hintNav: "warRoom" },
  { id: "founder_brief_opens", hintNav: "founderBrief" },
  { id: "production_pressure_opens", hintNav: "productionPressure" },
  { id: "operator_mode_opens", hintNav: "operatorMode" },
  { id: "project_memory_opens", hintNav: "memory" },
  { id: "guided_setup_opens", hintNav: "guidedSetup" },
  { id: "console_has_no_fatal_errors" },
  { id: "local_storage_readable", hintNav: "settings" },
  { id: "memory_reopen_available", hintNav: "memory" },
] as const;

export const RELEASE_CHECKLIST_ITEM_IDS: ReleaseChecklistItemId[] = RELEASE_CHECKLIST_ITEMS.map((r) => r.id);
