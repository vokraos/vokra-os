import { getActiveProjectId } from "../memory/service";
import { loadSnapshot } from "../memory/persist";
import type { TemporalMemoryHints } from "./types";

/** Pulls Project Memory signals for narrative continuity (trends / command density). */
export function buildTemporalMemoryHints(): TemporalMemoryHints {
  const projectId = getActiveProjectId();
  const snap = loadSnapshot();
  if (!projectId || !snap.projects[projectId]) {
    return { trendRadarCount: 0, strategicCommandCount: 0, recentTrendTitle: null };
  }
  const p = snap.projects[projectId]!;
  let trendRadarCount = 0;
  let strategicCommandCount = 0;
  let recentTrendTitle: string | null = null;
  let latestTrendAt = 0;

  for (const gid of p.generationIds) {
    const g = snap.generations[gid];
    if (!g) continue;
    if (g.module === "trend_radar") {
      trendRadarCount += 1;
      if (g.createdAt >= latestTrendAt) {
        latestTrendAt = g.createdAt;
        recentTrendTitle = g.title;
      }
    }
    if (g.module === "strategic_command") strategicCommandCount += 1;
  }

  return { trendRadarCount, strategicCommandCount, recentTrendTitle };
}
