import type { NavId } from "../../types";
import { ROLE_MODE_GLOBAL_NAV_IDS } from "../operating-role-mode/navMap";
import { CLEAN_DAY_PROTECTED_NAV_IDS } from "./types";

const PROTECTED = new Set<NavId>(CLEAN_DAY_PROTECTED_NAV_IDS as readonly NavId[]);

function uniqueNavIds(ids: NavId[]): NavId[] {
  const out: NavId[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export type SidebarNavLayoutInput = {
  primaryIds: NavId[];
  moreIds: NavId[];
  active: NavId;
  hiddenNavIds: readonly NavId[];
};

/**
 * Moves hidden ids from primary into "All modules" (more), except current page and protected ids.
 */
export function applyCleanDayToSidebarLayout(input: SidebarNavLayoutInput): {
  primaryIds: NavId[];
  moreIds: NavId[];
} {
  const globalSet = new Set<NavId>(ROLE_MODE_GLOBAL_NAV_IDS as readonly NavId[]);
  const hide = new Set<NavId>(
    input.hiddenNavIds.filter((id) => !PROTECTED.has(id) && !globalSet.has(id)),
  );
  if (!hide.size) {
    return { primaryIds: [...input.primaryIds], moreIds: [...input.moreIds] };
  }

  const primaryOut: NavId[] = [];
  const bumpedToMore: NavId[] = [];

  for (const id of input.primaryIds) {
    if (hide.has(id) && id !== input.active) {
      bumpedToMore.push(id);
      continue;
    }
    primaryOut.push(id);
  }

  if (input.active !== "home" && hide.has(input.active) && !primaryOut.includes(input.active)) {
    primaryOut.push(input.active);
  }

  const moreExisting = new Set(input.moreIds);
  const prepended: NavId[] = [];
  for (const id of bumpedToMore) {
    if (!moreExisting.has(id)) prepended.push(id);
  }
  const moreOut = uniqueNavIds([...prepended, ...input.moreIds]);

  return { primaryIds: primaryOut, moreIds: moreOut };
}

export function cleanDayHiddenSet(hiddenNavIds: readonly NavId[]): ReadonlySet<NavId> {
  const globalSet = new Set<NavId>(ROLE_MODE_GLOBAL_NAV_IDS as readonly NavId[]);
  return new Set(hiddenNavIds.filter((id) => !PROTECTED.has(id) && !globalSet.has(id)));
}
