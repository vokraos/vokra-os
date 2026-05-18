import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import { saveCompetitorSerpToSession } from "../competitor-serp/memoryPayload";
import type { CompetitorSerpMemoryPayload } from "../competitor-serp/types";
import { COMPETITOR_SERP_MEMORY_SCHEMA } from "../competitor-serp/types";
import type { HeroArchetypeIntelligenceReport } from "./types";

const ARCH_MAP_SESSION_KEY = "vokra.heroArchetypes.mapState" as const;
export const HERO_ARCHETYPE_VISUAL_STRATEGY_LINES_KEY = "vokra.heroArchetypes.visualStrategyLines" as const;

export type HeroArchetypeMapSessionState = {
  report: HeroArchetypeIntelligenceReport;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};

export function saveHeroArchetypeMapSession(state: HeroArchetypeMapSessionState): void {
  try {
    sessionStorage.setItem(ARCH_MAP_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function consumeHeroArchetypeMapSession(): HeroArchetypeMapSessionState | null {
  try {
    const raw = sessionStorage.getItem(ARCH_MAP_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(ARCH_MAP_SESSION_KEY);
    const o = JSON.parse(raw) as HeroArchetypeMapSessionState;
    if (!o?.report || typeof o.report !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

export function primeSessionsFromHeroArchetypeMemoryPayload(payload: import("./types").HeroArchetypeIntelligenceMemoryPayload): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  saveHeroArchetypeMapSession({ report: payload.report, serpEnvelope: payload.serpEnvelope ?? null });
}

export function pushHeroArchetypeVisualStrategyLines(query: string, lines: readonly string[]): void {
  try {
    sessionStorage.setItem(HERO_ARCHETYPE_VISUAL_STRATEGY_LINES_KEY, JSON.stringify({ query, lines: [...lines] }));
  } catch {
    /* quota */
  }
}

export function consumeHeroArchetypeVisualStrategyLines(): { query: string; lines: string[] } | null {
  try {
    const raw = sessionStorage.getItem(HERO_ARCHETYPE_VISUAL_STRATEGY_LINES_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HERO_ARCHETYPE_VISUAL_STRATEGY_LINES_KEY);
    const o = JSON.parse(raw) as { query?: string; lines?: string[] };
    if (!o?.query || !Array.isArray(o.lines)) return null;
    return { query: o.query, lines: o.lines.filter((x) => typeof x === "string") };
  } catch {
    return null;
  }
}
