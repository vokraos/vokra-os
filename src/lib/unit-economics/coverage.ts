import type { SnapshotIntelligence } from "../entity-snapshot/intelligence";
import { computeTemplateCoverage } from "./resolve";
import type { UnitEconomicsBundle } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildCorridorCoverageFromIntel(
  intel: SnapshotIntelligence | null,
  bundle: UnitEconomicsBundle,
): { covered: number; total: number; uncovered: string[] } {
  const corridors = intel?.corridorSummary.map((r) => r.corridor).filter(Boolean) ?? [];
  return computeTemplateCoverage(corridors, bundle);
}

export function formatCoverageWarning(
  intel: SnapshotIntelligence | null,
  bundle: UnitEconomicsBundle,
  t: TFn,
): string | null {
  const { covered, total, uncovered } = buildCorridorCoverageFromIntel(intel, bundle);
  if (total === 0) return null;
  if (covered >= total) return t("ue.coverage.full", { n: String(total) });
  return t("ue.coverage.partial", {
    covered: String(covered),
    total: String(total),
    sample: uncovered.slice(0, 2).join(", ") || "—",
  });
}
