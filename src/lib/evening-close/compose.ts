import type { AppLocale } from "../i18n/messages";
import type { DailyWarRoomState } from "../daily-war-room/types";
import {
  buildAssortmentExecutionPlan,
  buildAssortmentExecutionReview,
  deriveAssortmentActions,
  getAssortmentChecklistMap,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { buildDailyWarRoomSnapshot } from "../daily-war-room";
import { buildExecutionFeedbackReport } from "../execution-feedback";
import { getActiveEntitySnapshot } from "../entity-snapshot";
import { gatherFounderBriefContext } from "../founder-brief";
import { buildHeroCommandSnapshot, getHeroCommandStageLabelKey } from "../hero-command";
import { buildOperatorBrief } from "../operator-brief";
import { buildPrimaryMarketTimingReport } from "../market-timing";
import { buildProductionPressureReport } from "../production-pressure";
import {
  buildShiftFeedbackDraft,
  composeProductionShiftFeedback,
} from "../production-pressure/shift-feedback-compose";
import { loadProductionShiftFeedbackState } from "../production-pressure/shift-feedback-store";
import { buildScalingSafetyReport } from "../scaling-safety";
import { buildControlTowerSnapshot } from "../strategic-control-tower";
import type { CloseLine, EveningCloseSnapshot, TomorrowReadiness } from "./types";
import { todayDateKey } from "./store";

type TFn = (key: string, vars?: Record<string, string>) => string;

function newCloseId(): string {
  return `eclose-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function line(text: string): CloseLine {
  const x = text.replace(/\s+/g, " ").trim();
  return { text: x.length ? (x.length <= 160 ? x : `${x.slice(0, 159)}…`) : "—" };
}

function linesFromStrings(items: string[], max = 8): CloseLine[] {
  return [...new Set(items.filter(Boolean))].slice(0, max).map(line);
}

function dateLabel(locale: AppLocale): string {
  return new Date().toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function deriveTomorrowReadiness(
  warState: DailyWarRoomState,
  prodState: string,
  towerState: string,
  blockedCount: number,
  warningCount: number,
): TomorrowReadiness {
  if (warState === "blocked" || prodState === "blocked" || towerState === "blocked" || blockedCount >= 4) {
    return "blocked";
  }
  if (
    warState === "overloaded" ||
    prodState === "overloaded" ||
    prodState === "unstable" ||
    towerState === "fragile" ||
    warningCount >= 4
  ) {
    return "unstable";
  }
  if (warState === "pressured" || prodState === "pressured" || warningCount >= 2) return "pressured";
  if (blockedCount >= 1 || warningCount >= 1) return "manageable";
  return "clear";
}

export function buildEveningCloseSnapshot(
  t: TFn,
  locale: AppLocale = "en",
  existingId?: string,
): EveningCloseSnapshot {
  const warRoom = buildDailyWarRoomSnapshot(t, locale);
  const prod = buildProductionPressureReport(t, undefined, locale);
  const tower = buildControlTowerSnapshot(t, locale);
  const scaling = buildScalingSafetyReport(t);
  const timing = buildPrimaryMarketTimingReport(t);
  const feedback = buildExecutionFeedbackReport(t, locale);
  const fctx = gatherFounderBriefContext();
  const hero = buildHeroCommandSnapshot();
  const operator = buildOperatorBrief(t);

  const shiftEntries = loadProductionShiftFeedbackState().entries;
  const shiftFb =
    shiftEntries.length > 0
      ? shiftEntries[shiftEntries.length - 1]
      : composeProductionShiftFeedback(prod, buildShiftFeedbackDraft(prod), locale);

  const snapshot = getActiveEntitySnapshot();
  let review = null as ReturnType<typeof buildAssortmentExecutionReview>;
  if (snapshot) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    const plan = buildAssortmentExecutionPlan(snapshot.id, merged);
    review = buildAssortmentExecutionReview(snapshot.id, plan, getAssortmentChecklistMap(snapshot.id), t);
  }

  const completedToday: string[] = [];
  for (const task of feedback.completedTasks) completedToday.push(task.title);
  for (const item of shiftFb.completedFocus) completedToday.push(item);
  if (review) {
    for (const row of review.doneItems.slice(0, 4)) completedToday.push(row.title);
  }
  if (!completedToday.length) completedToday.push(t("eclose.fallback.completedQuiet"));

  const delayedToday: string[] = [];
  for (const task of feedback.delayedTasks) delayedToday.push(task.title);
  for (const item of shiftFb.delayedItems) delayedToday.push(item);
  for (const d of prod.dailyPlan.delay.slice(0, 4)) delayedToday.push(d);
  if (review) {
    for (const row of review.deferredItems.slice(0, 3)) delayedToday.push(row.title);
  }

  const blockedToday: string[] = [];
  for (const task of feedback.blockedTasks) blockedToday.push(task.title);
  for (const b of operator.blockedTasks) blockedToday.push(b.title);
  for (const w of warRoom.blockedItems) blockedToday.push(w.text);
  if (review) {
    for (const row of review.blockedItems.slice(0, 3)) blockedToday.push(row.title);
  }

  const overloadedAreas: string[] = [];
  const overloadKeys: Record<string, string> = {
    launch: "eclose.overload.launch",
    fbo: "eclose.overload.fbo",
    visual: "eclose.overload.visual",
    packaging: "eclose.overload.packaging",
    blocked: "eclose.overload.blocked",
    refresh: "eclose.overload.refresh",
  };
  for (const a of shiftFb.overloadAreas) {
    overloadedAreas.push(overloadKeys[a] ? t(overloadKeys[a]) : a);
  }
  for (const z of prod.dangerousZones.slice(0, 3)) overloadedAreas.push(t(z));

  const productionIssues: string[] = [];
  for (const b of shiftFb.bottlenecksFound) productionIssues.push(typeof b === "string" && b.startsWith("prod.") ? t(b) : b);
  if (shiftFb.capacityMismatch !== "none") {
    productionIssues.push(t(`prod.feedback.mismatch.${shiftFb.capacityMismatch}` as string));
  }
  if (shiftFb.operatorNotes.trim()) productionIssues.push(shiftFb.operatorNotes.trim());
  if (prod.shiftLearning.digestLineKey) {
    productionIssues.push(t(prod.shiftLearning.digestLineKey, prod.shiftLearning.digestLineVars));
  }

  const launchIssues: string[] = [];
  if (fctx.launchPlan?.blockers.length) {
    for (const b of fctx.launchPlan.blockers.slice(0, 4)) launchIssues.push(b.label);
  }
  if (fctx.launchPlan?.launchReadiness === "blocked" || fctx.launchPlan?.launchReadiness === "fragile") {
    launchIssues.push(t("eclose.launch.readiness", { state: fctx.launchPlan.launchReadiness }));
  }

  const heroIssues: string[] = [];
  if (hero) {
    heroIssues.push(t(getHeroCommandStageLabelKey(hero)));
  } else {
    heroIssues.push(t("eclose.hero.idle"));
  }

  const operatorIssues: string[] = [];
  for (const u of feedback.unclearTasks) operatorIssues.push(u.title);
  for (const p of feedback.operationalProblems) operatorIssues.push(p);
  if (feedback.operatorNotes.trim()) operatorIssues.push(feedback.operatorNotes.trim());

  const founderDecisionsForTomorrow: string[] = [];
  for (const d of warRoom.founderDecisions) founderDecisionsForTomorrow.push(d.text);
  if (scaling.safetyLevel === "blocked" || scaling.scalingMode === "stop_and_review") {
    founderDecisionsForTomorrow.push(t(scaling.recommendedNextStepKey, scaling.recommendedNextStepVars));
  }

  const tomorrowCarryForward: string[] = [];
  for (const task of feedback.repeatedTomorrow) tomorrowCarryForward.push(task.title);
  for (const w of warRoom.teamInstructions.slice(0, 3)) tomorrowCarryForward.push(w.text);
  if (review) {
    for (const row of review.staleItems.slice(0, 2)) tomorrowCarryForward.push(row.title);
    tomorrowCarryForward.push(t(review.nextSuggestedFocusKey));
  }
  if (!tomorrowCarryForward.length) tomorrowCarryForward.push(t("eclose.carry.none"));

  const tomorrowWarnings: string[] = [];
  for (const w of tower.warningKeys.slice(0, 4)) tomorrowWarnings.push(t(w));
  if (timing && (timing.timingState === "burnout_risk" || timing.timingState === "overlapping")) {
    tomorrowWarnings.push(t(timing.reasonKey, timing.reasonVars));
  }
  for (const w of warRoom.watchList.slice(0, 3)) tomorrowWarnings.push(w.text);
  if (prod.productionState === "overloaded" || prod.productionState === "pressured") {
    tomorrowWarnings.push(t("eclose.warn.production", { state: t(`prod.state.${prod.productionState}`) }));
  }

  const preloadMorningFocus: string[] = [];
  preloadMorningFocus.push(warRoom.founderFocus.text);
  if (tomorrowCarryForward[0] && tomorrowCarryForward[0] !== t("eclose.carry.none")) {
    preloadMorningFocus.push(tomorrowCarryForward[0]);
  }

  const tomorrowReadiness = deriveTomorrowReadiness(
    warRoom.dailyState,
    prod.productionState,
    tower.overallState,
    blockedToday.length,
    tomorrowWarnings.length,
  );

  let confidenceNote = "eclose.confidence.ok";
  if (!snapshot) confidenceNote = "eclose.confidence.noSnapshot";
  else if (tomorrowReadiness === "blocked" || tomorrowReadiness === "unstable") {
    confidenceNote = "eclose.confidence.heavy";
  } else if (tomorrowReadiness === "pressured") confidenceNote = "eclose.confidence.pressured";

  return {
    id: existingId ?? newCloseId(),
    createdAt: Date.now(),
    dateLabel: dateLabel(locale),
    dateKey: todayDateKey(),
    dailyState: warRoom.dailyState,
    completedToday: linesFromStrings(completedToday, 10),
    delayedToday: linesFromStrings(delayedToday, 10),
    blockedToday: linesFromStrings(blockedToday, 10),
    overloadedAreas: linesFromStrings(overloadedAreas, 8),
    productionIssues: linesFromStrings(productionIssues, 8),
    launchIssues: linesFromStrings(launchIssues, 6),
    heroIssues: linesFromStrings(heroIssues, 4),
    operatorIssues: linesFromStrings(operatorIssues, 8),
    founderDecisionsForTomorrow: linesFromStrings(founderDecisionsForTomorrow, 6),
    tomorrowCarryForward: linesFromStrings(tomorrowCarryForward, 8),
    tomorrowWarnings: linesFromStrings(tomorrowWarnings, 8),
    tomorrowReadiness,
    preloadMorningFocus: linesFromStrings(preloadMorningFocus, 4),
    confidenceNote,
  };
}
