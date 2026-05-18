import { saveCompetitorSerpToSession } from "../competitor-serp/memoryPayload";
import { COMPETITOR_SERP_MEMORY_SCHEMA, type CompetitorSerpMemoryPayload } from "../competitor-serp/types";
import { saveGapMapSession } from "../competitive-gap/mapSession";
import { saveHeroArchetypeMapSession } from "../hero-archetypes/session";
import { saveHeroBattlePlanMapSession } from "../hero-battle-plan/session";
import { saveHeroFatigueMapSession } from "../hero-fatigue/session";
import { saveHeroPlanMapSession } from "../hero-improvement-plan/mapSession";
import { saveHeroReadabilityMapSession } from "../hero-readability/session";
import { saveHeroTestMatrixMapSession } from "../hero-test-matrix/session";
import type { HeroWorkflowArtifacts } from "./types";

function serpPayload(env: NonNullable<HeroWorkflowArtifacts["serp"]>): CompetitorSerpMemoryPayload {
  return { ...env, schema: COMPETITOR_SERP_MEMORY_SCHEMA, savedAt: Date.now() };
}

/** Prime competitive map sessions from gathered artifacts (read-only gather → map handoff). */
export function primeHeroWorkflowToMapSessions(a: HeroWorkflowArtifacts): void {
  if (a.serp) saveCompetitorSerpToSession(serpPayload(a.serp));
  if (a.gap && a.ourCard) {
    saveGapMapSession({ gap: a.gap, ourCard: a.ourCard, serpEnvelope: a.serp });
  }
  if (a.heroPlan) saveHeroPlanMapSession({ plan: a.heroPlan, serpEnvelope: a.serp });
  if (a.archetype) saveHeroArchetypeMapSession({ report: a.archetype, serpEnvelope: a.serp });
  if (a.readability) saveHeroReadabilityMapSession({ report: a.readability, serpEnvelope: a.serp });
  if (a.fatigue) saveHeroFatigueMapSession({ report: a.fatigue, serpEnvelope: a.serp });
  if (a.battlePlan) saveHeroBattlePlanMapSession({ plan: a.battlePlan, serpEnvelope: a.serp });
  if (a.testMatrix) {
    saveHeroTestMatrixMapSession({
      matrix: a.testMatrix,
      serpEnvelope: a.serp,
      resultsBundle: a.resultsBundle,
      launchPackage: a.launchPackage,
      postLaunchObservation: a.postLaunchObservation,
    });
  }
}
