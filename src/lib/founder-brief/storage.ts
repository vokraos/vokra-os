import { lsGet, lsSet } from "../storage";
import { FOUNDER_BRIEF_LAST_STORAGE_KEY, type FounderCommandBrief } from "./types";

export function loadLastFounderBrief(): FounderCommandBrief | null {
  const raw = lsGet(FOUNDER_BRIEF_LAST_STORAGE_KEY);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as FounderCommandBrief;
    return o?.id ? o : null;
  } catch {
    return null;
  }
}

export function saveLastFounderBrief(brief: FounderCommandBrief): void {
  try {
    lsSet(FOUNDER_BRIEF_LAST_STORAGE_KEY, JSON.stringify(brief));
  } catch {
    /* quota */
  }
}
