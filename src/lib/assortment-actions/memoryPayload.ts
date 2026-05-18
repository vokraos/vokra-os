import { ASSORTMENT_ACTIONS_MEMORY_SCHEMA, type AssortmentActionsMemoryPayload } from "./types";

export function parseAssortmentActionsMemoryPayload(raw: unknown): AssortmentActionsMemoryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schema !== ASSORTMENT_ACTIONS_MEMORY_SCHEMA) return null;
  if (typeof o.sourceSnapshotId !== "string") return null;
  if (!Array.isArray(o.actions)) return null;
  if (!o.summary || typeof o.summary !== "object") return null;
  return raw as AssortmentActionsMemoryPayload;
}
