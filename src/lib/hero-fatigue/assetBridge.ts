import { loadVisualAssetRegistryFromSession, patchAssetInSession } from "../visual-assets";

/** Marks hero registry rows with elevated fatigue-risk metadata (session registry only). */
export function markHeroAssetsFatigueRisk(params: { query: string; skuCode?: string | null; note: string }): number {
  const env = loadVisualAssetRegistryFromSession();
  if (!env?.assets.length) return 0;
  const q = params.query.trim().toLowerCase();
  const sku = params.skuCode?.trim();
  const heroAssets = env.assets.filter((a) => a.assetRole === "wb_hero" || a.assetRole === "ozon_hero");
  const matched = heroAssets.filter((a) => {
    if (sku) return a.linkedSkuIds.includes(sku) || a.title.toLowerCase().includes(sku.toLowerCase());
    if (!q) return true;
    return `${a.title} ${a.collectionName}`.toLowerCase().includes(q.slice(0, Math.min(18, q.length)));
  });
  const pick = (matched.length ? matched : heroAssets).slice(0, 5);
  let n = 0;
  for (const a of pick) {
    const prev = a.fatigue;
    const nextRisk = Math.max(4, a.fatigueRiskScore ?? 0, prev.fatigueRiskScore ?? 0);
    patchAssetInSession(a.id, {
      fatigueRiskScore: nextRisk,
      fatigue: {
        ...prev,
        fatigueRiskScore: nextRisk,
        refreshRecommendation: `[Hero fatigue OS] ${params.note}\n${prev.refreshRecommendation}`.slice(0, 720),
      },
    });
    n += 1;
  }
  return n;
}
