import type { ColumnMappingRule, ImportPreviewWarning } from "./types";

export const MANUAL_IMPORT_FUSION_SESSION_KEY = "vokra.manualImportFusion.v1" as const;
export const MANUAL_IMPORT_FUSION_SCHEMA = "vokra.manualImportFusion.v1" as const;

/** Payload stored in sessionStorage before navigating to Entity Fusion. */
export type ManualImportFusionSessionPayload = {
  schema: typeof MANUAL_IMPORT_FUSION_SCHEMA;
  storedAt: number;
  importType: "manual_sku_list" | "manual_card_list";
  rowCount: number;
  detectedColumns: string[];
  mappedFields: ColumnMappingRule[];
  normalizedRows: Record<string, string>[];
  warnings: ImportPreviewWarning[];
  readiness: number;
  delimiter: string;
};

export function saveManualImportForFusion(payload: Omit<ManualImportFusionSessionPayload, "schema">): void {
  const full: ManualImportFusionSessionPayload = {
    schema: MANUAL_IMPORT_FUSION_SCHEMA,
    ...payload,
  };
  try {
    sessionStorage.setItem(MANUAL_IMPORT_FUSION_SESSION_KEY, JSON.stringify(full));
  } catch {
    /* quota */
  }
}

export function loadManualImportForFusion(): ManualImportFusionSessionPayload | null {
  try {
    const raw = sessionStorage.getItem(MANUAL_IMPORT_FUSION_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const rec = o as Record<string, unknown>;
    if (rec.schema !== MANUAL_IMPORT_FUSION_SCHEMA) return null;
    if (typeof rec.storedAt !== "number") return null;
    if (!Array.isArray(rec.mappedFields)) return null;
    if (!Array.isArray(rec.normalizedRows)) return null;
    return o as ManualImportFusionSessionPayload;
  } catch {
    return null;
  }
}

export function clearManualImportFusionSession(): void {
  try {
    sessionStorage.removeItem(MANUAL_IMPORT_FUSION_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
