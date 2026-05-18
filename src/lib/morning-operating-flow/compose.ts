import type { AppLocale } from "../i18n/messages";
import { buildAssortmentExecutionPlan, deriveAssortmentActions, mergeStatusesIntoActions } from "../assortment-actions";
import { buildDailyWarRoomSnapshot } from "../daily-war-room";
import { getActiveEntitySnapshot } from "../entity-snapshot";
import { buildHeroCommandSnapshot } from "../hero-command";
import { gatherFounderBriefContext } from "../founder-brief";
import { buildOperatorBrief, buildOperatorWorkOrder } from "../operator-brief";
import { buildOsHealthAuditReport } from "../os-health-audit";
import { getOperatingRoleMode } from "../operating-role-mode";
import { buildProductionPressureReport } from "../production-pressure";
import { MORNING_STEP_DEFS } from "./steps";
import { loadMorningFlowProgress, todayDateKey } from "./store";
import type {
  MorningFlowReadiness,
  MorningFlowStep,
  MorningFlowStepId,
  MorningOperatingFlow,
} from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function newFlowId(): string {
  return `mflow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function dateLabel(locale: AppLocale): string {
  return new Date().toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function stepStatus(
  id: MorningFlowStepId,
  completed: Set<MorningFlowStepId>,
  blocked: Set<MorningFlowStepId>,
): MorningFlowStep["status"] {
  if (completed.has(id)) return "done";
  if (blocked.has(id)) return "blocked";
  return "pending";
}

function deriveReadiness(
  blockedCount: number,
  warRoomState: string,
  prodState: string,
  auditIncomplete: boolean,
): MorningFlowReadiness {
  if (blockedCount >= 2 || warRoomState === "blocked" || prodState === "blocked") return "blocked";
  if (blockedCount >= 1 || warRoomState === "overloaded" || prodState === "overloaded" || auditIncomplete) {
    return "needs_attention";
  }
  return "ready";
}

function stepHints(
  id: MorningFlowStepId,
  t: TFn,
  ctx: {
    prodState: string;
    shiftLabel: string;
    hasSnapshot: boolean;
    todayActions: number;
    launchBlockers: number;
    heroActive: boolean;
    workOrderTasks: number;
  },
): { hintKey?: string; hintVars?: Record<string, string> } {
  switch (id) {
    case "check_production_capacity":
      return {
        hintKey: "mflow.hint.production",
        hintVars: { state: t(`prod.state.${ctx.prodState}`), shift: ctx.shiftLabel },
      };
    case "review_assortment_plan":
      if (!ctx.hasSnapshot) return { hintKey: "mflow.hint.noSnapshot" };
      return {
        hintKey: "mflow.hint.assortment",
        hintVars: { n: String(ctx.todayActions) },
      };
    case "review_launch_risks":
      if (ctx.launchBlockers > 0) {
        return { hintKey: "mflow.hint.launchBlocked", hintVars: { n: String(ctx.launchBlockers) } };
      }
      return { hintKey: "mflow.hint.launchOk" };
    case "review_hero_work":
      return ctx.heroActive
        ? { hintKey: "mflow.hint.heroActive" }
        : { hintKey: "mflow.hint.heroIdle" };
    case "prepare_operator_work_order":
      return {
        hintKey: ctx.workOrderTasks > 0 ? "mflow.hint.workOrderReady" : "mflow.hint.workOrderEmpty",
        hintVars: { n: String(ctx.workOrderTasks) },
      };
    default:
      return {};
  }
}

export function buildMorningOperatingFlow(
  t: TFn,
  locale: AppLocale = "en",
  existingId?: string,
): MorningOperatingFlow {
  const stored = loadMorningFlowProgress();
  const dateKey = todayDateKey();
  const completed = new Set<MorningFlowStepId>(stored?.completedSteps ?? []);
  const blocked = new Set<MorningFlowStepId>(stored?.blockedSteps ?? []);
  const roleMode = getOperatingRoleMode();

  const warRoom = buildDailyWarRoomSnapshot(t, locale);
  const prod = buildProductionPressureReport(t, undefined, locale);
  const brief = buildOperatorBrief(t);
  const workOrder = buildOperatorWorkOrder(brief, t, locale);
  const fctx = gatherFounderBriefContext();
  const hero = buildHeroCommandSnapshot();
  const audit = buildOsHealthAuditReport();

  const snapshot = getActiveEntitySnapshot();
  let todayActions = 0;
  if (snapshot) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    const exec = buildAssortmentExecutionPlan(snapshot.id, merged);
    todayActions = exec.todayActions.length;
  }

  const launchBlockers = fctx.launchPlan?.blockers.length ?? 0;
  const heroActive = Boolean(hero);
  const workOrderTasks =
    workOrder.priorityTasks.length +
    workOrder.visualTasks.length +
    workOrder.cardTasks.length +
    workOrder.launchTasks.length;

  const hintCtx = {
    prodState: prod.productionState,
    shiftLabel: t(prod.shiftRequirement.reasonKey, prod.shiftRequirement.reasonVars),
    hasSnapshot: Boolean(snapshot),
    todayActions,
    launchBlockers,
    heroActive,
    workOrderTasks,
  };

  const steps: MorningFlowStep[] = MORNING_STEP_DEFS.map((def) => {
    const hints = stepHints(def.id, t, hintCtx);
    return {
      id: def.id,
      status: stepStatus(def.id, completed, blocked),
      navId: def.navId,
      titleKey: def.titleKey,
      whyKey: def.whyKey,
      ...hints,
    };
  });

  const currentStep =
    MORNING_STEP_DEFS.find((s) => !completed.has(s.id) && !blocked.has(s.id))?.id ??
    MORNING_STEP_DEFS.find((s) => !completed.has(s.id))?.id ??
    "save_start_snapshot";

  const readiness = deriveReadiness(
    blocked.size,
    warRoom.dailyState,
    prod.productionState,
    audit.overallHealth === "incomplete" || audit.overallHealth === "fragile",
  );

  const nextDef = MORNING_STEP_DEFS.find((s) => s.id === currentStep) ?? MORNING_STEP_DEFS[0];
  const isComplete = MORNING_STEP_DEFS.every((s) => completed.has(s.id));

  let confidenceNote = "mflow.confidence.ok";
  if (!snapshot) confidenceNote = "mflow.confidence.noSnapshot";
  else if (readiness === "blocked") confidenceNote = "mflow.confidence.blocked";
  else if (readiness === "needs_attention") confidenceNote = "mflow.confidence.attention";

  return {
    id: existingId ?? stored?.flowId ?? newFlowId(),
    createdAt: stored?.savedAt ?? Date.now(),
    dateLabel: dateLabel(locale),
    dateKey,
    roleMode,
    currentStep,
    completedSteps: [...completed],
    blockedSteps: [...blocked],
    readiness,
    startSnapshot: stored?.startSnapshot ?? null,
    nextAction: {
      text: t(nextDef.titleKey),
      navId: nextDef.navId,
    },
    confidenceNote,
    steps,
    workOrderReady: workOrderTasks > 0,
    workOrderTaskCount: workOrderTasks,
    isComplete,
  };
}
