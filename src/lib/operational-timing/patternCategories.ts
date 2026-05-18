import type { ExecutivePattern, ExecutivePatternId } from "../executive-memory/types";
import type { TemporalPatternCategory } from "./types";

/** Static lens only — maps existing pattern ids to temporal failure modes. */
const PATTERN_TEMPORAL_CATEGORY: Partial<Record<ExecutivePatternId, TemporalPatternCategory>> = {
  aggressive_seo_hero_drift: "timing_mistake",
  parallel_initiative_dilution: "early_scale",
  execution_wave_overload: "promo_overextension",
  motion_recovery_ctr: "late_reaction",
  reels_hero_sync_recovery: "late_reaction",
  premium_launch_stability: "launch_decay",
};

export function temporalCategoryForPatternId(id: ExecutivePatternId): TemporalPatternCategory | null {
  return PATTERN_TEMPORAL_CATEGORY[id] ?? null;
}

export function groupPatternsByTemporalCategory(
  patterns: readonly ExecutivePattern[],
): Record<TemporalPatternCategory, ExecutivePattern[]> {
  const empty = (): ExecutivePattern[] => [];
  const acc: Record<TemporalPatternCategory, ExecutivePattern[]> = {
    timing_mistake: empty(),
    early_scale: empty(),
    late_reaction: empty(),
    promo_overextension: empty(),
    launch_decay: empty(),
  };
  for (const p of patterns) {
    const cat = temporalCategoryForPatternId(p.id);
    if (cat) acc[cat].push(p);
  }
  return acc;
}
