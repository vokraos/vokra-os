import type { AppLocale } from "../i18n/messages";
import type { NavId } from "../../types";
import {
  buildAssortmentExecutionPlan,
  deriveAssortmentActions,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { getActiveEntitySnapshot } from "../entity-snapshot";
import { buildFboFbsDecisionReport } from "../fbo-fbs-decision";
import { gatherFounderBriefContext, buildFounderCommandBrief } from "../founder-brief";
import { buildHeroCommandSnapshot } from "../hero-command";
import { getHeroCommandStageLabelKey } from "../hero-command";
import { buildOperatorBrief } from "../operator-brief";
import { buildOsHealthAuditReport } from "../os-health-audit";
import { buildPrimaryMarketTimingReport } from "../market-timing";
import {
  buildProductionPressureReport,
  getProductionShiftLearning,
  productionDailyPlanToDisplay,
} from "../production-pressure";
import { buildScalingSafetyReport } from "../scaling-safety";
import { buildControlTowerSnapshot } from "../strategic-control-tower";
import type { DailyWarRoomSnapshot, DailyWarRoomState, WarRoomLine } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function newWarRoomId(): string {
  return `dwr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clip(s: string, max: number): string {
  const x = s.replace(/\s+/g, " ").trim();
  if (!x.length) return "—";
  return x.length <= max ? x : `${x.slice(0, max - 1)}…`;
}

function wr(text: string, navId?: NavId): WarRoomLine {
  return { text: clip(text, 160), navId };
}

function dateLabel(locale: AppLocale): string {
  return new Date().toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function deriveDailyState(
  towerState: string,
  prodState: string,
  scalingLevel: string,
  blockedCount: number,
  holdCount: number,
  decisionCount: number,
): DailyWarRoomState {
  if (
    towerState === "blocked" ||
    prodState === "blocked" ||
    scalingLevel === "blocked" ||
    blockedCount >= 4
  ) {
    return "blocked";
  }
  if (
    prodState === "overloaded" ||
    towerState === "fragile" ||
    scalingLevel === "unsafe" ||
    blockedCount >= 2 ||
    holdCount >= 3
  ) {
    return "overloaded";
  }
  if (
    prodState === "pressured" ||
    towerState === "pressured" ||
    scalingLevel === "fragile" ||
    scalingLevel === "cautious" ||
    blockedCount >= 1 ||
    decisionCount >= 1
  ) {
    return "pressured";
  }
  if (blockedCount === 0 && holdCount <= 1) return "focused";
  return "clear";
}

export function buildDailyWarRoomSnapshot(
  t: TFn,
  locale: AppLocale = "en",
  existingId?: string,
): DailyWarRoomSnapshot {
  const fctx = gatherFounderBriefContext();
  const brief = buildFounderCommandBrief(fctx, t);
  const tower = buildControlTowerSnapshot(t, locale);
  const operator = buildOperatorBrief(t);
  const prod = buildProductionPressureReport(t);
  const plan = productionDailyPlanToDisplay(prod.dailyPlan, t);
  const scaling = buildScalingSafetyReport(t);
  const fbo = buildFboFbsDecisionReport(t);
  const timing = buildPrimaryMarketTimingReport(t);
  const audit = buildOsHealthAuditReport();
  const learning = prod.shiftLearning ?? getProductionShiftLearning();
  const hero = buildHeroCommandSnapshot();

  const snapshot = getActiveEntitySnapshot();
  let holdCount = 0;
  if (snapshot) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    const planExec = buildAssortmentExecutionPlan(snapshot.id, merged);
    holdCount = planExec.holdActions.length;
  }

  const blockedItems: WarRoomLine[] = [];
  const postponeItems: WarRoomLine[] = [];
  const founderDecisions: WarRoomLine[] = [];
  const teamInstructions: WarRoomLine[] = [];
  const watchList: WarRoomLine[] = [];

  if (fctx.checklistBlocked > 0) {
    blockedItems.push(
      wr(t("fbrief.blocked.checklist", { n: String(fctx.checklistBlocked) }), "assortmentActions"),
    );
  } else if (fctx.launchPlan?.blockers[0]) {
    blockedItems.push(wr(fctx.launchPlan.blockers[0].label, "launchOperations"));
  } else if (brief.topBlockedItem.navId !== "assortmentActions" || fctx.launchPlan) {
    blockedItems.push(wr(brief.topBlockedItem.text, brief.topBlockedItem.navId));
  }
  for (const task of operator.blockedTasks.slice(0, 4)) {
    blockedItems.push(wr(task.title, task.destination));
  }
  if (fctx.launchPlan?.blockers.length) {
    for (const b of fctx.launchPlan.blockers.slice(1, 4)) {
      blockedItems.push(wr(b.label, "launchOperations"));
    }
  }
  for (const z of prod.dangerousZones.slice(0, 2)) {
    blockedItems.push(wr(t(z), "productionPressure"));
  }

  for (const d of plan.delay.slice(0, 4)) {
    postponeItems.push(wr(d, "productionPressure"));
  }
  for (const a of plan.avoid.slice(0, 3)) {
    postponeItems.push(wr(a, "productionPressure"));
  }
  if (brief.doNotTouch.text && !brief.doNotTouch.text.includes("—")) {
    postponeItems.push(wr(brief.doNotTouch.text, brief.doNotTouch.navId));
  }
  if (holdCount > 0) {
    postponeItems.push(wr(t("dwr.postpone.holds", { n: String(holdCount) }), "assortmentActions"));
  }

  if (scaling.safetyLevel === "blocked" || scaling.scalingMode === "stop_and_review") {
    founderDecisions.push(
      wr(t(scaling.recommendedNextStepKey, scaling.recommendedNextStepVars), "scalingSafety"),
    );
  } else if (scaling.safetyLevel === "unsafe" || scaling.scalingMode === "hold_expansion") {
    founderDecisions.push(wr(t("dwr.decision.scalingCaution"), "scalingSafety"));
  }
  if (fbo.readiness === "blocked" || fbo.readiness === "fragile") {
    founderDecisions.push(wr(t(fbo.recommendedNextStepKey, fbo.recommendedNextStepVars), "fboFbsDecision"));
  }
  if (
    timing &&
    (timing.timingState === "burnout_risk" ||
      timing.timingState === "overlapping" ||
      timing.timingState === "crowded")
  ) {
    founderDecisions.push(wr(t(timing.reasonKey, timing.reasonVars), "marketTiming"));
  }
  if (tower.overallState === "blocked" || tower.overallState === "fragile") {
    founderDecisions.push(wr(t(tower.topPriorityKey, tower.topPriorityVars), "controlTower"));
  }
  if (learning.digestLineKey && learning.repeatCount >= 2) {
    founderDecisions.push(wr(t(learning.digestLineKey, learning.digestLineVars), "productionPressure"));
  }

  if (operator.nextAction) {
    teamInstructions.push(wr(operator.nextAction.title, operator.nextAction.destination));
  }
  for (const item of plan.doFirst.slice(0, 4)) {
    teamInstructions.push(wr(item, "productionPressure"));
  }
  for (const task of operator.todayTasks.filter((x) => x.status === "todo").slice(0, 3)) {
    teamInstructions.push(wr(task.title, task.destination));
  }

  for (const w of plan.bottleneckWatch.slice(0, 3)) {
    watchList.push(wr(w, "productionPressure"));
  }
  if (learning.digestLineKey) {
    watchList.push(wr(t(learning.digestLineKey, learning.digestLineVars), "productionPressure"));
  }
  const riskTile =
    tower.tiles.find((x) => x.health === "blocked" || x.health === "pressured") ?? tower.tiles[0];
  watchList.push(wr(t(tower.riskSystemKey, tower.riskSystemVars), riskTile?.navId ?? "controlTower"));
  if (audit.overallHealth === "fragile" || audit.overallHealth === "incomplete") {
    const top = audit.missingInputs[0];
    if (top) watchList.push(wr(t(top.key, top.vars), top.navId));
  }

  const operatorOpen =
    operator.todayTasks.filter((x) => x.status === "todo").length +
    operator.visualTasks.filter((x) => x.status === "todo").length +
    operator.launchTasks.filter((x) => x.status === "todo").length;

  const dailyState = deriveDailyState(
    tower.overallState,
    prod.productionState,
    scaling.safetyLevel,
    blockedItems.length,
    postponeItems.length,
    founderDecisions.length,
  );

  let confidenceNote = "dwr.confidence.ok";
  if (!snapshot) confidenceNote = "dwr.confidence.noSnapshot";
  else if (dailyState === "blocked" || dailyState === "overloaded") confidenceNote = "dwr.confidence.heavy";

  const heroStage = hero ? t(getHeroCommandStageLabelKey(hero)) : t("dwr.hero.idle");

  return {
    id: existingId ?? newWarRoomId(),
    createdAt: Date.now(),
    dateLabel: dateLabel(locale),
    dailyState,
    founderFocus: wr(brief.topTodayAction.text, brief.topTodayAction.navId),
    operatorFocus: operator.nextAction
      ? wr(`${operator.nextAction.title} · ${t("dwr.operator.open", { n: String(operatorOpen) })}`, "operatorMode")
      : wr(t("dwr.operator.none", { n: String(operatorOpen) }), "operatorMode"),
    productionFocus: wr(plan.todayFocus, "productionPressure"),
    launchFocus: wr(brief.launchStatus.text, brief.launchStatus.navId),
    heroFocus: wr(heroStage, "heroCommand"),
    scalingFocus: wr(t(scaling.mainReasonKey, scaling.mainReasonVars), "scalingSafety"),
    blockedItems: [...new Map(blockedItems.map((x) => [x.text, x])).values()].slice(0, 8),
    postponeItems: [...new Map(postponeItems.map((x) => [x.text, x])).values()].slice(0, 8),
    founderDecisions: [...new Map(founderDecisions.map((x) => [x.text, x])).values()].slice(0, 6),
    teamInstructions: [...new Map(teamInstructions.map((x) => [x.text, x])).values()].slice(0, 8),
    watchList: [...new Map(watchList.map((x) => [x.text, x])).values()].slice(0, 8),
    nextRoute: wr(brief.nextBestRoute.text, brief.nextBestRoute.navId),
    confidenceNote,
  };
}
