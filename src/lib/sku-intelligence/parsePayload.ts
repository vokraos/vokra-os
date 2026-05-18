import { SKU_INTEL_MEMORY_SCHEMA, type SkuIntelligenceMemoryPayload } from "./types";

export function parseSkuIntelligenceMemoryPayload(raw: unknown): SkuIntelligenceMemoryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schema !== SKU_INTEL_MEMORY_SCHEMA) return null;
  if (!Array.isArray(o.entities)) return null;
  return o as SkuIntelligenceMemoryPayload;
}
