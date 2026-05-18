import { deriveOperatorBottlenecks } from "./bottlenecks";
import { deriveCadenceStability, deriveWaveCollisionRisk } from "./cadence";
import { deriveFulfillmentPressure } from "./fulfillment-pressure";
import { deriveLaunchLoad } from "./launch-load";
import { newProductionPressureReportId, worstState } from "./levels";
import { derivePackagingPressure } from "./packaging-pressure";
import { derivePrintPressure } from "./print-pressure";
import type { CapacityInterpretation } from "./capacity-types";
import { pickCapacityBreachComparison } from "./capacity-interpret";
import type { ProductionLoadSnapshot } from "./capacity-types";
import { deriveProductionDailyPlan } from "./daily-plan";
import { getProductionShiftLearning } from "./shift-feedback-learning";
import type { ShiftRequirementRecommendation } from "./shift-requirement-types";
import type {
  PressureBand,
  ProductionPressureGatherContext,
  ProductionPressureReport,
  ProductionState,
} from "./types";

function bandToState(band: PressureBand): ProductionState {
  if (band === "critical") return "blocked";
  if (band === "high") return "overloaded";
  if (band === "moderate") return "pressured";
  return "stable";
}

export type ProductionPressureDeriveInput = {
  loadSnapshot: ProductionLoadSnapshot;
  capacity: CapacityInterpretation;
  shiftRequirement: ShiftRequirementRecommendation;
  existingId?: string;
};

