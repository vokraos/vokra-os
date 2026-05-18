import { getActiveProjectId } from "../memory/service";
import { loadSnapshot } from "../memory/persist";

export type ExecutionMemoryHints = {
  savedPlansCount: number;
  lastPlanTitle: string | null;
};

export function buildExecutionMemoryHints(): ExecutionMemoryHints {
  const projectId = getActiveProjectId();
  const snap = loadSnapshot();
  if (!projectId || !snap.projects[projectId]) {
    return { savedPlansCount: 0, lastPlanTitle: null };
  }
  const p = snap.projects[projectId]!;
  let savedPlansCount = 0;
  let lastPlanTitle: string | null = null;
  let latest = 0;
  for (const gid of p.generationIds) {
    const g = snap.generations[gid];
    if (!g || g.module !== "execution_planner") continue;
    savedPlansCount += 1;
    if (g.createdAt >= latest) {
      latest = g.createdAt;
      lastPlanTitle = g.title;
    }
  }
  return { savedPlansCount, lastPlanTitle };
}
