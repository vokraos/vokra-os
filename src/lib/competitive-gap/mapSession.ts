import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import { saveCompetitorSerpToSession } from "../competitor-serp/memoryPayload";
import type { CompetitorSerpMemoryPayload } from "../competitor-serp/types";
import { COMPETITOR_SERP_MEMORY_SCHEMA } from "../competitor-serp/types";
import type { CompetitiveGapAnalysis, OurCardCompetitiveSnapshot } from "./types";

const GAP_MAP_SESSION_KEY = "vokra.competitiveGap.mapState" as const;

export type GapMapSessionState = {
  ourCard: OurCardCompetitiveSnapshot;
  gap: CompetitiveGapAnalysis;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};

export function saveGapMapSession(state: GapMapSessionState): void {
  try {
    sessionStorage.setItem(GAP_MAP_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function consumeGapMapSession(): GapMapSessionState | null {
  try {
    const raw = sessionStorage.getItem(GAP_MAP_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(GAP_MAP_SESSION_KEY);
    const o = JSON.parse(raw) as GapMapSessionState;
    if (!o?.gap || !o?.ourCard || typeof o.gap !== "object" || typeof o.ourCard !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

export function primeSessionsFromGapMemoryPayload(payload: import("./types").CompetitiveGapAnalysisMemoryPayload): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  saveGapMapSession({ ourCard: payload.ourCard, gap: payload.gap, serpEnvelope: payload.serpEnvelope ?? null });
}
