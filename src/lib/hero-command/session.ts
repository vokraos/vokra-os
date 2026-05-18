import type { HeroCommandMemoryPayload } from "./types";
import { gatherHeroWorkflowArtifacts } from "./gather";
import { primeHeroWorkflowToMapSessions } from "./prime";

const HERO_COMMAND_SESSION_KEY = "vokra.heroCommand.state" as const;

export function saveHeroCommandMapSession(payload: HeroCommandMemoryPayload): void {
  try {
    sessionStorage.setItem(HERO_COMMAND_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekHeroCommandMapSession(): HeroCommandMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(HERO_COMMAND_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as HeroCommandMemoryPayload;
    if (!o?.snapshot) return null;
    return o;
  } catch {
    return null;
  }
}

export function consumeHeroCommandMapSession(): HeroCommandMemoryPayload | null {
  try {
    const o = peekHeroCommandMapSession();
    if (!o) return null;
    sessionStorage.removeItem(HERO_COMMAND_SESSION_KEY);
    return o;
  } catch {
    return null;
  }
}

export function primeSessionsFromHeroCommandMemoryPayload(payload: HeroCommandMemoryPayload): void {
  saveHeroCommandMapSession(payload);
  const artifacts = payload.artifacts ?? gatherHeroWorkflowArtifacts();
  primeHeroWorkflowToMapSessions(artifacts);
}
