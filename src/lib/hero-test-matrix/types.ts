import type { CompetitorSerpEnvelope } from "../competitor-serp/types";

export const HERO_TEST_MATRIX_MEMORY_SCHEMA = "vokra.heroTestMatrix.v1" as const;

/** Controlled marketplace hero experiment variables — max 1–2 changed per variant. */
export type HeroTestVariable =
  | "framing"
  | "lighting"
  | "print_scale"
  | "print_positioning"
  | "typography_emphasis"
  | "model_position"
  | "contrast_intensity"
  | "background_complexity"
  | "premium_proof_visibility"
  | "emotional_tone"
  | "color_emphasis";

export type HeroTestVariant = {
  id: string;
  variantName: string;
  changedVariable: string;
  unchangedVariables: string[];
  hypothesis: string;
  visualDirection: string;
  readabilityGoal: string;
  archetypeDirection: string;
  fatigueGoal: string;
  premiumGoal: string;
  dangerZones: string[];
  /** Visual production job subtype for queue routing. */
  visualJobKind: "hero_test_variant" | "readability_test" | "premium_test" | "framing_test" | "refresh_test";
};

/** Structured hero direction experiments derived from battle plan + intelligence — no A/B claims. */
export type HeroTestMatrix = {
  id: string;
  sourceBattlePlanId: string;
  query: string;
  marketplace: string;
  createdAt: number;
  baselineHeroDirection: string;
  testVariants: HeroTestVariant[];
  testingFocus: string;
  riskNotes: string[];
  marketplaceConstraints: string[];
  rolloutRecommendation: string[];
  confidenceNote: string;
};

export type HeroTestMatrixMemoryPayload = {
  schema: typeof HERO_TEST_MATRIX_MEMORY_SCHEMA;
  savedAt: number;
  matrix: HeroTestMatrix;
  serpEnvelope?: CompetitorSerpEnvelope | null;
  battlePlanId?: string;
};
