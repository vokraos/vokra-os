import {
  UNIT_ECONOMICS_MEMORY_SCHEMA,
  UNIT_ECONOMICS_MEMORY_SCHEMA_V2,
  type UnitEconomicsAssignment,
  type UnitEconomicsMemoryPayload,
  type UnitEconomicsProfile,
  type UnitEconomicsTemplate,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseProfiles(arr: unknown): UnitEconomicsProfile[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((p): p is UnitEconomicsProfile => isRecord(p) && typeof p.id === "string");
}

function parseTemplates(arr: unknown): UnitEconomicsTemplate[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((p): p is UnitEconomicsTemplate => isRecord(p) && typeof p.id === "string");
}

function parseAssignments(arr: unknown): UnitEconomicsAssignment[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((p): p is UnitEconomicsAssignment => isRecord(p) && typeof p.id === "string");
}

export function parseUnitEconomicsMemoryPayload(raw: string): UnitEconomicsMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || !Array.isArray(o.profiles)) return null;
    const schema = o.schema;
    if (schema !== UNIT_ECONOMICS_MEMORY_SCHEMA && schema !== UNIT_ECONOMICS_MEMORY_SCHEMA_V2) return null;
    const profiles = parseProfiles(o.profiles);
    return {
      schema: schema === UNIT_ECONOMICS_MEMORY_SCHEMA_V2 ? UNIT_ECONOMICS_MEMORY_SCHEMA_V2 : UNIT_ECONOMICS_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      profiles,
      templates: parseTemplates(o.templates),
      assignments: parseAssignments(o.assignments),
      guardrails: Array.isArray(o.guardrails) ? (o.guardrails as UnitEconomicsMemoryPayload["guardrails"]) : undefined,
      guardrailSummary: Array.isArray(o.guardrailSummary)
        ? (o.guardrailSummary as string[])
        : undefined,
      priceReports: Array.isArray(o.priceReports) ? (o.priceReports as UnitEconomicsMemoryPayload["priceReports"]) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildUnitEconomicsMemoryPayload(
  bundle: {
    profiles: UnitEconomicsProfile[];
    templates?: UnitEconomicsTemplate[];
    assignments?: UnitEconomicsAssignment[];
  },
  extras?: Pick<UnitEconomicsMemoryPayload, "guardrails" | "guardrailSummary" | "priceReports">,
): UnitEconomicsMemoryPayload {
  return {
    schema: UNIT_ECONOMICS_MEMORY_SCHEMA_V2,
    savedAt: Date.now(),
    profiles: bundle.profiles,
    templates: bundle.templates ?? [],
    assignments: bundle.assignments ?? [],
    guardrails: extras?.guardrails,
    guardrailSummary: extras?.guardrailSummary,
    priceReports: extras?.priceReports,
  };
}
