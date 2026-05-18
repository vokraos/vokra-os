import { parseVisualAssetRegistryEnvelope } from "./parseRegistry";
import type { VisualAssetEntity, VisualAssetRegistryEnvelope } from "./types";
import { VISUAL_ASSET_REGISTRY_SCHEMA, VISUAL_ASSET_REGISTRY_SESSION_KEY } from "./types";

export function emptyVisualAssetRegistry(): VisualAssetRegistryEnvelope {
  return { schema: VISUAL_ASSET_REGISTRY_SCHEMA, assets: [], updatedAt: Date.now() };
}

export function loadVisualAssetRegistryFromSession(): VisualAssetRegistryEnvelope | null {
  try {
    const raw = sessionStorage.getItem(VISUAL_ASSET_REGISTRY_SESSION_KEY);
    if (!raw) return null;
    return parseVisualAssetRegistryEnvelope(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveVisualAssetRegistryToSession(env: VisualAssetRegistryEnvelope): void {
  const next: VisualAssetRegistryEnvelope = { ...env, updatedAt: Date.now() };
  try {
    sessionStorage.setItem(VISUAL_ASSET_REGISTRY_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function clearVisualAssetRegistrySession(): void {
  try {
    sessionStorage.removeItem(VISUAL_ASSET_REGISTRY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function registryToJsonString(env: VisualAssetRegistryEnvelope): string {
  return JSON.stringify(env, null, 2);
}

export function tryAppendVisualAsset(
  asset: VisualAssetEntity,
): { ok: true; registry: VisualAssetRegistryEnvelope } | { ok: false; reason: "duplicate" } {
  const cur = loadVisualAssetRegistryFromSession() ?? emptyVisualAssetRegistry();
  if (cur.assets.some((a) => a.sourceJobId === asset.sourceJobId)) return { ok: false, reason: "duplicate" };
  const next: VisualAssetRegistryEnvelope = { ...cur, assets: [...cur.assets, asset], updatedAt: Date.now() };
  saveVisualAssetRegistryToSession(next);
  return { ok: true, registry: next };
}

export function patchAssetInSession(assetId: string, patch: Partial<VisualAssetEntity>): VisualAssetRegistryEnvelope | null {
  const cur = loadVisualAssetRegistryFromSession();
  if (!cur) return null;
  const idx = cur.assets.findIndex((a) => a.id === assetId);
  if (idx < 0) return null;
  const prev = cur.assets[idx]!;
  const nextFatigue =
    patch.fatigue !== undefined ? { ...prev.fatigue, ...patch.fatigue } : prev.fatigue;
  const { fatigue: _f, ...restPatch } = patch;
  const nextAsset: VisualAssetEntity = {
    ...prev,
    ...restPatch,
    fatigue: nextFatigue,
    updatedAt: Date.now(),
  };
  const assets = cur.assets.slice();
  assets[idx] = nextAsset;
  const next: VisualAssetRegistryEnvelope = { ...cur, assets, updatedAt: Date.now() };
  saveVisualAssetRegistryToSession(next);
  return next;
}
