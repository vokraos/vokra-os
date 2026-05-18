import type { MarketplaceOperationsSessionEnvelope, WavePatch } from "./types";
import { MOPS_SESSION_KEY, MOPS_SESSION_SCHEMA } from "./types";
import { emptyMarketplaceOperationsSession, parseMarketplaceOperationsSessionEnvelope } from "./parsePayload";

export function loadMarketplaceOperationsSession(): MarketplaceOperationsSessionEnvelope {
  try {
    const raw = sessionStorage.getItem(MOPS_SESSION_KEY);
    if (!raw) return emptyMarketplaceOperationsSession();
    const parsed = parseMarketplaceOperationsSessionEnvelope(JSON.parse(raw) as unknown);
    return parsed ?? emptyMarketplaceOperationsSession();
  } catch {
    return emptyMarketplaceOperationsSession();
  }
}

export function saveMarketplaceOperationsSession(env: MarketplaceOperationsSessionEnvelope): void {
  const next: MarketplaceOperationsSessionEnvelope = { ...env, schema: MOPS_SESSION_SCHEMA, updatedAt: Date.now() };
  try {
    sessionStorage.setItem(MOPS_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function patchWaveInMarketplaceOperationsSession(waveId: string, patch: WavePatch): MarketplaceOperationsSessionEnvelope {
  const cur = loadMarketplaceOperationsSession();
  const prev = cur.wavePatches[waveId] ?? {};
  const wavePatches = { ...cur.wavePatches, [waveId]: { ...prev, ...patch } };
  const next: MarketplaceOperationsSessionEnvelope = { ...cur, wavePatches, updatedAt: Date.now() };
  saveMarketplaceOperationsSession(next);
  return next;
}

export function mergeWavePatchesFromMemory(patches: Record<string, WavePatch>): void {
  const cur = loadMarketplaceOperationsSession();
  const wavePatches = { ...cur.wavePatches, ...patches };
  saveMarketplaceOperationsSession({ ...cur, wavePatches });
}

export function clearMarketplaceOperationsSession(): void {
  try {
    sessionStorage.removeItem(MOPS_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
