import type { HeroPromptArchetype } from "../prompt-composer/types";

export const HERO_PLAN_COMPOSER_SESSION_KEY = "vokra.heroImprovementPlan.composerPayload" as const;

export type HeroPlanComposerSource =
  | "hero_plan"
  | "gap"
  | "archetype"
  | "readability"
  | "fatigue"
  | "battle_plan"
  | "test_matrix";

export type HeroPlanComposerPayload = {
  query: string;
  marketplace: string;
  recommendedHeroDirection: string;
  promptDirection: string;
  negativeConstraints: string;
  corridor: string;
  suggestedHeroArch: HeroPromptArchetype;
  garmentFocusLine: string;
  printFocusLine: string;
  source?: HeroPlanComposerSource;
  /** Hero Test Matrix variant context (Phase 48). */
  variantHypothesis?: string;
  changedVariable?: string;
  readabilityGoal?: string;
  archetypeDirection?: string;
  premiumDirection?: string;
};

export function pushHeroPlanComposerPayload(p: HeroPlanComposerPayload): void {
  try {
    sessionStorage.setItem(HERO_PLAN_COMPOSER_SESSION_KEY, JSON.stringify(p));
  } catch {
    /* quota */
  }
}

export function consumeHeroPlanComposerPayload(): HeroPlanComposerPayload | null {
  try {
    const raw = sessionStorage.getItem(HERO_PLAN_COMPOSER_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HERO_PLAN_COMPOSER_SESSION_KEY);
    const o = JSON.parse(raw) as HeroPlanComposerPayload;
    if (!o || typeof o !== "object" || typeof o.query !== "string" || typeof o.suggestedHeroArch !== "string") return null;
    return o;
  } catch {
    return null;
  }
}
