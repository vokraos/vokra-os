import { newHeroCommandId } from "./ids";
import type { HeroCommandSnapshot, HeroWorkflowArtifacts } from "./types";
import { hasAnyHeroWorkflowSignal, gatherHeroWorkflowArtifacts } from "./gather";
import { activeStageLabelKey, deriveWorkflowStages, detectNextStepKey } from "./workflow";

function clip(s: string, max: number): string {
  const x = s.replace(/\s+/g, " ").trim();
  if (!x) return "";
  return x.length <= max ? x : `${x.slice(0, max - 1)}…`;
}

function resolveQueryMarket(a: HeroWorkflowArtifacts): { query: string; marketplace: string } {
  const q =
    a.launchPackage?.query ??
    a.testMatrix?.query ??
    a.battlePlan?.query ??
    a.resultsBundle?.query ??
    a.postLaunchObservation?.query ??
    a.serp?.snapshot?.query ??
    "";
  const m =
    a.launchPackage?.marketplace ??
    a.testMatrix?.marketplace ??
    a.battlePlan?.marketplace ??
    a.resultsBundle?.marketplace ??
    a.postLaunchObservation?.marketplace ??
    a.serp?.snapshot?.marketplace ??
    "";
  return { query: q, marketplace: m };
}

function resolveDirection(a: HeroWorkflowArtifacts): string {
  const from =
    a.launchPackage?.heroDirection ??
    a.battlePlan?.promptDirection ??
    a.testMatrix?.baselineHeroDirection ??
    a.heroPlan?.recommendedHeroDirection ??
    "";
  return clip(from, 200);
}

function resolveWinnerLabel(a: HeroWorkflowArtifacts): string | null {
  const wid = a.resultsBundle?.winnerVariantId ?? a.launchPackage?.winningVariantId ?? null;
  if (!wid) return null;
  const v = a.testMatrix?.testVariants.find((x) => x.id === wid);
  if (v) return clip(v.variantName || v.id, 80);
  return clip(wid, 80);
}

export function buildHeroCommandSnapshot(
  artifacts?: HeroWorkflowArtifacts,
  existingId?: string,
): HeroCommandSnapshot {
  const a = artifacts ?? gatherHeroWorkflowArtifacts();
  const stages = deriveWorkflowStages(a);
  const nextStepKey = detectNextStepKey(a);
  const { query, marketplace } = resolveQueryMarket(a);

  const launchReadiness = a.launchPackage
    ? a.launchPackage.readiness === "ready_for_manual_launch"
      ? "ready"
      : a.launchPackage.readiness === "partial"
        ? "partial"
        : "not_ready"
    : null;

  const postLaunchStatus = a.postLaunchObservation
    ? a.postLaunchObservation.observationDate?.trim()
      ? "recorded"
      : "draft"
    : null;

  return {
    id: existingId ?? newHeroCommandId(),
    updatedAt: Date.now(),
    query,
    marketplace,
    currentDirection: resolveDirection(a),
    winnerVariantLabel: resolveWinnerLabel(a),
    launchReadiness,
    postLaunchStatus,
    nextStepKey,
    stages,
    sourceIds: {
      serpSnapshotId: a.serp?.snapshot?.id ?? null,
      gapId: a.gap?.id ?? null,
      archetypeReportId: a.archetype?.id ?? null,
      readabilityReportId: a.readability?.id ?? null,
      fatigueReportId: a.fatigue?.id ?? null,
      battlePlanId: a.battlePlan?.id ?? null,
      testMatrixId: a.testMatrix?.id ?? null,
      resultsBundleMatrixId: a.resultsBundle?.sourceMatrixId ?? null,
      launchPackageId: a.launchPackage?.id ?? null,
      observationId: a.postLaunchObservation?.id ?? null,
      heroPlanId: a.heroPlan?.id ?? null,
    },
    hasActiveWorkflow: hasAnyHeroWorkflowSignal(a),
  };
}

export function getHeroCommandStageLabelKey(snapshot: HeroCommandSnapshot): string {
  return activeStageLabelKey(snapshot.stages);
}
