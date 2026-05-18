import type { DailyPilotScreenKey, DailyPilotStepId, DailyPilotVerdict } from "../daily-operations-pilot/types";

/** Filled only from pilot inputs + deterministic templates (no inference). */
export type DailyPilotDebrief = {
  id: string;
  createdAt: number;
  sourcePilotId: string;
  dateLabel: string;
  pilotVerdict: DailyPilotVerdict;
  workedWell: string;
  causedFriction: string;
  /** Pilot steps neither done nor blocked (treated as skipped for the day). */
  skippedScreens: DailyPilotStepId[];
  confusingScreens: DailyPilotScreenKey[];
  missingData: string;
  recommendedSimplifications: string;
  recommendedFixes: string;
  hideFromDailyUseCandidates: DailyPilotScreenKey[];
  keepInDailyUse: DailyPilotScreenKey[];
  nextPilotRecommendation: string;
  confidenceNote: string;
};
