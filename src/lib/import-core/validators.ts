import type { ColumnMappingRule, NormalizedTargetFieldId } from "./types";
import type { ImportPreview } from "./types";
import { schemaFor } from "./schemas";

function withValidation(rules: ColumnMappingRule[]): ColumnMappingRule[] {
  return rules.map((r) => ({
    ...r,
    validationStatus: r.confidence >= 70 ? "ok" : r.confidence >= 45 ? "warn" : "error",
  }));
}

export function computeRequiredMissing(
  kind: ImportPreview["importType"],
  mapped: readonly ColumnMappingRule[],
): NormalizedTargetFieldId[] {
  const req = schemaFor(kind).requiredTargets;
  const have = new Set(mapped.map((m) => m.targetField));
  return req.filter((f) => !have.has(f));
}

/** Apply validation flags and recompute missing required — pure, sample-scale. */
export function validateImportPreview(preview: ImportPreview): ImportPreview {
  const mapped = withValidation([...preview.mappedColumns]);
  const requiredMissing = computeRequiredMissing(preview.importType, mapped);
  const readiness = computeReadiness(preview.importType, mapped, requiredMissing);
  return {
    ...preview,
    mappedColumns: mapped,
    requiredMissing,
    readiness,
  };
}

export function computeReadiness(
  kind: ImportPreview["importType"],
  mapped: readonly ColumnMappingRule[],
  requiredMissing: readonly NormalizedTargetFieldId[],
): number {
  const expectedN = schemaFor(kind).expectedTargets.length;
  const base = 32 + Math.min(12, expectedN);
  const perMapped = Math.min(42, mapped.length * 7);
  const requiredOk = requiredMissing.length === 0 ? 28 : Math.max(0, 12 - requiredMissing.length * 4);
  const confAvg =
    mapped.length === 0 ? 0 : mapped.reduce((s, m) => s + m.confidence, 0) / mapped.length / 5;
  return Math.max(0, Math.min(100, Math.round(base + perMapped + requiredOk + confAvg)));
}
