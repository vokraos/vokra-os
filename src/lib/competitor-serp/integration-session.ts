import type { HeroPromptArchetype } from "../prompt-composer/types";
import type { SerpInsight } from "./types";

export const SERP_PROMPT_HINT_KEY = "vokra.competitorSerp.promptComposerHint" as const;
export const SERP_VISUAL_STRATEGY_BANNER_KEY = "vokra.competitorSerp.visualStrategyBanner" as const;
export const SERP_COLLECTION_HINT_KEY = "vokra.competitorSerp.collectionBuilderHint" as const;
export const SERP_ASSORTMENT_HINT_KEY = "vokra.competitorSerp.assortmentActionsHint" as const;

export type PromptComposerSerpHint = {
  suggestedHeroArch: HeroPromptArchetype;
  query: string;
  marketplace: string;
  garmentFocusLine: string;
};

export function pushPromptComposerSerpHint(h: PromptComposerSerpHint): void {
  try {
    sessionStorage.setItem(SERP_PROMPT_HINT_KEY, JSON.stringify(h));
  } catch {
    /* quota */
  }
}

export function consumePromptComposerSerpHint(): PromptComposerSerpHint | null {
  try {
    const raw = sessionStorage.getItem(SERP_PROMPT_HINT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SERP_PROMPT_HINT_KEY);
    const o = JSON.parse(raw) as PromptComposerSerpHint;
    if (!o || typeof o !== "object") return null;
    if (typeof o.suggestedHeroArch !== "string" || typeof o.query !== "string") return null;
    return o;
  } catch {
    return null;
  }
}

export function pushVisualStrategySerpBanner(insights: readonly SerpInsight[]): void {
  try {
    sessionStorage.setItem(SERP_VISUAL_STRATEGY_BANNER_KEY, JSON.stringify({ insights: [...insights] }));
  } catch {
    /* quota */
  }
}

export function consumeVisualStrategySerpBanner(): SerpInsight[] | null {
  try {
    const raw = sessionStorage.getItem(SERP_VISUAL_STRATEGY_BANNER_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SERP_VISUAL_STRATEGY_BANNER_KEY);
    const o = JSON.parse(raw) as { insights?: SerpInsight[] };
    if (!o?.insights || !Array.isArray(o.insights)) return null;
    return o.insights;
  } catch {
    return null;
  }
}

export type CollectionBuilderSerpHint = {
  query: string;
  weakVisualSharePct: string;
  topPattern: string;
  /** Optional: hero archetype intelligence capsule line */
  archetypeOpportunity?: string;
  /** Optional: hero readability intelligence capsule line */
  readabilityOpportunity?: string;
};

export function pushCollectionBuilderSerpHint(h: CollectionBuilderSerpHint): void {
  try {
    sessionStorage.setItem(SERP_COLLECTION_HINT_KEY, JSON.stringify(h));
  } catch {
    /* quota */
  }
}

export function consumeCollectionBuilderSerpHint(): CollectionBuilderSerpHint | null {
  try {
    const raw = sessionStorage.getItem(SERP_COLLECTION_HINT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SERP_COLLECTION_HINT_KEY);
    const o = JSON.parse(raw) as CollectionBuilderSerpHint;
    if (!o?.query) return null;
    return o;
  } catch {
    return null;
  }
}

export type AssortmentSerpHint = {
  query: string;
  saturation: string;
  /** From competitive gap: surface hero refresh in Assortment Actions */
  heroRefreshFromGap?: boolean;
  heroRefreshSummary?: string;
  /** Optional: hero fatigue / lifecycle capsule */
  heroFatigueSummary?: string;
};

export function pushAssortmentSerpHint(h: AssortmentSerpHint): void {
  try {
    sessionStorage.setItem(SERP_ASSORTMENT_HINT_KEY, JSON.stringify(h));
  } catch {
    /* quota */
  }
}

export function consumeAssortmentSerpHint(): AssortmentSerpHint | null {
  try {
    const raw = sessionStorage.getItem(SERP_ASSORTMENT_HINT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SERP_ASSORTMENT_HINT_KEY);
    const o = JSON.parse(raw) as AssortmentSerpHint;
    if (!o?.query) return null;
    return o;
  } catch {
    return null;
  }
}
