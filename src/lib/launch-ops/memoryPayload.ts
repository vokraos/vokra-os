import { LAUNCH_OPS_MEMORY_SCHEMA, type LaunchOpsMemoryPayload } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseLaunchOpsMemoryPayload(raw: string): LaunchOpsMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== LAUNCH_OPS_MEMORY_SCHEMA || !isRecord(o.plan)) return null;
    const plan = o.plan as LaunchOpsMemoryPayload["plan"];
    if (typeof plan.id !== "string" || typeof plan.collectionId !== "string") return null;
    return {
      schema: LAUNCH_OPS_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      plan,
      context: (o.context as LaunchOpsMemoryPayload["context"]) ?? undefined,
      review: (o.review as LaunchOpsMemoryPayload["review"]) ?? null,
    };
  } catch {
    return null;
  }
}

export function buildLaunchOpsMemoryPayload(
  plan: LaunchOpsMemoryPayload["plan"],
  context?: LaunchOpsMemoryPayload["context"],
  review?: LaunchOpsMemoryPayload["review"],
): LaunchOpsMemoryPayload {
  return {
    schema: LAUNCH_OPS_MEMORY_SCHEMA,
    savedAt: Date.now(),
    plan,
    context: context ?? undefined,
    review: review ?? null,
  };
}
