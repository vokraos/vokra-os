import { setAssortmentChecklistStatus } from "../assortment-actions";
import { setCollectionExecutionActionStatus } from "../collection-assortment-bridge/storage";
import { setHeroExecutionActionStatus } from "../hero-assortment-bridge/storage";
import { setLaunchExecutionActionStatus } from "../launch-ops/assortmentStorage";
import { loadVisualProductionQueueFromSession, saveVisualProductionQueueToSession } from "../visual-production/sessionStorage";
import { patchCardPlanInSession } from "../card-production/sessionStorage";
import { getActiveEntitySnapshot } from "../entity-snapshot";
import { setOperatorOverlayStatus } from "./overlay";
import { operatorToChecklist, operatorToExecStatus } from "./status-map";
import type { OperatorTask, OperatorTaskStatus } from "./types";

export function setOperatorTaskStatus(task: OperatorTask, status: OperatorTaskStatus): boolean {
  const snapshot = getActiveEntitySnapshot();
  const snapshotId = snapshot?.id;

  switch (task.source) {
    case "assortment":
      if (!snapshotId) return false;
      setAssortmentChecklistStatus(snapshotId, task.id, operatorToChecklist(status));
      return true;
    case "hero":
      if (!snapshotId) return false;
      setHeroExecutionActionStatus(snapshotId, task.id, operatorToExecStatus(status));
      return true;
    case "collection":
      if (!snapshotId) return false;
      setCollectionExecutionActionStatus(snapshotId, task.id, operatorToExecStatus(status));
      return true;
    case "launch":
      if (!snapshotId) return false;
      setLaunchExecutionActionStatus(snapshotId, task.id, operatorToExecStatus(status));
      return true;
    case "visual": {
      const queue = loadVisualProductionQueueFromSession();
      if (!queue) {
        setOperatorOverlayStatus("visual", task.id, status);
        return true;
      }
      const jobs = queue.jobs.map((j) => {
        if (j.id !== task.id) return j;
        if (status === "done") return { ...j, status: "approved" as const, updatedAt: Date.now() };
        if (status === "blocked") return { ...j, status: "needs_revision" as const, updatedAt: Date.now() };
        return { ...j, updatedAt: Date.now() };
      });
      saveVisualProductionQueueToSession({ ...queue, jobs });
      if (status === "deferred") setOperatorOverlayStatus("visual", task.id, status);
      return true;
    }
    case "card": {
      if (status === "done") patchCardPlanInSession(task.id, { cardStatus: "ready_both" });
      else if (status === "blocked") patchCardPlanInSession(task.id, { cardStatus: "blocked" });
      else setOperatorOverlayStatus("card", task.id, status);
      return true;
    }
    case "cleanup":
      setOperatorOverlayStatus("cleanup", task.id, status);
      return true;
    default:
      return false;
  }
}
