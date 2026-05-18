import type { PricePositioningReport } from "./types";

export const PRICE_POSITIONING_MEMORY_SCHEMA = "vokra.pricePositioning.v1" as const;

export type PricePositioningMemoryPayload = {
  schema: typeof PRICE_POSITIONING_MEMORY_SCHEMA;
  savedAt: number;
  reports: PricePositioningReport[];
};

const SESSION_KEY = "vokra.pricePositioning.state" as const;

export function savePricePositioningSession(payload: PricePositioningMemoryPayload): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekPricePositioningSession(): PricePositioningMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as PricePositioningMemoryPayload;
    return o?.reports?.length ? o : null;
  } catch {
    return null;
  }
}

export function buildPricePositioningMemoryPayload(
  reports: PricePositioningReport[],
): PricePositioningMemoryPayload {
  return {
    schema: PRICE_POSITIONING_MEMORY_SCHEMA,
    savedAt: Date.now(),
    reports,
  };
}
