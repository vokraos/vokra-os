function readJson<T>(key: string, validate: (o: unknown) => o is T): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    return validate(o) ? o : null;
  } catch {
    return null;
  }
}

export function peekCompetitorSerpSession(): import("../competitor-serp/types").CompetitorSerpEnvelope | null {
  return readJson("vokra.competitorSerp.envelope", (o): o is import("../competitor-serp/types").CompetitorSerpEnvelope => {
    if (typeof o !== "object" || o === null) return false;
    const r = o as Record<string, unknown>;
    return r.schema === "vokra.competitorSerp.v1" && typeof r.snapshot === "object" && r.snapshot !== null;
  });
}

export function peekGapMapSession(): import("../competitive-gap/mapSession").GapMapSessionState | null {
  return readJson("vokra.competitiveGap.mapState", (o): o is import("../competitive-gap/mapSession").GapMapSessionState => {
    if (typeof o !== "object" || o === null) return false;
    const r = o as Record<string, unknown>;
    return typeof r.gap === "object" && r.gap !== null && typeof r.ourCard === "object" && r.ourCard !== null;
  });
}

export function peekHeroPlanMapSession(): import("../hero-improvement-plan/mapSession").HeroPlanMapSessionState | null {
  return readJson("vokra.heroImprovementPlan.mapState", (o): o is import("../hero-improvement-plan/mapSession").HeroPlanMapSessionState => {
    if (typeof o !== "object" || o === null) return false;
    return typeof (o as { plan?: unknown }).plan === "object" && (o as { plan: unknown }).plan !== null;
  });
}

export function peekHeroArchetypeMapSession(): import("../hero-archetypes/session").HeroArchetypeMapSessionState | null {
  return readJson("vokra.heroArchetypes.mapState", (o): o is import("../hero-archetypes/session").HeroArchetypeMapSessionState => {
    if (typeof o !== "object" || o === null) return false;
    return typeof (o as { report?: unknown }).report === "object" && (o as { report: unknown }).report !== null;
  });
}

export function peekHeroReadabilityMapSession(): import("../hero-readability/session").HeroReadabilityMapSessionState | null {
  return readJson("vokra.heroReadability.mapState", (o): o is import("../hero-readability/session").HeroReadabilityMapSessionState => {
    if (typeof o !== "object" || o === null) return false;
    return typeof (o as { report?: unknown }).report === "object" && (o as { report: unknown }).report !== null;
  });
}

export function peekHeroFatigueMapSession(): import("../hero-fatigue/session").HeroFatigueMapSessionState | null {
  return readJson("vokra.heroFatigue.mapState", (o): o is import("../hero-fatigue/session").HeroFatigueMapSessionState => {
    if (typeof o !== "object" || o === null) return false;
    return typeof (o as { report?: unknown }).report === "object" && (o as { report: unknown }).report !== null;
  });
}

export function peekHeroBattlePlanMapSession(): import("../hero-battle-plan/session").HeroBattlePlanMapSessionState | null {
  return readJson("vokra.heroBattlePlan.mapState", (o): o is import("../hero-battle-plan/session").HeroBattlePlanMapSessionState => {
    if (typeof o !== "object" || o === null) return false;
    return typeof (o as { plan?: unknown }).plan === "object" && (o as { plan: unknown }).plan !== null;
  });
}

export function peekHeroTestMatrixMapSession(): import("../hero-test-matrix/session").HeroTestMatrixMapSessionState | null {
  return readJson("vokra.heroTestMatrix.mapState", (o): o is import("../hero-test-matrix/session").HeroTestMatrixMapSessionState => {
    if (typeof o !== "object" || o === null) return false;
    return typeof (o as { matrix?: unknown }).matrix === "object" && (o as { matrix: unknown }).matrix !== null;
  });
}
