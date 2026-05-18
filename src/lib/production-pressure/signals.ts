import { pickCapacityBreachComparison } from "./capacity-interpret";
import { peekProductionPressureSession } from "./session";
import type { ProductionState } from "./types";
import type { ShiftRequirementType } from "./shift-requirement-types";

export type ProductionPressureSignals = {
  productionState: ProductionState;
  topPressureLane: string;
  capacityBreachCount: number;
  shiftRequirementType: ShiftRequirementType;
};

function topLaneFromReport(report: NonNullable<ReturnType<typeof peekProductionPressureSession>>["report"]): string {
  const lanes: { id: string; score: number }[] = [
    { id: "print", score: report.printPressure.score },
    { id: "packaging", score: report.packagingPressure.score },
    { id: "fulfillment", score: report.fulfillmentPressure.score },
    { id: "launch", score: report.launchLoad.score },
    { id: "cadence", score: report.cadenceStability.score },
    { id: "waves", score: report.waveCollisionRisk.score },
  ];
  lanes.sort((a, b) => b.score - a.score);
  return lanes[0]?.id ?? "print";
}

function countCapacityBreaches(
  report: NonNullable<ReturnType<typeof peekProductionPressureSession>>["report"],
): number {
  const cap = report.capacity;
  let n = 0;
  if (pickCapacityBreachComparison(cap)) n += 1;
  if (cap.overallState === "pressured" || cap.overallState === "overloaded") n += 1;
  return n;
}

/** Cached production pressure only — never builds a report. */
export function getProductionPressureSignals(): ProductionPressureSignals | null {
  const report = peekProductionPressureSession()?.report;
  if (!report) return null;
  return {
    productionState: report.productionState,
    topPressureLane: topLaneFromReport(report),
    capacityBreachCount: countCapacityBreaches(report),
    shiftRequirementType: report.shiftRequirement.recommendationType,
  };
}
