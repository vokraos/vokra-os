import type { DailyOperationsPilot } from "../daily-operations-pilot/types";
import { DAILY_PILOT_STEP_ORDER } from "../daily-operations-pilot/steps";
import type { DailyPilotDebrief } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

/**
 * Maps pilot fields into a debrief with template lines only — no extra conclusions.
 */
export function deriveDailyPilotDebrief(pilot: DailyOperationsPilot, t: TFn): DailyPilotDebrief {
  const now = Date.now();
  const skipped = DAILY_PILOT_STEP_ORDER.filter(
    (id) => !pilot.completedSteps.includes(id) && !pilot.blockedSteps.includes(id),
  );

  const blockedLabels = pilot.blockedSteps.map((id) => "· " + t("dopilot.step." + id)).join("\n");

  const workedLines: string[] = [];
  if (pilot.completedSteps.length) {
    workedLines.push(t("debrief.derive.completedHeader"));
    for (const id of pilot.completedSteps) {
      workedLines.push("· " + t("dopilot.step." + id));
    }
  }
  if (pilot.usefulScreens.length) {
    workedLines.push(t("debrief.derive.usefulHeader"));
    for (const key of pilot.usefulScreens) {
      workedLines.push("· " + t("dopilot.screen." + key));
    }
  }
  const workedWell = workedLines.join("\n").trim();

  const frictionParts: string[] = [];
  if (pilot.frictionNotes.trim()) frictionParts.push(pilot.frictionNotes.trim());
  if (blockedLabels) {
    frictionParts.push(t("debrief.derive.blockedHeader") + "\n" + blockedLabels);
  }
  const causedFriction = frictionParts.join("\n\n").trim();

  const simplLines: string[] = [];
  for (const key of pilot.confusingScreens) {
    simplLines.push(t("debrief.derive.simplifyLine", { screen: t("dopilot.screen." + key) }));
  }
  if (pilot.finalVerdict === "too_complex") {
    simplLines.push(t("debrief.derive.verdictTooComplexLine"));
  }
  const recommendedSimplifications = simplLines.join("\n").trim();

  const fixParts: string[] = [];
  if (pilot.blockedSteps.length) {
    fixParts.push(t("debrief.derive.fixBlockedHeader") + "\n" + blockedLabels);
  }
  if (pilot.recommendedFixes.trim()) {
    fixParts.push(pilot.recommendedFixes.trim());
  }
  const recommendedFixes = fixParts.join("\n\n").trim();

  let nextPilotRecommendation = "";
  if (pilot.finalVerdict === "blocked") {
    nextPilotRecommendation = t("debrief.derive.nextBlocked");
  } else if (pilot.finalVerdict === "too_complex") {
    nextPilotRecommendation = t("debrief.derive.nextTooComplex");
  } else if (pilot.finalVerdict === "usable_with_friction") {
    nextPilotRecommendation = t("debrief.derive.nextFriction");
  } else {
    nextPilotRecommendation = t("debrief.derive.nextReady");
  }

  return {
    id: "dpd_" + String(now),
    createdAt: now,
    sourcePilotId: pilot.id,
    dateLabel: pilot.dateLabel,
    pilotVerdict: pilot.finalVerdict,
    workedWell,
    causedFriction,
    skippedScreens: skipped,
    confusingScreens: [...pilot.confusingScreens],
    missingData: pilot.missingData,
    recommendedSimplifications,
    recommendedFixes,
    hideFromDailyUseCandidates: [...pilot.confusingScreens],
    keepInDailyUse: [...pilot.usefulScreens],
    nextPilotRecommendation,
    confidenceNote: pilot.confidenceNote,
  };
}
