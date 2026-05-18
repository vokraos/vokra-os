import type { DataCleanupMemoryPayload } from "./types";
import { DATA_CLEANUP_MEMORY_SCHEMA } from "./types";
import { saveActiveEntitySnapshot } from "../storage";

export function parseDataCleanupMemoryPayload(raw: unknown): DataCleanupMemoryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schema !== DATA_CLEANUP_MEMORY_SCHEMA) return null;
  if (!o.plan || typeof o.plan !== "object") return null;
  if (!Array.isArray(o.appliedActionIds)) return null;
  if (!o.enrichedSnapshot || typeof o.enrichedSnapshot !== "object") return null;
  return raw as DataCleanupMemoryPayload;
}

export function restoreEnrichedSnapshotFromCleanupPayload(raw: unknown): boolean {
  const p = parseDataCleanupMemoryPayload(raw);
  if (!p?.enrichedSnapshot) return false;
  saveActiveEntitySnapshot(p.enrichedSnapshot);
  return true;
}
