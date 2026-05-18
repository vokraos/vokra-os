import { loadCardProductionBoardFromSession } from "../card-production/sessionStorage";
import {
  buildCollectionEntity,
  buildCollectionExecutionPipeline,
  type CollectionDeriveInput,
  type CollectionPipelineInputWithoutEntity,
} from "../collection-builder";
import { gatherHeroWorkflowArtifacts } from "../hero-command";
import { loadPromptPackFromSession } from "../prompt-pack/sessionStorage";
import { loadVisualAssetRegistryFromSession } from "../visual-assets";
import { getActiveEntitySnapshot, readSnapshotCollectionHint } from "../entity-snapshot";
import { loadLatestLaunchReviewForCollection, loadLaunchReviewForPlan } from "./review/storage";
import type { LaunchOpsGatherContext } from "./types";

/** Build gather context without React hooks (call from views with pre-wired OS input). */
export function gatherLaunchOpsContext(
  collectionDeriveInput: CollectionDeriveInput,
  pipelineOsInput: CollectionPipelineInputWithoutEntity,
  candidateSalt = 0,
): LaunchOpsGatherContext {
  const snap = getActiveEntitySnapshot();
  const hero = gatherHeroWorkflowArtifacts();
  const collection = buildCollectionEntity({ ...collectionDeriveInput, candidateSalt });
  const pipeline = buildCollectionExecutionPipeline({ entity: collection, ...pipelineOsInput });

  const board = loadCardProductionBoardFromSession();
  const plans = board?.plans ?? [];
  const launchReady = plans.filter(
    (p) =>
      p.collectionId === collection.id &&
      (p.cardStatus === "ready_wb" || p.cardStatus === "ready_ozon" || p.cardStatus === "ready_both"),
  ).length;

  const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
  const winner =
    Boolean(hero.resultsBundle?.winnerVariantId) ||
    Boolean(hero.launchPackage?.winningVariantId);

  const planReview =
    loadLatestLaunchReviewForCollection(collection.id) ??
    null;

  return {
    entitySnapshotId: snap?.id ?? null,
    collection,
    pipeline,
    heroLaunchPackage: hero.launchPackage,
    heroWinnerExists: winner,
    promptPackInSession: Boolean(loadPromptPackFromSession()),
    visualAssetCount: assets.length,
    cardPlanCount: plans.filter((p) => p.collectionId === collection.id).length,
    cardPlansLaunchReady: launchReady,
    orchestration: pipelineOsInput.orchestration ?? null,
    synthesisLaunchReadiness: collectionDeriveInput.synthesis.launchReadiness,
    visualFatigue: collectionDeriveInput.visualFatigue ?? 0,
    seoSaturation: collectionDeriveInput.seoSaturation ?? 0,
    latestLaunchReview: planReview,
  };
}

export function loadLaunchReviewForContext(planId: string, collectionId: string) {
  return loadLaunchReviewForPlan(planId) ?? loadLatestLaunchReviewForCollection(collectionId);
}

export function gatherLaunchOpsContextFromHint(
  collectionDeriveInput: CollectionDeriveInput,
  pipelineOsInput: Parameters<typeof gatherLaunchOpsContext>[1],
): LaunchOpsGatherContext {
  const hint = readSnapshotCollectionHint();
  const salt = hint ? 1 : 0;
  return gatherLaunchOpsContext(collectionDeriveInput, pipelineOsInput, salt);
}
