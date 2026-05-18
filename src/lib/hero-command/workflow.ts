import type { HeroStageStatus, HeroWorkflowArtifacts, HeroWorkflowStage, HeroWorkflowStageId } from "./types";

const STAGE_ORDER: readonly HeroWorkflowStageId[] = [
  "serp",
  "gap",
  "archetype",
  "readability",
  "fatigue",
  "battlePlan",
  "testMatrix",
  "results",
  "launchPackage",
  "observation",
] as const;

function hasSerp(a: HeroWorkflowArtifacts): boolean {
  return Boolean(a.serp?.snapshot?.items?.length);
}

function hasGap(a: HeroWorkflowArtifacts): boolean {
  return Boolean(a.gap && a.ourCard);
}

function hasArchetype(a: HeroWorkflowArtifacts): boolean {
  return Boolean(a.archetype);
}

function hasReadability(a: HeroWorkflowArtifacts): boolean {
  return Boolean(a.readability);
}

function hasFatigue(a: HeroWorkflowArtifacts): boolean {
  return Boolean(a.fatigue);
}

function hasBattlePlan(a: HeroWorkflowArtifacts): boolean {
  return Boolean(a.battlePlan);
}

function hasTestMatrix(a: HeroWorkflowArtifacts): boolean {
  return Boolean(a.testMatrix && a.testMatrix.testVariants.length > 0);
}

function hasResultsReviewed(a: HeroWorkflowArtifacts): boolean {
  if (!a.resultsBundle) return false;
  if (a.resultsBundle.winnerVariantId) return true;
  return a.resultsBundle.results.some((r) => r.resultStatus === "winner");
}

function hasLaunchPackage(a: HeroWorkflowArtifacts): boolean {
  return Boolean(a.launchPackage);
}

function hasObservation(a: HeroWorkflowArtifacts): boolean {
  return Boolean(a.postLaunchObservation?.observationDate?.trim());
}

function stageComplete(id: HeroWorkflowStageId, a: HeroWorkflowArtifacts): boolean {
  switch (id) {
    case "serp":
      return hasSerp(a);
    case "gap":
      return hasGap(a);
    case "archetype":
      return hasArchetype(a);
    case "readability":
      return hasReadability(a);
    case "fatigue":
      return hasFatigue(a);
    case "battlePlan":
      return hasBattlePlan(a);
    case "testMatrix":
      return hasTestMatrix(a);
    case "results":
      return hasResultsReviewed(a);
    case "launchPackage":
      return hasLaunchPackage(a);
    case "observation":
      return hasObservation(a);
    default:
      return false;
  }
}

function stageNeedsReview(id: HeroWorkflowStageId, a: HeroWorkflowArtifacts): boolean {
  if (id === "testMatrix" && hasTestMatrix(a) && !hasResultsReviewed(a)) {
    const pending = a.resultsBundle?.results.some((r) => r.resultStatus === "pending" || r.resultStatus === "shortlisted");
    return !hasResultsReviewed(a) && (pending !== false || !a.resultsBundle);
  }
  if (id === "results" && a.resultsBundle && !hasResultsReviewed(a)) return true;
  return false;
}

function stageReady(id: HeroWorkflowStageId, a: HeroWorkflowArtifacts): boolean {
  const idx = STAGE_ORDER.indexOf(id);
  if (idx <= 0) return !stageComplete(id, a);
  const prev = STAGE_ORDER[idx - 1]!;
  return stageComplete(prev, a) && !stageComplete(id, a) && !stageNeedsReview(id, a);
}

export function detectNextStepKey(a: HeroWorkflowArtifacts): string {
  if (!hasSerp(a)) return "hc.next.serp";
  if (!hasGap(a)) return "hc.next.gap";
  if (!hasArchetype(a)) return "hc.next.archetype";
  if (!hasReadability(a)) return "hc.next.readability";
  if (!hasFatigue(a)) return "hc.next.fatigue";
  if (!hasBattlePlan(a)) return "hc.next.battlePlan";
  if (!hasTestMatrix(a)) return "hc.next.testMatrix";
  if (!hasResultsReviewed(a)) return "hc.next.results";
  if (!hasLaunchPackage(a)) return "hc.next.launchPackage";
  if (!hasObservation(a)) return "hc.next.observation";
  return "hc.next.complete";
}

export function deriveWorkflowStages(a: HeroWorkflowArtifacts): HeroWorkflowStage[] {
  const nextKey = detectNextStepKey(a);
  const nextStageId = nextKeyToStageId(nextKey);

  return STAGE_ORDER.map((id) => {
    let status: HeroStageStatus;
    if (stageComplete(id, a)) {
      status = "completed";
    } else if (stageNeedsReview(id, a)) {
      status = "needs_review";
    } else if (id === nextStageId) {
      status = "active";
    } else if (stageReady(id, a)) {
      status = "ready";
    } else {
      status = "missing";
    }
    return { id, status };
  });
}

function nextKeyToStageId(key: string): HeroWorkflowStageId | null {
  const map: Record<string, HeroWorkflowStageId> = {
    "hc.next.serp": "serp",
    "hc.next.gap": "gap",
    "hc.next.archetype": "archetype",
    "hc.next.readability": "readability",
    "hc.next.fatigue": "fatigue",
    "hc.next.battlePlan": "battlePlan",
    "hc.next.testMatrix": "testMatrix",
    "hc.next.results": "results",
    "hc.next.launchPackage": "launchPackage",
    "hc.next.observation": "observation",
  };
  return map[key] ?? null;
}

export function activeStageLabelKey(stages: HeroWorkflowStage[]): string {
  const active = stages.find((s) => s.status === "active" || s.status === "needs_review");
  if (active) return `hc.stage.${active.id}`;
  const lastDone = [...stages].reverse().find((s) => s.status === "completed");
  if (lastDone) return `hc.stage.${lastDone.id}`;
  return "hc.stage.serp";
}
