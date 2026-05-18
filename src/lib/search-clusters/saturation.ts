import type { SearchClusterEntity } from "./types";

/** Map row density to 0–100 saturation curve (structural, not SERP rank). */
export function computeSaturationByClusterId(clusters: readonly SearchClusterEntity[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of clusters) {
    const n = c.relatedSkuIds.length + c.relatedCardIds.length;
    const base = c.saturationLevel;
    const mass = Math.min(28, Math.round(Math.log1p(n) * 14));
    out[c.id] = Math.min(100, Math.round(base * 0.72 + mass));
  }
  return out;
}
