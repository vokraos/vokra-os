import { LAUNCH_REVIEW_MEMORY_SCHEMA, type LaunchReviewMemoryPayload } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseLaunchReviewMemoryPayload(raw: string): LaunchReviewMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== LAUNCH_REVIEW_MEMORY_SCHEMA || !isRecord(o.review)) return null;
    const review = o.review as LaunchReviewMemoryPayload["review"];
    if (typeof review.id !== "string" || typeof review.sourceLaunchPlanId !== "string") return null;
    return {
      schema: LAUNCH_REVIEW_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      review,
      plan: (o.plan as LaunchReviewMemoryPayload["plan"]) ?? null,
    };
  } catch {
    return null;
  }
}

export function buildLaunchReviewMemoryPayload(
  review: LaunchReviewMemoryPayload["review"],
  plan?: LaunchReviewMemoryPayload["plan"],
): LaunchReviewMemoryPayload {
  return {
    schema: LAUNCH_REVIEW_MEMORY_SCHEMA,
    savedAt: Date.now(),
    review,
    plan: plan ?? null,
  };
}
