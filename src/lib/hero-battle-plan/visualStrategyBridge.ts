const HERO_BATTLE_PLAN_VS_LINES_KEY = "vokra.heroBattlePlan.visualStrategyLines" as const;

export function pushHeroBattlePlanVisualStrategyLines(query: string, lines: readonly string[]): void {
  try {
    sessionStorage.setItem(HERO_BATTLE_PLAN_VS_LINES_KEY, JSON.stringify({ query, lines: [...lines] }));
  } catch {
    /* quota */
  }
}

export function consumeHeroBattlePlanVisualStrategyLines(): { query: string; lines: string[] } | null {
  try {
    const raw = sessionStorage.getItem(HERO_BATTLE_PLAN_VS_LINES_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HERO_BATTLE_PLAN_VS_LINES_KEY);
    const o = JSON.parse(raw) as { query?: string; lines?: string[] };
    if (!o?.query || !Array.isArray(o.lines)) return null;
    return { query: o.query, lines: o.lines.filter((x) => typeof x === "string") };
  } catch {
    return null;
  }
}
