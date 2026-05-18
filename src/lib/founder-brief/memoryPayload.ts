import { FOUNDER_BRIEF_MEMORY_SCHEMA, type FounderBriefMemoryPayload } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseFounderBriefMemoryPayload(raw: string): FounderBriefMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== FOUNDER_BRIEF_MEMORY_SCHEMA || !isRecord(o.brief)) return null;
    const brief = o.brief as FounderBriefMemoryPayload["brief"];
    if (typeof brief.id !== "string") return null;
    return {
      schema: FOUNDER_BRIEF_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      brief,
    };
  } catch {
    return null;
  }
}

export function buildFounderBriefMemoryPayload(brief: FounderBriefMemoryPayload["brief"]): FounderBriefMemoryPayload {
  return {
    schema: FOUNDER_BRIEF_MEMORY_SCHEMA,
    savedAt: Date.now(),
    brief,
  };
}
