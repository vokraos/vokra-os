import type { AppLocale } from "../i18n/messages";
import { getGuidedSetupFeedbackHintKey } from "../execution-feedback";
import { GUIDED_SETUP_STEPS } from "./steps";
import { evaluateGuidedSetupSteps, gatherGuidedSetupStatusContext } from "./status";
import type { GuidedSetupPlan, GuidedSetupStepId } from "./types";
import { GUIDED_SETUP_STEP_ORDER } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function newGuidedSetupPlanId(): string {
  return `gsp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildGuidedSetupPlan(existingId?: string, t?: TFn, locale: AppLocale = "en"): GuidedSetupPlan {
  const ctx = gatherGuidedSetupStatusContext();
  const { completedSteps, blockedSteps, nextStep, isComplete } = evaluateGuidedSetupSteps(ctx);

  const total = GUIDED_SETUP_STEP_ORDER.length;
  const progressPercent = Math.round((completedSteps.length / total) * 100);

  const currentStep = nextStep;
  const meta = GUIDED_SETUP_STEPS[currentStep];

  let expectedOutcomeKey = meta.outcomeKey;
  const expectedOutcomeVars: Record<string, string> = {};
  if (isComplete) {
    expectedOutcomeKey = "gsp.expected.complete";
  } else if (currentStep === "cleanup_data") {
    expectedOutcomeVars.slots = String(ctx.audit.cleanupMissingSlots);
  }

  const linkedModules = [...new Set(GUIDED_SETUP_STEP_ORDER.map((id) => GUIDED_SETUP_STEPS[id].navId))];
  const feedbackHint = t ? getGuidedSetupFeedbackHintKey(t, locale) : null;

  return {
    id: existingId ?? newGuidedSetupPlanId(),
    createdAt: Date.now(),
    currentStep,
    completedSteps,
    blockedSteps,
    nextStep,
    progressPercent,
    expectedOutcomeKey,
    expectedOutcomeVars,
    linkedModules,
    confidenceNoteKey:
      feedbackHint ?? (ctx.audit.snapshot ? "gsp.confidence.honest" : "gsp.confidence.noSnapshot"),
    isComplete,
  };
}

export function stepMeta(id: GuidedSetupStepId) {
  return GUIDED_SETUP_STEPS[id];
}
