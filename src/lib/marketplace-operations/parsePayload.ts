import {
  MOPS_MEMORY_SCHEMA,
  MOPS_SESSION_SCHEMA,
  type MarketplaceOperationsMemoryPayload,
  type MarketplaceOperationsSessionEnvelope,
  type MarketplaceOperationalSnapshot,
  type WavePatch,
} from "./types";

export function emptyMarketplaceOperationsSession(): MarketplaceOperationsSessionEnvelope {
  return { schema: MOPS_SESSION_SCHEMA, wavePatches: {}, updatedAt: Date.now() };
}

export function parseMarketplaceOperationsMemoryPayload(payload: unknown): MarketplaceOperationsMemoryPayload | null {
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  if (o.schema !== MOPS_MEMORY_SCHEMA) return null;
  const wavePatches = o.wavePatches;
  if (!wavePatches || typeof wavePatches !== "object") return null;
  const frozen = o.frozenSnapshot;
  return {
    schema: MOPS_MEMORY_SCHEMA,
    savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
    wavePatches: wavePatches as Record<string, WavePatch>,
    frozenSnapshot: frozen && typeof frozen === "object" ? (frozen as MarketplaceOperationalSnapshot) : undefined,
  };
}

export function parseMarketplaceOperationsSessionEnvelope(raw: unknown): MarketplaceOperationsSessionEnvelope | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schema !== MOPS_SESSION_SCHEMA) return null;
  const wavePatches = o.wavePatches;
  if (!wavePatches || typeof wavePatches !== "object") return null;
  return {
    schema: MOPS_SESSION_SCHEMA,
    wavePatches: wavePatches as Record<string, WavePatch>,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : Date.now(),
  };
}
