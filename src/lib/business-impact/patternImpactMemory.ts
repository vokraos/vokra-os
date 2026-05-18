import type { ExecutivePattern, ExecutivePatternId } from "../executive-memory/types";
import type { ImpactMemoryCategory } from "./types";

const PATTERN_IMPACT_MEMORY: Partial<Record<ExecutivePatternId, ImpactMemoryCategory>> = {
  premium_launch_stability: "leverage_structures",
  reels_hero_sync_recovery: "leverage_structures",
  parallel_initiative_dilution: "drag_patterns",
  execution_wave_overload: "drag_patterns",
  aggressive_seo_hero_drift: "scaling_erosion",
  motion_recovery_ctr: "stabilization_successes",
};

export function impactMemoryCategoryForPattern(id: ExecutivePatternId): ImpactMemoryCategory | null {
  return PATTERN_IMPACT_MEMORY[id] ?? null;
}

export function groupPatternsByImpactMemory(
  patterns: readonly ExecutivePattern[],
): Record<ImpactMemoryCategory, ExecutivePattern[]> {
  const empty = (): ExecutivePattern[] => [];
  const acc: Record<ImpactMemoryCategory, ExecutivePattern[]> = {
    leverage_structures: empty(),
    drag_patterns: empty(),
    scaling_erosion: empty(),
    stabilization_successes: empty(),
  };
  for (const p of patterns) {
    const cat = impactMemoryCategoryForPattern(p.id);
    if (cat) acc[cat].push(p);
  }
  return acc;
}
