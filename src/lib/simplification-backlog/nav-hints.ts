import type { NavId } from "../../types";
import type { SimplificationBacklogState } from "./types";

/**
 * Nav ids from accepted/done hide_from_daily items (for future nav compression — do not auto-hide).
 */
export function navIdsAcceptedHideFromDaily(state: SimplificationBacklogState | null): NavId[] {
  if (!state) return [];
  const out: NavId[] = [];
  const seen = new Set<string>();
  for (const i of state.items) {
    if (i.itemType !== "hide_from_daily") continue;
    if (i.status !== "accepted" && i.status !== "done") continue;
    const nav = i.affectedModule;
    if (!nav) continue;
    if (seen.has(nav)) continue;
    seen.add(nav);
    out.push(nav);
  }
  return out;
}