export function deriveProductionPressureReport(
  ctx: ProductionPressureGatherContext,
  input: ProductionPressureDeriveInput,
): ProductionPressureReport {
  const { loadSnapshot, capacity, shiftRequirement, existingId } = input;
  const printPressure = derivePrintPressure(ctx);
  const packagingPressure = derivePackagingPressure(ctx);
  const fulfillmentPressure = deriveFulfillmentPressure(ctx);
  const launchLoad = deriveLaunchLoad(ctx);
  const waveCollisionRisk = deriveWaveCollisionRisk(ctx);
  const cadenceStability = deriveCadenceStability(ctx);
  const operatorBottlenecks = deriveOperatorBottlenecks(ctx);

  const dangerousZones: string[] = [];
  const recommendedActions: string[] = [];
  const forbiddenMoves: string[] = [];

  if (waveCollisionRisk.band === "high" || waveCollisionRisk.band === "critical") {
    dangerousZones.push("prod.zone.waveCollision");
    recommendedActions.push("prod.reco.delayRefresh");
    forbiddenMoves.push("prod.forbid.refreshDuringHero");
  }
  if (launchLoad.band === "high" || launchLoad.band === "critical") {
    dangerousZones.push("prod.zone.launchOverload");
    recommendedActions.push("prod.reco.reduceLaunchBatch");
    forbiddenMoves.push("prod.forbid.parallelWaves");
  }
  if (packagingPressure.band === "high" || packagingPressure.band === "critical") {
    dangerousZones.push("prod.zone.packaging");
    recommendedActions.push("prod.reco.clearCardDrafts");
  }
  if (fulfillmentPressure.band === "high" || fulfillmentPressure.band === "critical") {
    dangerousZones.push("prod.zone.fulfillment");
    recommendedActions.push("prod.reco.pauseFboPrep");
    forbiddenMoves.push("prod.forbid.fboExpansion");
  }
  if (printPressure.band === "high" || printPressure.band === "critical") {
    dangerousZones.push("prod.zone.printQueue");
    recommendedActions.push("prod.reco.trimVisualQueue");
  }
  if (cadenceStability.band === "high" || cadenceStability.band === "critical") {
    dangerousZones.push("prod.zone.cadence");
    recommendedActions.push("prod.reco.spaceWaves");
  }
  if (operatorBottlenecks.length >= 2) {
    dangerousZones.push("prod.zone.operator");
    recommendedActions.push("prod.reco.reviewOperatorBrief");
  }
  if (!ctx.snapshotId) {
    dangerousZones.push("prod.zone.noSnapshot");
    forbiddenMoves.push("prod.forbid.launchWithoutSnap");
  }

  if (!capacity.hasProfile) {
    recommendedActions.push("prod.reco.defineCapacityProfile");
  } else {
    for (const c of capacity.comparisons) {
      if (c.state === "overloaded") {
        dangerousZones.push(`prod.capacity.zone.${c.metricId}`);
        recommendedActions.push(`prod.capacity.reco.${c.metricId}`);
      } else if (c.state === "pressured") {
        recommendedActions.push(`prod.capacity.watch.${c.metricId}`);
      }
    }
  }

  const componentStates: ProductionState[] = [
    bandToState(printPressure.band),
    bandToState(packagingPressure.band),
    bandToState(fulfillmentPressure.band),
    bandToState(launchLoad.band),
    bandToState(waveCollisionRisk.band),
    bandToState(cadenceStability.band),
  ];

  if (ctx.launchPlan?.launchReadiness === "blocked") componentStates.push("blocked");
  if (ctx.scalingSignals?.scalingMode === "stop_and_review") componentStates.push("blocked");

  let productionState = worstState(componentStates);

  if (
    productionState === "stable" &&
    (printPressure.band !== "low" ||
      packagingPressure.band !== "low" ||
      fulfillmentPressure.band !== "low" ||
      launchLoad.band !== "low")
  ) {
    productionState = "pressured";
  }

  if (cadenceStability.band === "high" || cadenceStability.band === "critical") {
    productionState = worstState([productionState, "unstable"]);
  }

  if (productionState === "stable" && operatorBottlenecks.some((b) => b.severity === "high")) {
    productionState = "pressured";
  }

  if (capacity.overallState === "overloaded") {
    productionState = worstState([productionState, "overloaded"]);
  } else if (capacity.overallState === "pressured") {
    productionState = worstState([productionState, "pressured"]);
  }

  if (productionState === "stable" || productionState === "pressured") {
    recommendedActions.push("prod.reco.maintainCadence");
    if (launchLoad.band === "low" && cadenceStability.band === "low") {
      recommendedActions.push("prod.reco.launchWaveOk");
    }
  }

  if (productionState === "overloaded" || productionState === "blocked" || productionState === "unstable") {
    forbiddenMoves.push("prod.forbid.heavyExpansion");
    if (!forbiddenMoves.includes("prod.forbid.parallelWaves")) forbiddenMoves.push("prod.forbid.stackLaunches");
  }

  let confidenceNoteKey = "prod.confidence.manual";
  if (!ctx.snapshotId) confidenceNoteKey = "prod.confidence.noSnapshot";
  else if (!capacity.hasProfile) confidenceNoteKey = "prod.confidence.structuralOnly";
  else if (capacity.shiftScenarioType) confidenceNoteKey = "prod.confidence.withShift";
  else confidenceNoteKey = "prod.confidence.withCapacity";

  if (capacity.shiftScenarioType === "small_shift" && productionState === "stable") {
    recommendedActions.push("prod.shift.reco.smallCaution");
  }
  if (capacity.shiftScenarioType === "launch_day") {
    recommendedActions.push("prod.shift.reco.launchDayFocus");
  }
  if (capacity.shiftScenarioType === "fbo_prep_day") {
    recommendedActions.push("prod.shift.reco.fboPrepFocus");
  }

  if (shiftRequirement.recommendationType !== "keep_current") {
    recommendedActions.push(shiftRequirement.reasonKey);
    for (const r of shiftRequirement.workloadReductions.slice(0, 2)) {
      if (!recommendedActions.includes(r)) recommendedActions.push(r);
    }
  }

  const shiftLearning = getProductionShiftLearning();
  if (shiftLearning.repeatedMismatch) {
    dangerousZones.push("prod.learn.zone.capacity");
    for (const k of shiftLearning.recommendationKeys.slice(0, 3)) {
      if (!recommendedActions.includes(k)) recommendedActions.push(k);
    }
    if (shiftLearning.nextShiftHintKey && !recommendedActions.includes(shiftLearning.nextShiftHintKey)) {
      recommendedActions.push(shiftLearning.nextShiftHintKey);
    }
  }

  const base = {
    id: existingId ?? newProductionPressureReportId(),
    createdAt: Date.now(),
    targetLabel: ctx.targetLabel,
    productionState,
    printPressure,
    packagingPressure,
    fulfillmentPressure,
    launchLoad,
    operatorBottlenecks,
    waveCollisionRisk,
    cadenceStability,
    dangerousZones: [...new Set(dangerousZones)].slice(0, 8),
    recommendedActions: [...new Set(recommendedActions)].slice(0, 8),
    forbiddenMoves: [...new Set(forbiddenMoves)].slice(0, 8),
    confidenceNoteKey,
    loadSnapshot,
    capacity,
    resolvedCapacity: capacity.resolvedCapacity,
    shiftRequirement,
  };
  return {
    ...base,
    shiftLearning,
    dailyPlan: deriveProductionDailyPlan(
      { ...base, shiftLearning } as ProductionPressureReport,
      () => "",
    ),
  };
}

