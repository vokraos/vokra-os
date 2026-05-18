import { newEconomicPressureReportId } from "./ids";
import {
  buildDangerousExpansionZones,
  buildStableZones,
  computeExpansionPressure,
} from "./expansion";
import {
  buildFragmentationZones,
  computeFragmentationPressure,
} from "./fragmentation";
import { computeLaunchPressure } from "./launch-cost";
import {
  computeOperationalPressure,
  computeSaturationPressure,
  levelFromScore,
} from "./pressure";
import { computeRefreshPressure } from "./refresh-cost";
import { deriveEconomicRecommendations } from "./recommendations";
import { appendGuardrailsToEconomicPressure, loadEconomicGuardrails } from "../economic-guardrails";
import { appendUnitEconomicsToEconomicWarnings, formatCoverageWarning, loadBundleForIntegrations } from "../unit-economics";
import { buildCorridorCoverageFromIntel } from "../unit-economics/coverage";
import type { EconomicPressureGatherContext, EconomicPressureReport } from "./types";
import { computeWarehousePressure } from "./warehouse";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildEconomicPressureReport(
  ctx: EconomicPressureGatherContext,
  t: TFn,
  existingId?: string,
): EconomicPressureReport {
  const operationalPressure = computeOperationalPressure(ctx);
  const expansionPressure = computeExpansionPressure(ctx);
  const fragmentationPressure = computeFragmentationPressure(ctx);
  const warehousePressure = computeWarehousePressure(ctx);
  const refreshPressure = computeRefreshPressure(ctx);
  const launchPressure = computeLaunchPressure(ctx);
  const saturationPressure = computeSaturationPressure(ctx);

  const assortmentComplexity = Math.min(
    100,
    Math.round(
      (ctx.intel?.corridorSummary.length ?? 0) * 6 +
        ctx.activeActionCount * 1.5 +
        (ctx.executionPlan?.weekActions.length ?? 0) * 2,
    ),
  );

  const operationalLevel = levelFromScore(operationalPressure);
  const expansionLevel = levelFromScore(expansionPressure);
  const fragmentationLevel = levelFromScore(fragmentationPressure);
  const warehouseLevel = levelFromScore(warehousePressure);
  const refreshLevel = levelFromScore(refreshPressure);
  const launchLevel = levelFromScore(launchPressure);

  const dangerousExpansionZones = buildDangerousExpansionZones(ctx, expansionPressure, t);
  const stableZones = buildStableZones(ctx, t);
  const fragZones = buildFragmentationZones(ctx, fragmentationPressure, t);

  const partial: Omit<
    EconomicPressureReport,
    "recommendedFocus" | "stopExpansionSignals" | "operationalWarnings" | "confidenceNote"
  > = {
    id: existingId ?? newEconomicPressureReportId(),
    createdAt: Date.now(),
    operationalPressure,
    expansionPressure,
    fragmentationPressure,
    warehousePressure,
    refreshPressure,
    launchPressure,
    saturationPressure,
    assortmentComplexity,
    operationalLevel,
    expansionLevel,
    fragmentationLevel,
    warehouseLevel,
    refreshLevel,
    launchLevel,
    dangerousExpansionZones: [...dangerousExpansionZones, ...fragZones].slice(0, 6),
    stableZones,
  };

  const derived = deriveEconomicRecommendations(partial, t);

  const maxLevel = [
    operationalLevel,
    expansionLevel,
    fragmentationLevel,
    warehouseLevel,
    refreshLevel,
    launchLevel,
  ];
  const rank = (l: string) =>
    l === "critical" ? 5 : l === "dangerous" ? 4 : l === "elevated" ? 3 : l === "manageable" ? 2 : 1;
  const worst = maxLevel.sort((a, b) => rank(b) - rank(a))[0] ?? "low";

  let confidenceNote = t("econ.confidence.ok");
  if (!ctx.snapshot) confidenceNote = t("econ.confidence.noSnap");
  else if (worst === "critical" || worst === "dangerous") confidenceNote = t("econ.confidence.high", { level: t(`econ.level.${worst}`) });
  else if (worst === "elevated") confidenceNote = t("econ.confidence.elevated");

  let report = { ...partial, ...derived, confidenceNote };
  const bundle = loadBundleForIntegrations();
  const coverageLine = formatCoverageWarning(ctx.intel, bundle, t);
  if (coverageLine) confidenceNote = `${confidenceNote} · ${coverageLine}`;

  report = {
    ...report,
    confidenceNote,
    operationalWarnings: appendUnitEconomicsToEconomicWarnings(report, bundle.profiles, t),
  };
  if (ctx.intel) {
    const cov = buildCorridorCoverageFromIntel(ctx.intel, bundle);
    if (cov.total > 0 && cov.covered < cov.total) {
      const w = t("ue.coverage.pressureWarn", { covered: String(cov.covered), total: String(cov.total) });
      if (!report.operationalWarnings.includes(w)) {
        report = { ...report, operationalWarnings: [...report.operationalWarnings, w].slice(0, 10) };
      }
    }
  }
  const guardrails = loadEconomicGuardrails({
    expansionPressureElevated:
      report.expansionLevel === "elevated" ||
      report.expansionLevel === "dangerous" ||
      report.expansionLevel === "critical",
  });
  return appendGuardrailsToEconomicPressure(report, guardrails, t);
}
