import {
  INTEGRATION_READINESS_MEMORY_SCHEMA,
  type IntegrationReadinessMemoryPayload,
  type IntegrationReadinessReport,
} from "./types";

export function buildIntegrationReadinessMemoryPayload(
  report: IntegrationReadinessReport,
): IntegrationReadinessMemoryPayload {
  return {
    schema: INTEGRATION_READINESS_MEMORY_SCHEMA,
    savedAt: Date.now(),
    report,
  };
}

export function parseIntegrationReadinessMemoryPayload(raw: string): IntegrationReadinessMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null) return null;
    const p = o as IntegrationReadinessMemoryPayload;
    if (p.schema !== INTEGRATION_READINESS_MEMORY_SCHEMA || !p.report?.id) return null;
    return p;
  } catch {
    return null;
  }
}
