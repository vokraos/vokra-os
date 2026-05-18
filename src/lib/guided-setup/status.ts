import { deriveAssortmentActions } from "../assortment-actions";
import { loadLastFounderBrief } from "../founder-brief/storage";
import { gatherOsHealthAuditContext } from "../os-health-audit/gather";
import { loadManualImportForFusion } from "../import-core/manualImportSession";
import { peekCompetitorSerpSession } from "../hero-command/peekSessions";
import { peekControlTowerSession } from "../strategic-control-tower/session";
import type { GuidedSetupStepId } from "./types";
import { GUIDED_SETUP_STEP_ORDER } from "./types";

const CLEANUP_OK_SLOTS = 3;

export type GuidedSetupStatusContext = ReturnType<typeof gatherGuidedSetupStatusContext>;

export function gatherGuidedSetupStatusContext() {
  const audit = gatherOsHealthAuditContext();
  const manual = loadManualImportForFusion();
  const actionCount = audit.snapshot ? deriveAssortmentActions(audit.snapshot).length : 0;
  const founderBriefSaved = Boolean(loadLastFounderBrief());
  const controlTowerSaved = Boolean(peekControlTowerSession());
  const heroSerp = Boolean(peekCompetitorSerpSession());
  const hasManualRows = (manual?.normalizedRows.length ?? 0) > 0;

  return {
    audit,
    hasManualRows,
    actionCount,
    founderBriefSaved,
    controlTowerSaved,
    heroSerp,
  };
}

function stepComplete(id: GuidedSetupStepId, ctx: GuidedSetupStatusContext): boolean {
  const { audit, hasManualRows, actionCount, founderBriefSaved, controlTowerSaved, heroSerp } = ctx;

  switch (id) {
    case "import_data":
      return hasManualRows || Boolean(audit.snapshot);
    case "activate_snapshot":
      return Boolean(audit.snapshot);
    case "cleanup_data":
      return Boolean(audit.snapshot) && audit.cleanupMissingSlots < CLEANUP_OK_SLOTS;
    case "unit_economics":
      return (
        audit.unitBundle.profiles.length > 0 &&
        (audit.unitBundle.assignments.length > 0 || audit.unitBundle.templates.length > 0)
      );
    case "assortment_actions":
      return Boolean(audit.snapshot) && actionCount > 0;
    case "execution_plan": {
      const plan = audit.executionPlan;
      return (
        plan !== null &&
        (audit.checklistItemCount > 0 || plan.todayActions.length > 0 || plan.weekActions.length > 0)
      );
    }
    case "hero_competitor_analysis":
      return heroSerp || audit.heroWorkflowActive;
    case "founder_brief":
      return founderBriefSaved;
    case "control_tower":
      return controlTowerSaved;
    default:
      return false;
  }
}

function stepBlocked(id: GuidedSetupStepId, ctx: GuidedSetupStatusContext): boolean {
  if (id === "import_data" || id === "activate_snapshot") return false;
  return !ctx.audit.snapshot;
}

export function evaluateGuidedSetupSteps(ctx: GuidedSetupStatusContext): {
  completedSteps: GuidedSetupStepId[];
  blockedSteps: GuidedSetupStepId[];
  nextStep: GuidedSetupStepId;
  isComplete: boolean;
} {
  const completedSteps: GuidedSetupStepId[] = [];
  const blockedSteps: GuidedSetupStepId[] = [];

  for (const id of GUIDED_SETUP_STEP_ORDER) {
    if (stepComplete(id, ctx)) completedSteps.push(id);
    else if (stepBlocked(id, ctx)) blockedSteps.push(id);
  }

  const nextStep =
    GUIDED_SETUP_STEP_ORDER.find((id) => !completedSteps.includes(id) && !blockedSteps.includes(id)) ??
    GUIDED_SETUP_STEP_ORDER.find((id) => !completedSteps.includes(id)) ??
    "control_tower";

  const isComplete = GUIDED_SETUP_STEP_ORDER.every((id) => completedSteps.includes(id));

  return { completedSteps, blockedSteps, nextStep, isComplete };
}
