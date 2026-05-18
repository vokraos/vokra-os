import type { MemorySnapshot } from "../memory/types";
import type { MemoryDerivedSignals, WithProvenance } from "./types";

const DAY = 86_400_000;

function w<T>(value: T, provenance: WithProvenance<T>["provenance"], detailKey?: string): WithProvenance<T> {
  return { value, provenance, detailKey };
}

export function deriveMemorySignals(
  snap: MemorySnapshot,
  projectId: string | null,
): MemoryDerivedSignals {
  const proj = projectId ? snap.projects[projectId] : null;
  const title = proj?.title ?? null;

  const skuIds = proj?.skuIds ?? [];
  const skuCount = skuIds.filter((id) => snap.skus[id]).length;

  const genIds = proj?.generationIds ?? [];
  const now = Date.now();
  const cutoff = now - 30 * DAY;
  let gen30 = 0;
  let lastActivity: number | null = null;

  for (const gid of genIds) {
    const g = snap.generations[gid];
    if (!g) continue;
    if (g.createdAt >= cutoff) gen30 += 1;
    lastActivity = lastActivity == null ? g.createdAt : Math.max(lastActivity, g.createdAt);
  }

  const visIds = proj?.visualAnalysisIds ?? [];
  let visCount = 0;
  for (const vid of visIds) {
    if (snap.visualAnalyses[vid]) visCount += 1;
    const va = snap.visualAnalyses[vid];
    if (va) {
      lastActivity = lastActivity == null ? va.createdAt : Math.max(lastActivity, va.createdAt);
    }
  }

  const cats = new Set<string>();
  for (const sid of skuIds) {
    const s = snap.skus[sid];
    if (s?.category?.trim()) cats.add(s.category.trim());
  }

  return {
    projectTitle: title,
    skuCount: w(skuCount, "memory-derived"),
    generationCount30d: w(gen30, "memory-derived"),
    visualAnalysisCount: w(visCount, "memory-derived"),
    uniqueCategories: w(cats.size, "memory-derived"),
    lastActivityAt: w(lastActivity, "memory-derived"),
  };
}
