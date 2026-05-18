import type { AssortmentChecklistItemStatus } from "../assortment-actions";
import type { CollectionExecutionActionStatus } from "../collection-assortment-bridge/types";
import type { HeroExecutionActionStatus } from "../hero-assortment-bridge/types";
import type { LaunchExecutionActionStatus } from "../launch-ops/types";
import type { OperatorTaskStatus } from "./types";

export function execStatusToOperator(
  status: HeroExecutionActionStatus | CollectionExecutionActionStatus | LaunchExecutionActionStatus,
): OperatorTaskStatus {
  if (status === "done") return "done";
  if (status === "blocked") return "blocked";
  if (status === "deferred") return "deferred";
  return "todo";
}

export function checklistStatusToOperator(status: AssortmentChecklistItemStatus): OperatorTaskStatus {
  if (status === "done") return "done";
  if (status === "blocked") return "blocked";
  if (status === "deferred") return "deferred";
  return "todo";
}

export function operatorToChecklist(status: OperatorTaskStatus): AssortmentChecklistItemStatus {
  if (status === "done") return "done";
  if (status === "blocked") return "blocked";
  if (status === "deferred") return "deferred";
  return "todo";
}

export function operatorToExecStatus(
  status: OperatorTaskStatus,
): HeroExecutionActionStatus | CollectionExecutionActionStatus | LaunchExecutionActionStatus {
  if (status === "done") return "done";
  if (status === "blocked") return "blocked";
  if (status === "deferred") return "deferred";
  return "in_progress";
}

export function priorityRank(p: "high" | "medium" | "low"): number {
  if (p === "high") return 0;
  if (p === "medium") return 1;
  return 2;
}

export function execPriorityToOperator(p: "critical" | "high" | "medium" | "low"): "high" | "medium" | "low" {
  if (p === "critical" || p === "high") return "high";
  if (p === "medium") return "medium";
  return "low";
}
