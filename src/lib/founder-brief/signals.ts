import { loadLastFounderBrief } from "./storage";
import type { FounderCommandBrief } from "./types";

export type FounderBriefSignals = {
  brief: FounderCommandBrief;
};

/** Last persisted founder brief only — never composes a new brief. */
export function getFounderBriefSignals(): FounderBriefSignals | null {
  const brief = loadLastFounderBrief();
  if (!brief?.id) return null;
  return { brief };
}
