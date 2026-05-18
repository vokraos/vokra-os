import type { ManualOperationalBrief, MemoryDerivedSignals, OperationalScoreBreakdown, WithProvenance } from "./types";
import { clamp } from "../math";

function w<T>(value: T, provenance: WithProvenance<T>["provenance"], detailKey?: string): WithProvenance<T> {
  return { value, provenance, detailKey };
}

export function computeOperationalScore(
  mem: MemoryDerivedSignals,
  manual: ManualOperationalBrief,
): OperationalScoreBreakdown {
  const skuN = mem.skuCount.value;
  const gen = mem.generationCount30d.value;
  const vis = mem.visualAnalysisCount.value;
  const cats = mem.uniqueCategories.value;

  const memoryCoverage = clamp(28 + Math.min(40, skuN * 4) + Math.min(22, gen * 2) + Math.min(10, vis * 2), 0, 100);

  const skuDiscipline = clamp(skuN === 0 ? 22 : 45 + Math.min(35, skuN * 3) + (cats > 0 ? 12 : 0), 0, 100);

  const contentVelocity = clamp(gen === 0 && vis === 0 ? 18 : 35 + Math.min(45, gen * 3) + Math.min(20, vis * 2), 0, 100);

  const hasManual =
    manual.prioritySkus.trim().length > 0 ||
    manual.runwayNotes.trim().length > 0 ||
    manual.productionBottleneckNote.trim().length > 0 ||
    manual.productionPressureManual != null ||
    manual.categoryOverloadManual != null ||
    manual.adLoadManual != null;

  const manualAlignment = hasManual ? 72 : 38;

  const total = clamp(
    memoryCoverage * 0.28 + skuDiscipline * 0.22 + contentVelocity * 0.28 + manualAlignment * 0.22,
    0,
    100,
  );

  return {
    total: w(Math.round(total), "inferred", "operations.provenance.inferredModel"),
    memoryCoverage: w(Math.round(memoryCoverage), "inferred", "operations.provenance.inferredModel"),
    skuDiscipline: w(Math.round(skuDiscipline), "inferred", "operations.provenance.inferredModel"),
    contentVelocity: w(Math.round(contentVelocity), "inferred", "operations.provenance.inferredModel"),
    manualAlignment: w(
      Math.round(manualAlignment),
      hasManual ? "manual" : "inferred",
      hasManual ? undefined : "operations.provenance.inferredModel",
    ),
  };
}

export function computeMarketplaceHealth(
  mem: MemoryDerivedSignals,
  manual: ManualOperationalBrief,
): import("./types").MarketplaceHealth {
  const base = 52 + Math.min(18, mem.generationCount30d.value) + Math.min(12, mem.visualAnalysisCount.value);
  const ad = manual.adLoadManual;
  const adjusted = ad != null ? base - Math.round((ad - 50) * 0.15) : base - 4;

  const ctrCr =
    mem.visualAnalysisCount.value > 2
      ? "operations.health.ctrCrBandMid"
      : mem.visualAnalysisCount.value > 0
        ? "operations.health.ctrCrBandLowMid"
        : "operations.health.ctrCrBandUnknown";

  const stock =
    mem.skuCount.value > 5 ? "operations.health.stockDisciplineMid" : "operations.health.stockDisciplineSparse";

  const adEff =
    ad != null && ad > 70
      ? "operations.health.adEfficiencyStress"
      : ad != null && ad < 35
        ? "operations.health.adEfficiencyLight"
        : "operations.health.adEfficiencyUnknown";

  return {
    index: w(clamp(Math.round(adjusted), 18, 88), "estimated", "operations.provenance.estimatedBand"),
    ctrCrBandKey: ctrCr,
    stockDisciplineKey: stock,
    adEfficiencyKey: adEff,
  };
}
