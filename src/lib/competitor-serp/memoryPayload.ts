import {
  COMPETITOR_SERP_MEMORY_SCHEMA,
  type CompetitorSerpEnvelope,
  type CompetitorSerpMemoryPayload,
} from "./types";

const SESSION_KEY = "vokra.competitorSerp.envelope";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseCompetitorSerpMemoryPayload(raw: string): CompetitorSerpMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o)) return null;
    if (o.schema !== COMPETITOR_SERP_MEMORY_SCHEMA) return null;
    if (!isRecord(o.snapshot)) return null;
    if (!Array.isArray(o.snapshot.items)) return null;
    if (!isRecord(o.analysis)) return null;
    if (!Array.isArray(o.insights)) return null;
    if (!Array.isArray(o.crossModuleHints)) return null;
    const base = o as unknown as CompetitorSerpEnvelope;
    const savedAt = typeof (o as { savedAt?: unknown }).savedAt === "number" ? (o as { savedAt: number }).savedAt : Date.now();
    return { ...base, savedAt };
  } catch {
    return null;
  }
}

export function buildCompetitorSerpMemoryPayload(envelope: CompetitorSerpEnvelope): CompetitorSerpMemoryPayload {
  return { ...envelope, savedAt: Date.now() };
}

export function saveCompetitorSerpToSession(payload: CompetitorSerpMemoryPayload | CompetitorSerpEnvelope): void {
  try {
    const env: CompetitorSerpEnvelope = {
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      snapshot: payload.snapshot,
      analysis: payload.analysis,
      insights: payload.insights,
      crossModuleHints: payload.crossModuleHints,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(env));
  } catch {
    /* quota */
  }
}

export function consumeCompetitorSerpFromSession(): CompetitorSerpEnvelope | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_KEY);
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== COMPETITOR_SERP_MEMORY_SCHEMA) return null;
    if (!isRecord(o.snapshot) || !Array.isArray(o.snapshot.items)) return null;
    if (!isRecord(o.analysis) || !Array.isArray(o.insights) || !Array.isArray(o.crossModuleHints)) return null;
    return o as CompetitorSerpEnvelope;
  } catch {
    return null;
  }
}
