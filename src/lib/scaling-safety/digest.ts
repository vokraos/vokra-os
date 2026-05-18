import { gatherScalingSafetyContext } from "./gather";
import { deriveScalingSafety } from "./derive";
import { formatScalingSafetyDailyLine } from "./integration";
import type { ScalingSafetyReport } from "./types";

export const SCALING_SAFETY_EVENT = "vokra:scaling-safety-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildScalingSafetyReport(t: TFn, existingId?: string): ScalingSafetyReport {
  return deriveScalingSafety(gatherScalingSafetyContext(t), existingId);
}

export function getScalingSafetyDailyLine(t: TFn): string | null {
  return formatScalingSafetyDailyLine(buildScalingSafetyReport(t), t);
}

export function notifyScalingSafetyUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SCALING_SAFETY_EVENT));
}
