import { getActiveProjectId } from "../memory/service";
import { loadSnapshot } from "../memory/persist";

export type FabricMemoryHints = {
  generationCount: number;
  trendRuns: number;
  seoRuns: number;
  visualRuns: number;
  campaignRuns: number;
  executionPlans: number;
  hasRepeatedLaunchPattern: boolean;
};

export function buildFabricMemoryHints(): FabricMemoryHints {
  const projectId = getActiveProjectId();
  const snap = loadSnapshot();
  if (!projectId || !snap.projects[projectId]) {
    return {
      generationCount: 0,
      trendRuns: 0,
      seoRuns: 0,
      visualRuns: 0,
      campaignRuns: 0,
      executionPlans: 0,
      hasRepeatedLaunchPattern: false,
    };
  }
  const p = snap.projects[projectId]!;
  let trendRuns = 0;
  let seoRuns = 0;
  let visualRuns = 0;
  let campaignRuns = 0;
  let executionPlans = 0;
  const titles: string[] = [];

  for (const gid of p.generationIds) {
    const g = snap.generations[gid];
    if (!g) continue;
    if (g.module === "trend_radar") trendRuns += 1;
    if (g.module === "seo") seoRuns += 1;
    if (g.module === "campaign") campaignRuns += 1;
    if (g.module === "execution_planner") executionPlans += 1;
    titles.push(g.title);
  }

  for (const vid of p.visualAnalysisIds) {
    if (snap.visualAnalyses[vid]) visualRuns += 1;
  }

  const generationCount = p.generationIds.length + p.visualAnalysisIds.length;
  const norm = titles.map((t) => t.toLowerCase().replace(/\s+/g, " "));
  const hasRepeatedLaunchPattern = norm.some((t, i) => norm.slice(i + 1).some((u) => u.length > 12 && t.includes(u.slice(0, 12))));

  return {
    generationCount,
    trendRuns,
    seoRuns,
    visualRuns,
    campaignRuns,
    executionPlans,
    hasRepeatedLaunchPattern,
  };
}
