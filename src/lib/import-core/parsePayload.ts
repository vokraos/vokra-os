import { DATA_IMPORT_MEMORY_SCHEMA, type DataImportMemoryPayload } from "./types";

export function parseDataImportMemoryPayload(raw: unknown): DataImportMemoryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schema !== DATA_IMPORT_MEMORY_SCHEMA) return null;
  if (typeof o.savedAt !== "number") return null;
  if (typeof o.importType !== "string") return null;
  if (typeof o.readiness !== "number") return null;
  if (!Array.isArray(o.warnings)) return null;

  if (o.snapshotKind === "manual_import") {
    const mapped = Array.isArray(o.mappedFields) ? o.mappedFields : null;
    const rows = Array.isArray(o.normalizedSampleRows) ? o.normalizedSampleRows : null;
    if (!mapped || !rows) return null;
    if (typeof o.rowCount !== "number") return null;
    return o as DataImportMemoryPayload;
  }

  if (!Array.isArray(o.mappingTemplate)) return null;
  return o as DataImportMemoryPayload;
}
