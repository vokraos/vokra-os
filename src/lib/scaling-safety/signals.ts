import { peekScalingSafetySession } from "./session";
import type { ScalingMode, ScalingSafetyLevel } from "./types";

export type ScalingSafetySignals = {
  safetyLevel: ScalingSafetyLevel;
  scalingMode: ScalingMode;
};

/** Cached scaling safety only — never builds a report. */
export function getScalingSafetySignals(): ScalingSafetySignals | null {
  const report = peekScalingSafetySession()?.report;
  if (!report) return null;
  return { safetyLevel: report.safetyLevel, scalingMode: report.scalingMode };
}