export function pickProductionPressureDigestLine(report: ProductionPressureReport): {
  lineKey: string;
  lineVars: Record<string, string>;
} | null {
  const learn = report.shiftLearning;
  if (learn?.digestLineKey && learn.repeatCount >= 2) {
    return { lineKey: learn.digestLineKey, lineVars: learn.digestLineVars };
  }

  const sr = report.shiftRequirement;
  if (sr && sr.recommendationType !== "keep_current") {
    return {
      lineKey: "prod.shiftReq.digest",
      lineVars: {
        type: sr.recommendationType,
        scenarioType: sr.reasonVars.to ?? sr.reasonVars.scenario ?? "",
      },
    };
  }

  if (report.capacity.shiftScenarioType) {
    const capacityBreach = pickCapacityBreachComparison(report.capacity);
    if (capacityBreach && capacityBreach.state !== "stable" && capacityBreach.state !== "unknown") {
      return {
        lineKey: "prod.shift.digest.breach",
        lineVars: {
          scenario: report.capacity.shiftScenarioType,
          state: capacityBreach.state,
          metric: capacityBreach.metricId,
        },
      };
    }
    if (report.capacity.overallState === "pressured" || report.capacity.overallState === "overloaded") {
      return {
        lineKey: "prod.shift.digest.pressured",
        lineVars: {
          scenario: report.capacity.shiftScenarioType,
          state: report.capacity.overallState,
        },
      };
    }
  }

  const capacityBreach = pickCapacityBreachComparison(report.capacity);
  if (capacityBreach && capacityBreach.state !== "stable" && capacityBreach.state !== "unknown") {
    return { lineKey: capacityBreach.summaryKey, lineVars: capacityBreach.summaryVars };
  }

  if (report.productionState === "stable" && !report.capacity.hasProfile) return null;
  if (report.productionState === "stable") return null;

  if (report.packagingPressure.band === "high" || report.packagingPressure.band === "critical") {
    return {
      lineKey: "prod.digest.packaging",
      lineVars: { state: report.productionState, band: report.packagingPressure.band },
    };
  }
  if (report.launchLoad.band === "high" || report.launchLoad.band === "critical") {
    return {
      lineKey: "prod.digest.launch",
      lineVars: { state: report.productionState },
    };
  }
  if (report.waveCollisionRisk.band !== "low") {
    return {
      lineKey: "prod.digest.collision",
      lineVars: { state: report.productionState },
    };
  }
  return {
    lineKey: "prod.digest.general",
    lineVars: { state: report.productionState },
  };
}
