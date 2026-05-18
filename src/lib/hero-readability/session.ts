import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import { saveCompetitorSerpToSession } from "../competitor-serp/memoryPayload";
import type { CompetitorSerpMemoryPayload } from "../competitor-serp/types";
import { COMPETITOR_SERP_MEMORY_SCHEMA } from "../competitor-serp/types";
import type { HeroReadabilityIntelligenceReport } from "./types";

const READ_MAP_SESSION_KEY = "vokra.heroReadability.mapState" as const;
export const HERO_READABILITY_VISUAL_STRATEGY_LINES_KEY = "vokra.heroReadability.visualStrategyLines" as const;

export type HeroReadabilityMapSessionState = {
  report: HeroReadabilityIntelligenceReport;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};

export function saveHeroReadabilityMapSession(state: HeroReadabilityMapSessionState): void {
  try {
    sessionStorage.setItem(READ_MAP_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function consumeHeroReadabilityMapSession(): HeroReadabilityMapSessionState | null {
  try {
    const raw = sessionStorage.getItem(READ_MAP_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(READ_MAP_SESSION_KEY);
    const o = JSON.parse(raw) as HeroReadabilityMapSessionState;
    if (!o?.report || typeof o.report !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

export function primeSessionsFromHeroReadabilityMemoryPayload(payload: import("./types").HeroReadabilityIntelligenceMemoryPayload): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  saveHeroReadabilityMapSession({ report: payload.report, serpEnvelope: payload.serpEnvelope ?? null });
}

export function pushHeroReadabilityVisualStrategyLines(query: string, lines: readonly string[]): void {
  try {
    sessionStorage.setItem(HERO_READABILITY_VISUAL_STRATEGY_LINES_KEY, JSON.stringify({ query, lines: [...lines] }));
  } catch {
    /* quota */
  }
}

export function consumeHeroReadabilityVisualStrategyLines(): { query: string; lines: string[] } | null {
  try {
    const raw = sessionStorage.getItem(HERO_READABILITY_VISUAL_STRATEGY_LINES_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HERO_READABILITY_VISUAL_STRATEGY_LINES_KEY);
    const o = JSON.parse(raw) as { query?: string; lines?: string[] };
    if (!o?.query || !Array.isArray(o.lines)) return null;
    return { query: o.query, lines: o.lines.filter((x) => typeof x === "string") };
  } catch {
    return null;
  }
}
