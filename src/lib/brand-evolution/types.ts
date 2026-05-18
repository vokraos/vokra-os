/**
 * Brand Evolution Engine — long-term brand trajectory over marketplace noise.
 * Russian-first UI copy; allowed terms: premium, noir, streetwear, oversized, SEO, CTR, SKU, DTF, FBO.
 */

export type EvolutionStance = "protect" | "evolve" | "pause" | "kill" | "test" | "expand" | "reposition";

export const EVOLUTION_STANCE_RU: Record<EvolutionStance, string> = {
  protect: "защитить",
  evolve: "развивать",
  pause: "пауза",
  kill: "снять",
  test: "тестировать",
  expand: "расширить",
  reposition: "перепозиционировать",
};

export type EvolutionVector = {
  id: string;
  labelRu: string;
  axis: "aesthetic" | "category" | "channel" | "narrative" | "production";
  magnitude: number;
  directionRu: string;
  horizon: "short" | "mid" | "long";
};

export type AestheticTrajectory = {
  id: string;
  aestheticRu: string;
  strength: number;
  trajectoryRu: string;
  dnaAlignment: number;
};

export type CategoryExpansionSignal = {
  id: string;
  categoryRu: string;
  opportunity: number;
  evidenceRu: string;
  /** 0–100: higher = stronger tension with Brand DNA */
  dnaFriction: number;
};

export type BrandRisk = {
  id: string;
  severity: number;
  titleRu: string;
  detailRu: string;
  source: string;
  /** If true: contour must not auto-accept marketplace signal into DNA */
  rejectBlindFollowing: boolean;
};

export type DNAProtectionRule = {
  id: string;
  ruleRu: string;
  whatToRejectRu: string;
  priority: number;
};

export type EvolutionDecision = {
  id: string;
  stance: EvolutionStance;
  headlineRu: string;
  rationaleRu: string;
  horizonBand: "90" | "180" | "365" | "ongoing";
};

export type HeritageAnchor = {
  id: string;
  anchorRu: string;
  whyRu: string;
};

export type FutureDirection = {
  horizonDays: 90 | 180 | 365;
  headlineRu: string;
  bulletsRu: readonly string[];
};

export type BrandEvolutionSnapshot = {
  generatedAt: number;
  pulseGeneration: number;
  /** Section 1 — narrative spine */
  currentTrajectoryRu: string;
  aestheticTrajectories: readonly AestheticTrajectory[];
  evolutionVectors: readonly EvolutionVector[];
  /** Section 2 */
  strengthen: readonly EvolutionDecision[];
  /** Section 3 */
  protectRules: readonly DNAProtectionRule[];
  protectDecisions: readonly EvolutionDecision[];
  /** Section 4 */
  testDecisions: readonly EvolutionDecision[];
  /** Section 5 */
  stopDecisions: readonly EvolutionDecision[];
  /** Section 6 */
  categorySignals: readonly CategoryExpansionSignal[];
  /** Section 7 */
  dilutionRisks: readonly BrandRisk[];
  /** Section 8 */
  heritageAnchors: readonly HeritageAnchor[];
  /** Section 9 */
  futureDirections: readonly FutureDirection[];
  /** Short-term wins vs long-term value — executive lines */
  shortVsLongRu: readonly string[];
  /** Example / active warning when trend opposes noir premium */
  dnaVsMarketWarningRu: string | null;
};
