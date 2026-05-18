import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import { saveCompetitorSerpToSession } from "../competitor-serp/memoryPayload";
import type { CompetitorSerpMemoryPayload } from "../competitor-serp/types";
import { COMPETITOR_SERP_MEMORY_SCHEMA } from "../competitor-serp/types";
import type { HeroFatigueIntelligenceReport } from "./types";

const FATIGUE_MAP_SESSION_KEY = "vokra.heroFatigue.mapState" as const;

export type HeroFatigueMapSessionState = {
  report: HeroFatigueIntelligenceReport;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};

export function saveHeroFatigueMapSession(state: HeroFatigueMapSessionState): void {
  try {
    sessionStorage.setItem(FATIGUE_MAP_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function consumeHeroFatigueMapSession(): HeroFatigueMapSessionState | null {
  try {
    const raw = sessionStorage.getItem(FATIGUE_MAP_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FATIGUE_MAP_SESSION_KEY);
    const o = JSON.parse(raw) as HeroFatigueMapSessionState;
    if (!o?.report || typeof o.report !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

export function primeSessionsFromHeroFatigueMemoryPayload(payload: import("./types").HeroFatigueIntelligenceMemoryPayload): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  saveHeroFatigueMapSession({ report: payload.report, serpEnvelope: payload.serpEnvelope ?? null });
}
