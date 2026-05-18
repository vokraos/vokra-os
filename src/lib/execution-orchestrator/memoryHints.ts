import { getActiveProjectId } from "../memory/service";
import { loadSnapshot } from "../memory/persist";

export type OrchestratorMemoryHints = {
  savedOrchestrations: number;
  lastTitle: string | null;
};

export function buildOrchestratorMemoryHints(): OrchestratorMemoryHints {
  const projectId = getActiveProjectId();
  const snap = loadSnapshot();
  if (!projectId || !snap.projects[projectId]) {
    return { savedOrchestrations: 0, lastTitle: null };
  }
  const p = snap.projects[projectId]!;
  let savedOrchestrations = 0;
  let lastTitle: string | null = null;
  let latest = 0;
  for (const gid of p.generationIds) {
    const g = snap.generations[gid];
    if (!g || g.module !== "execution_orchestrator") continue;
    savedOrchestrations += 1;
    if (g.createdAt >= latest) {
      latest = g.createdAt;
      lastTitle = g.title;
    }
  }
  return { savedOrchestrations, lastTitle };
}
