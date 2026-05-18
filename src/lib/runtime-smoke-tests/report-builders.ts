import type { AppLocale } from "../i18n/messages";
import { gatherEconomicPressureContext, buildEconomicPressureReport } from "../economic-pressure";
import { buildScalingSafetyReport } from "../scaling-safety";
import { buildFboFbsDecisionReport } from "../fbo-fbs-decision";
import { buildProductionPressureReport } from "../production-pressure";
import { buildPrimaryCorridorStrategyReport } from "../corridor-strategy";
import { buildPrimaryMarketTimingReport } from "../market-timing";
import { buildFounderCommandBrief, gatherFounderBriefContext } from "../founder-brief";
import { buildControlTowerSnapshot } from "../strategic-control-tower";
import { buildDailyWarRoomSnapshot } from "../daily-war-room";
import { buildOperatorBrief, buildOperatorWorkOrder } from "../operator-brief";

/** Minimal translator for smoke builds — returns key so failures stay readable. */
export function smokeT(key: string, _vars?: Record<string, string>): string {
  return key;
}

export function smokeBuildEconomicPressure(): void {
  const ctx = gatherEconomicPressureContext();
  const r = buildEconomicPressureReport(ctx, smokeT);
  if (!r?.id) throw new Error("economic_pressure: missing report id");
}

export function smokeBuildScalingSafety(): void {
  const r = buildScalingSafetyReport(smokeT);
  if (!r?.id) throw new Error("scaling_safety: missing report id");
}

export function smokeBuildFboFbsDecision(): void {
  const r = buildFboFbsDecisionReport(smokeT);
  if (!r?.id) throw new Error("fbo_fbs_decision: missing report id");
}

export function smokeBuildProductionPressure(): void {
  const r = buildProductionPressureReport(smokeT);
  if (!r?.id) throw new Error("production_pressure: missing report id");
}

export function smokeBuildCorridorStrategy(): void {
  const r = buildPrimaryCorridorStrategyReport(smokeT);
  if (!r?.id) throw new Error("corridor_strategy: null or missing report id");
}

export function smokeBuildMarketTiming(): void {
  const r = buildPrimaryMarketTimingReport(smokeT);
  if (!r?.id) throw new Error("market_timing: null or missing report id");
}

export function smokeBuildFounderBrief(): void {
  const brief = buildFounderCommandBrief(gatherFounderBriefContext(), smokeT);
  if (!brief?.id) throw new Error("founder_brief: missing brief id");
}

export function smokeBuildControlTower(locale: AppLocale): void {
  const snap = buildControlTowerSnapshot(smokeT, locale);
  if (!snap?.id) throw new Error("control_tower: missing snapshot id");
}

export function smokeBuildWarRoom(locale: AppLocale): void {
  const snap = buildDailyWarRoomSnapshot(smokeT, locale);
  if (!snap?.dailyState) throw new Error("war_room: missing daily state");
}

export function smokeBuildOperatorWorkOrder(locale: AppLocale): void {
  const brief = buildOperatorBrief(smokeT);
  const wo = buildOperatorWorkOrder({ ...brief, notes: brief.notes }, smokeT, locale, undefined, {
    minimalComposition: false,
  });
  if (!wo?.id) throw new Error("operator_work_order: missing id");
}
