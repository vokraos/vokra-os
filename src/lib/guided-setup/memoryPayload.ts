import { GUIDED_SETUP_MEMORY_SCHEMA, type GuidedSetupMemoryPayload, type GuidedSetupPlan } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseGuidedSetupMemoryPayload(raw: string): GuidedSetupMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== GUIDED_SETUP_MEMORY_SCHEMA) return null;
    const plan = o.plan as GuidedSetupPlan | undefined;
    if (!plan?.id) return null;
    return {
      schema: GUIDED_SETUP_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      plan,
    };
  } catch {
    return null;
  }
}

export function buildGuidedSetupMemoryPayload(plan: GuidedSetupPlan): GuidedSetupMemoryPayload {
  return {
    schema: GUIDED_SETUP_MEMORY_SCHEMA,
    savedAt: Date.now(),
    plan,
  };
}
