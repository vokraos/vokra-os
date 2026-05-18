import type { ClusterOverlapEdge, SearchClusterEntity } from "./types";
import { normalizeQuery } from "./cluster-derive";

function tokenSet(q: string): Set<string> {
  return new Set(
    normalizeQuery(q)
      .split(/[\s·.-]+/)
      .filter((w) => w.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Pairwise query overlap in same marketplace — structural collision proxy. */
export function computeClusterOverlaps(clusters: readonly SearchClusterEntity[]): ClusterOverlapEdge[] {
  const edges: ClusterOverlapEdge[] = [];
  const byMp = new Map<string, SearchClusterEntity[]>();
  for (const c of clusters) {
    const k = c.marketplace;
    const arr = byMp.get(k) ?? [];
    arr.push(c);
    byMp.set(k, arr);
  }
  for (const group of byMp.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]!;
        const b = group[j]!;
        const sim = jaccard(tokenSet(a.normalizedQuery), tokenSet(b.normalizedQuery));
        const corridorBonus = a.corridor === b.corridor ? 0.18 : 0;
        const risk = Math.min(100, Math.round(100 * (sim * 0.72 + corridorBonus)));
        if (risk >= 18) edges.push({ aId: a.id, bId: b.id, risk });
      }
    }
  }
  return edges.sort((x, y) => y.risk - x.risk);
}

/** Mutates cluster `overlapRisk` to max edge risk touching that cluster. */
export function applyOverlapRiskToClusters(clusters: SearchClusterEntity[], edges: readonly ClusterOverlapEdge[]): void {
  const maxBy = new Map<string, number>();
  for (const e of edges) {
    maxBy.set(e.aId, Math.max(maxBy.get(e.aId) ?? 0, e.risk));
    maxBy.set(e.bId, Math.max(maxBy.get(e.bId) ?? 0, e.risk));
  }
  for (const c of clusters) {
    c.overlapRisk = maxBy.get(c.id) ?? Math.min(35, Math.round(c.saturationLevel * 0.25));
  }
}
