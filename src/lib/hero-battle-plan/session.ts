import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import { saveCompetitorSerpToSession } from "../competitor-serp/memoryPayload";
import type { CompetitorSerpMemoryPayload } from "../competitor-serp/types";
import { COMPETITOR_SERP_MEMORY_SCHEMA } from "../competitor-serp/types";
import type { HeroBattlePlan } from "./types";

const BATTLE_MAP_SESSION_KEY = "vokra.heroBattlePlan.mapState" as const;

export type HeroBattlePlanMapSessionState = {
  plan: HeroBattlePlan;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};

export function saveHeroBattlePlanMapSession(state: HeroBattlePlanMapSessionState): void {
  try {
    sessionStorage.setItem(BATTLE_MAP_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function consumeHeroBattlePlanMapSession(): HeroBattlePlanMapSessionState | null {
  try {
    const raw = sessionStorage.getItem(BATTLE_MAP_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(BATTLE_MAP_SESSION_KEY);
    const o = JSON.parse(raw) as HeroBattlePlanMapSessionState;
    if (!o?.plan || typeof o.plan !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

export function primeSessionsFromHeroBattlePlanMemoryPayload(payload: import("./types").HeroBattlePlanMemoryPayload): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  saveHeroBattlePlanMapSession({ plan: payload.plan, serpEnvelope: payload.serpEnvelope ?? null });
}
