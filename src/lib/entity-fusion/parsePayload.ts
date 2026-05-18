import { ENTITY_FUSION_MEMORY_SCHEMA, type EntityFusionMemoryPayload } from "./types";

export function parseEntityFusionMemoryPayload(raw: unknown): EntityFusionMemoryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schema !== ENTITY_FUSION_MEMORY_SCHEMA) return null;
  if (typeof o.derivedAt !== "number") return null;
  if (typeof o.importedRows !== "number") return null;
  if (!Array.isArray(o.matchedEntities)) return null;
  return o as EntityFusionMemoryPayload;
}
