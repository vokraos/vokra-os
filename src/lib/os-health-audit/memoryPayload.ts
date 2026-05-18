import {
  OS_HEALTH_AUDIT_MEMORY_SCHEMA,
  type OsHealthAuditMemoryPayload,
  type OsHealthAuditReport,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseOsHealthAuditMemoryPayload(raw: string): OsHealthAuditMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== OS_HEALTH_AUDIT_MEMORY_SCHEMA) return null;
    const report = o.report as OsHealthAuditReport | undefined;
    if (!report?.id) return null;
    return {
      schema: OS_HEALTH_AUDIT_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      report,
    };
  } catch {
    return null;
  }
}

export function buildOsHealthAuditMemoryPayload(report: OsHealthAuditReport): OsHealthAuditMemoryPayload {
  return {
    schema: OS_HEALTH_AUDIT_MEMORY_SCHEMA,
    savedAt: Date.now(),
    report,
  };
}
