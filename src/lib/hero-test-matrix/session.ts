import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import { saveCompetitorSerpToSession } from "../competitor-serp/memoryPayload";
import { COMPETITOR_SERP_MEMORY_SCHEMA, type CompetitorSerpMemoryPayload } from "../competitor-serp/types";
import type { HeroLaunchPackage } from "../hero-launch-package/types";
import type { HeroPostLaunchObservation } from "../hero-post-launch-observation/types";
import type { HeroTestResultsBundle } from "../hero-test-results/types";
import type { HeroTestMatrix } from "./types";

const TEST_MATRIX_MAP_SESSION_KEY = "vokra.heroTestMatrix.mapState" as const;

export type HeroTestMatrixMapSessionState = {
  matrix: HeroTestMatrix;
  serpEnvelope?: CompetitorSerpEnvelope | null;
  resultsBundle?: HeroTestResultsBundle | null;
  launchPackage?: HeroLaunchPackage | null;
  postLaunchObservation?: HeroPostLaunchObservation | null;
};

export function saveHeroTestMatrixMapSession(state: HeroTestMatrixMapSessionState): void {
  try {
    sessionStorage.setItem(TEST_MATRIX_MAP_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function consumeHeroTestMatrixMapSession(): HeroTestMatrixMapSessionState | null {
  try {
    const raw = sessionStorage.getItem(TEST_MATRIX_MAP_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(TEST_MATRIX_MAP_SESSION_KEY);
    const o = JSON.parse(raw) as HeroTestMatrixMapSessionState;
    if (!o?.matrix || typeof o.matrix !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

export function primeSessionsFromHeroTestMatrixMemoryPayload(payload: import("./types").HeroTestMatrixMemoryPayload): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  saveHeroTestMatrixMapSession({ matrix: payload.matrix, serpEnvelope: payload.serpEnvelope ?? null });
}

export function primeSessionsFromHeroLaunchPackageMemoryPayload(
  payload: import("../hero-launch-package/types").HeroLaunchPackageMemoryPayload,
): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  saveHeroTestMatrixMapSession({
    matrix: payload.matrix ?? {
      id: payload.package.sourceMatrixId,
      sourceBattlePlanId: "",
      query: payload.package.query,
      marketplace: payload.package.marketplace,
      createdAt: payload.savedAt,
      baselineHeroDirection: payload.package.heroDirection,
      testVariants: [],
      testingFocus: "",
      riskNotes: [],
      marketplaceConstraints: [],
      rolloutRecommendation: [],
      confidenceNote: "",
    },
    serpEnvelope: payload.serpEnvelope ?? null,
    resultsBundle: payload.resultsBundle ?? null,
    launchPackage: payload.package,
  });
}

export function primeSessionsFromHeroTestResultsMemoryPayload(
  payload: import("../hero-test-results/types").HeroTestResultsMemoryPayload,
): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  if (payload.matrix) {
    saveHeroTestMatrixMapSession({
      matrix: payload.matrix,
      serpEnvelope: payload.serpEnvelope ?? null,
      resultsBundle: payload.bundle,
    });
  } else {
    saveHeroTestMatrixMapSession({
      matrix: {
        id: payload.bundle.sourceMatrixId,
        sourceBattlePlanId: "",
        query: payload.bundle.query,
        marketplace: payload.bundle.marketplace,
        createdAt: payload.savedAt,
        baselineHeroDirection: "",
        testVariants: [],
        testingFocus: "",
        riskNotes: [],
        marketplaceConstraints: [],
        rolloutRecommendation: [],
        confidenceNote: "",
      },
      serpEnvelope: payload.serpEnvelope ?? null,
      resultsBundle: payload.bundle,
    });
  }
}

export function primeSessionsFromHeroPostLaunchObservationMemoryPayload(
  payload: import("../hero-post-launch-observation/types").HeroPostLaunchObservationMemoryPayload,
): void {
  if (payload.serpEnvelope) {
    const serpPayload: CompetitorSerpMemoryPayload = {
      ...payload.serpEnvelope,
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
    };
    saveCompetitorSerpToSession(serpPayload);
  }
  saveHeroTestMatrixMapSession({
    matrix:
      payload.matrix ??
      ({
        id: payload.observation.sourceLaunchPackageId,
        sourceBattlePlanId: "",
        query: payload.observation.query,
        marketplace: payload.observation.marketplace,
        createdAt: payload.savedAt,
        baselineHeroDirection: "",
        testVariants: [],
        testingFocus: "",
        riskNotes: [],
        marketplaceConstraints: [],
        rolloutRecommendation: [],
        confidenceNote: "",
      } as HeroTestMatrix),
    serpEnvelope: payload.serpEnvelope ?? null,
    resultsBundle: payload.resultsBundle ?? null,
    launchPackage: payload.launchPackage ?? null,
    postLaunchObservation: payload.observation,
  });
}
