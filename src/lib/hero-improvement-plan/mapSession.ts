import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import { saveCompetitorSerpToSession } from "../competitor-serp/memoryPayload";
import type { CompetitorSerpMemoryPayload } from "../competitor-serp/types";
import { COMPETITOR_SERP_MEMORY_SCHEMA } from "../competitor-serp/types";
import type { CompetitiveHeroImprovementPlan } from "./types";

const HERO_PLAN_MAP_SESSION_KEY = "vokra.heroImprovementPlan.mapState" as const;

export type HeroPlanMapSessionState = {
  plan: CompetitiveHeroImprovementPlan;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};

export function saveHeroPlanMapSession(state: HeroPlanMapSessionState): void {
  try {
    sessionStorage.setItem(HERO_PLAN_MAP_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function consumeHeroPlanMapSession(): HeroPlanMapSessionState | null {
  try {
    const raw = sessionStorage.getItem(HERO_PLAN_MAP_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HERO_PLAN_MAP_SESSION_KEY);
    const o = JSON.parse(raw) as HeroPlanMapSessionState;
    if (!o?.plan || typeof o.plan !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

/** Reopen from memory: restore SERP envelope into competitor-serp session if present. */
export function primeSessionsFromHeroPlanMemoryPayload(payload: import("./types").HeroImprovementPlanMemoryPayload): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  saveHeroPlanMapSession({ plan: payload.plan, serpEnvelope: payload.serpEnvelope ?? null });
}
