import { loadVisualProductionQueueFromSession } from "../visual-production/sessionStorage";

export function countHeroRefreshJobsInSession(query: string): number {
  const q = query.trim().toLowerCase();
  const env = loadVisualProductionQueueFromSession();
  if (!env?.jobs?.length || !q) return 0;
  let n = 0;
  for (const j of env.jobs) {
    if (j.jobType !== "hero_visual") continue;
    const blob = `${j.title} ${j.prompt} ${j.collectionId}`.toLowerCase();
    if (blob.includes(q.slice(0, 24))) n += 1;
  }
  return n;
}

export function refreshUrgencyIndex(args: {
  fatigueIdx: number;
  readabilityPressure: number;
  overlapStress: number;
  semanticRep: number;
  refreshJobCount: number;
}): number {
  const refreshBoost = Math.min(28, args.refreshJobCount * 6);
  const raw =
    args.fatigueIdx * 0.34 +
    args.readabilityPressure * 0.22 +
    args.semanticRep * 0.18 +
    args.overlapStress * 0.12 +
    refreshBoost;
  return Math.round(Math.min(100, raw));
}
