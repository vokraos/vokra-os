import type { InitiativeMemory } from "./types";

const STORAGE_KEY = "vokra.initiative.memory.v1";

export function loadInitiativeMemory(): InitiativeMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { suppressedUntil: {}, patternStrength: {} };
    const o = JSON.parse(raw) as Partial<InitiativeMemory>;
    return {
      suppressedUntil: typeof o.suppressedUntil === "object" && o.suppressedUntil != null ? o.suppressedUntil : {},
      patternStrength: typeof o.patternStrength === "object" && o.patternStrength != null ? o.patternStrength : {},
    };
  } catch {
    return { suppressedUntil: {}, patternStrength: {} };
  }
}

export function persistInitiativeMemory(m: InitiativeMemory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  } catch {
    /* private mode / quota */
  }
}

export function pruneInitiativeMemory(pulseGen: number, m: InitiativeMemory): InitiativeMemory {
  const suppressedUntil: Record<string, number> = {};
  for (const [k, until] of Object.entries(m.suppressedUntil)) {
    if (until > pulseGen) suppressedUntil[k] = until;
  }
  return { ...m, suppressedUntil };
}

export function suppressInitiative(id: string, pulseGen: number, m: InitiativeMemory, pulses = 5): InitiativeMemory {
  return {
    ...m,
    suppressedUntil: { ...m.suppressedUntil, [id]: pulseGen + pulses },
  };
}

export function reinforcePattern(patternKey: string, m: InitiativeMemory, delta = 1): InitiativeMemory {
  const n = (m.patternStrength[patternKey] ?? 0) + delta;
  return {
    ...m,
    patternStrength: { ...m.patternStrength, [patternKey]: Math.min(12, n) },
  };
}

export function isSuppressed(id: string, pulseGen: number, m: InitiativeMemory): boolean {
  const until = m.suppressedUntil[id];
  return until != null && pulseGen < until;
}

export function patternBoost(patternKey: string, m: InitiativeMemory): number {
  return Math.min(18, (m.patternStrength[patternKey] ?? 0) * 1.5);
}
