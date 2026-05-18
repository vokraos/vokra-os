import type { AppLocale } from "../i18n/messages";
import type { ProductionPressureReport } from "./types";
import { getActiveShiftScenario } from "./shift-store";
import {
  loadProductionShiftFeedbackOverlay,
  newShiftFeedbackId,
} from "./shift-feedback-store";
import type { CapacityMismatchType, ProductionShiftFeedback } from "./shift-feedback-types";

const MISMATCH_FROM_OVERLOAD: Record<string, CapacityMismatchType> = {
  launch: "launch_load_underestimated",
  fbo: "fbo_prep_underestimated",
  visual: "visual_jobs_underestimated",
  cards: "card_jobs_underestimated",
  packaging: "packaging_underestimated",
  blocked: "blocked_tasks_underestimated",
};

const MISMATCH_ADJ: Record<Exclude<CapacityMismatchType, "none">, string> = {
  packaging_underestimated: "prod.feedback.adj.packaging",
  fbo_prep_underestimated: "prod.feedback.adj.fbo",
  visual_jobs_underestimated: "prod.feedback.adj.visual",
  card_jobs_underestimated: "prod.feedback.adj.cards",
  launch_load_underestimated: "prod.feedback.adj.launch",
  blocked_tasks_underestimated: "prod.feedback.adj.blocked",
};

const MISMATCH_NEXT: Record<Exclude<CapacityMismatchType, "none">, string> = {
  packaging_underestimated: "prod.feedback.next.packaging",
  fbo_prep_underestimated: "prod.feedback.next.fbo",
  visual_jobs_underestimated: "prod.feedback.next.visual",
  card_jobs_underestimated: "prod.feedback.next.cards",
  launch_load_underestimated: "prod.feedback.next.launch",
  blocked_tasks_underestimated: "prod.feedback.next.blocked",
};

export type ShiftFeedbackDraft = {
  completedFocus: string[];
  delayedItems: string[];
  bottlenecksFound: string[];
  overloadAreas: string[];
  capacityMismatch: CapacityMismatchType;
  operatorNotes: string;
  founderNotes: string;
  recommendedCapacityAdjustment: string;
  nextShiftRecommendation: string;
};

export function shiftDateLabel(locale: AppLocale = "en"): string {
  return new Date().toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function inferMismatchFromOverload(areas: string[]): CapacityMismatchType {
  for (const a of areas) {
    const m = MISMATCH_FROM_OVERLOAD[a];
    if (m) return m;
  }
  return "none";
}

export function suggestAdjustmentKeys(mismatch: CapacityMismatchType): {
  adjustmentKey: string;
  nextShiftKey: string;
} {
  if (mismatch === "none") {
    return { adjustmentKey: "prod.feedback.adj.none", nextShiftKey: "prod.feedback.next.none" };
  }
  return {
    adjustmentKey: MISMATCH_ADJ[mismatch],
    nextShiftKey: MISMATCH_NEXT[mismatch],
  };
}

export function buildShiftFeedbackDraft(report: ProductionPressureReport): ShiftFeedbackDraft {
  const overlay = loadProductionShiftFeedbackOverlay();
  const plan = report.dailyPlan;
  const overloadAreas: string[] = [];
  if (report.launchLoad.band === "high" || report.launchLoad.band === "critical") overloadAreas.push("launch");
  if (report.fulfillmentPressure.band === "high" || report.fulfillmentPressure.band === "critical") {
    overloadAreas.push("fbo");
  }
  if (report.printPressure.band === "high" || report.printPressure.band === "critical") {
    overloadAreas.push("visual");
  }
  if (report.packagingPressure.band === "high" || report.packagingPressure.band === "critical") {
    overloadAreas.push("packaging");
  }
  if (report.loadSnapshot.blockedTasks > 0) overloadAreas.push("blocked");
  if (report.loadSnapshot.refreshTasks > 2) overloadAreas.push("refresh");

  const mismatch = inferMismatchFromOverload(overloadAreas);
  const { adjustmentKey, nextShiftKey } = suggestAdjustmentKeys(mismatch);

  const delayedFromPlan = plan.delay.slice(0, 4);
  const bottlenecks = [
    ...plan.bottleneckWatch.slice(0, 3),
    ...report.operatorBottlenecks.slice(0, 2).map((b) => b.labelKey),
  ];

  return {
    completedFocus: [],
    delayedItems: delayedFromPlan,
    bottlenecksFound: [...new Set(bottlenecks)],
    overloadAreas: [...new Set(overloadAreas)],
    capacityMismatch: mismatch,
    operatorNotes: overlay.operatorNote,
    founderNotes: "",
    recommendedCapacityAdjustment: adjustmentKey,
    nextShiftRecommendation: nextShiftKey,
  };
}

export function composeProductionShiftFeedback(
  report: ProductionPressureReport,
  draft: ShiftFeedbackDraft,
  locale: AppLocale,
): ProductionShiftFeedback {
  const active = getActiveShiftScenario();
  const { adjustmentKey, nextShiftKey } = suggestAdjustmentKeys(draft.capacityMismatch);
  return {
    id: newShiftFeedbackId(),
    createdAt: Date.now(),
    sourceDailyPlanId: report.dailyPlan.id,
    sourceReportId: report.id,
    activeScenarioId: active?.id ?? null,
    shiftDate: shiftDateLabel(locale as AppLocale),
    completedFocus: draft.completedFocus.filter(Boolean).slice(0, 12),
    delayedItems: draft.delayedItems.filter(Boolean).slice(0, 12),
    bottlenecksFound: draft.bottlenecksFound.filter(Boolean).slice(0, 10),
    overloadAreas: draft.overloadAreas.slice(0, 8),
    capacityMismatch: draft.capacityMismatch,
    operatorNotes: draft.operatorNotes.trim(),
    founderNotes: draft.founderNotes.trim(),
    recommendedCapacityAdjustment: draft.recommendedCapacityAdjustment || adjustmentKey,
    nextShiftRecommendation: draft.nextShiftRecommendation || nextShiftKey,
    confidenceNote: "prod.feedback.confidence.saved",
  };
}
