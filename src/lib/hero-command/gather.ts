import { parseCompetitorSerpMemoryPayload } from "../competitor-serp/memoryPayload";
import { parseCompetitiveGapAnalysisMemoryPayload } from "../competitive-gap/memoryPayload";
import { getActiveProjectId } from "../memory/service";
import { loadSnapshot } from "../memory/persist";
import { parseHeroArchetypeIntelligenceMemoryPayload } from "../hero-archetypes/memoryPayload";
import { parseHeroBattlePlanMemoryPayload } from "../hero-battle-plan/memoryPayload";
import { parseHeroFatigueIntelligenceMemoryPayload } from "../hero-fatigue/memoryPayload";
import { parseHeroImprovementPlanMemoryPayload } from "../hero-improvement-plan/memoryPayload";
import { parseHeroLaunchPackageMemoryPayload } from "../hero-launch-package/memoryPayload";
import { parseHeroPostLaunchObservationMemoryPayload } from "../hero-post-launch-observation/memoryPayload";
import { parseHeroReadabilityIntelligenceMemoryPayload } from "../hero-readability/memoryPayload";
import { parseHeroTestMatrixMemoryPayload } from "../hero-test-matrix/memoryPayload";
import { parseHeroTestResultsMemoryPayload } from "../hero-test-results/memoryPayload";
import type { GenerationModule, GenerationRecord } from "../memory/types";
import type { HeroWorkflowArtifacts } from "./types";
import {
  peekCompetitorSerpSession,
  peekGapMapSession,
  peekHeroArchetypeMapSession,
  peekHeroBattlePlanMapSession,
  peekHeroFatigueMapSession,
  peekHeroPlanMapSession,
  peekHeroReadabilityMapSession,
  peekHeroTestMatrixMapSession,
} from "./peekSessions";

function latestGeneration(module: GenerationModule): GenerationRecord | null {
  const projectId = getActiveProjectId();
  if (!projectId) return null;
  const snap = loadSnapshot();
  const project = snap.projects[projectId];
  if (!project) return null;
  let best: GenerationRecord | null = null;
  for (const gid of project.generationIds) {
    const g = snap.generations[gid];
    if (!g || g.module !== module) continue;
    if (!best || g.createdAt > best.createdAt) best = g;
  }
  return best;
}

function merge<T>(sessionVal: T | null | undefined, memoryVal: T | null | undefined): T | null {
  return sessionVal ?? memoryVal ?? null;
}

export function gatherHeroWorkflowArtifacts(): HeroWorkflowArtifacts {
  const serpSess = peekCompetitorSerpSession();
  const gapSess = peekGapMapSession();
  const planSess = peekHeroPlanMapSession();
  const archSess = peekHeroArchetypeMapSession();
  const readSess = peekHeroReadabilityMapSession();
  const fatSess = peekHeroFatigueMapSession();
  const battleSess = peekHeroBattlePlanMapSession();
  const matrixSess = peekHeroTestMatrixMapSession();

  const serpGen = latestGeneration("competitor_serp");
  const gapGen = latestGeneration("competitive_gap_analysis");
  const planGen = latestGeneration("hero_improvement_plan");
  const archGen = latestGeneration("hero_archetype_intelligence");
  const readGen = latestGeneration("hero_readability_intelligence");
  const fatGen = latestGeneration("hero_fatigue_intelligence");
  const battleGen = latestGeneration("hero_battle_plan");
  const matrixGen = latestGeneration("hero_test_matrix");
  const resultsGen = latestGeneration("hero_test_results");
  const launchGen = latestGeneration("hero_launch_package");
  const obsGen = latestGeneration("hero_post_launch_observation");

  const serpMem = serpGen ? parseCompetitorSerpMemoryPayload(serpGen.content) : null;
  const gapMem = gapGen ? parseCompetitiveGapAnalysisMemoryPayload(gapGen.content) : null;
  const planMem = planGen ? parseHeroImprovementPlanMemoryPayload(planGen.content) : null;
  const archMem = archGen ? parseHeroArchetypeIntelligenceMemoryPayload(archGen.content) : null;
  const readMem = readGen ? parseHeroReadabilityIntelligenceMemoryPayload(readGen.content) : null;
  const fatMem = fatGen ? parseHeroFatigueIntelligenceMemoryPayload(fatGen.content) : null;
  const battleMem = battleGen ? parseHeroBattlePlanMemoryPayload(battleGen.content) : null;
  const matrixMem = matrixGen ? parseHeroTestMatrixMemoryPayload(matrixGen.content) : null;
  const resultsMem = resultsGen ? parseHeroTestResultsMemoryPayload(resultsGen.content) : null;
  const launchMem = launchGen ? parseHeroLaunchPackageMemoryPayload(launchGen.content) : null;
  const obsMem = obsGen ? parseHeroPostLaunchObservationMemoryPayload(obsGen.content) : null;

  const serp =
    merge(serpSess, serpMem) ??
    merge(gapSess?.serpEnvelope, gapMem?.serpEnvelope) ??
    merge(battleSess?.serpEnvelope, battleMem?.serpEnvelope) ??
    merge(matrixSess?.serpEnvelope, matrixMem?.serpEnvelope) ??
    merge(resultsMem?.serpEnvelope, null) ??
    merge(launchMem?.serpEnvelope, obsMem?.serpEnvelope) ??
    null;

  const matrix =
    merge(matrixSess?.matrix, matrixMem?.matrix) ??
    merge(resultsMem?.matrix, launchMem?.matrix) ??
    merge(obsMem?.matrix, null);

  const resultsBundle =
    merge(matrixSess?.resultsBundle, resultsMem?.bundle) ?? merge(launchMem?.resultsBundle, obsMem?.resultsBundle) ?? null;

  const launchPackage = merge(matrixSess?.launchPackage, launchMem?.package) ?? merge(obsMem?.launchPackage, null);

  const postLaunchObservation = merge(matrixSess?.postLaunchObservation, obsMem?.observation) ?? null;

  return {
    serp,
    ourCard: merge(gapSess?.ourCard, gapMem?.ourCard),
    gap: merge(gapSess?.gap, gapMem?.gap),
    heroPlan: merge(planSess?.plan, planMem?.plan),
    archetype: merge(archSess?.report, archMem?.report),
    readability: merge(readSess?.report, readMem?.report),
    fatigue: merge(fatSess?.report, fatMem?.report),
    battlePlan: merge(battleSess?.plan, battleMem?.plan),
    testMatrix: matrix,
    resultsBundle,
    launchPackage,
    postLaunchObservation,
  };
}

export function hasAnyHeroWorkflowSignal(artifacts: HeroWorkflowArtifacts): boolean {
  return Boolean(
    artifacts.serp ||
      artifacts.gap ||
      artifacts.battlePlan ||
      artifacts.testMatrix ||
      artifacts.resultsBundle ||
      artifacts.launchPackage ||
      artifacts.postLaunchObservation,
  );
}
