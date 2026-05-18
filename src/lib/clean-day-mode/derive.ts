import type { NavId } from "../../types";
import { flattenSidebarNavIds } from "../../components/sidebarNavStructure";
import { loadSimplificationBacklogState } from "../simplification-backlog/storage";
import { CLEAN_DAY_PROTECTED_NAV_IDS, type CleanDayModeState } from "./types";

const ALL_NAV = new Set(flattenSidebarNavIds());
const PROTECTED = new Set<NavId>(CLEAN_DAY_PROTECTED_NAV_IDS as readonly NavId[]);

export function isKnownSidebarNavId(id: string): id is NavId {
  return ALL_NAV.has(id as NavId);
}

/** Accepted/done hide_from_daily only; valid NavId; strips protected. */
export function deriveCleanDayHiddenFromBacklog(): Pick<CleanDayModeState, "hiddenNavIds" | "sourceBacklogItemIds"> {
  const backlog = loadSimplificationBacklogState();
  const hiddenNavIds: NavId[] = [];
  const sourceBacklogItemIds: string[] = [];
  const seenNav = new Set<string>();

  if (!backlog?.items.length) {
    return { hiddenNavIds: [], sourceBacklogItemIds: [] };
  }

  for (const item of backlog.items) {
    if (item.itemType !== "hide_from_daily") continue;
    if (item.status !== "accepted" && item.status !== "done") continue;
    const nav = item.affectedModule;
    if (!nav || !isKnownSidebarNavId(nav)) continue;
    if (PROTECTED.has(nav)) continue;
    sourceBacklogItemIds.push(item.id);
    if (seenNav.has(nav)) continue;
    seenNav.add(nav);
    hiddenNavIds.push(nav);
  }

  return { hiddenNavIds, sourceBacklogItemIds };
}
