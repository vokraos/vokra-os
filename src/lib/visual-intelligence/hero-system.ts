import type { HeroCompositionType, HeroVisualEntity } from "./types";

const ARCHETYPES: HeroCompositionType[] = [
  "static_luxury_hero",
  "cinematic_movement_hero",
  "brutalist_studio_hero",
  "architectural_street_hero",
  "clean_marketplace_hero",
];

function pick(seed: number, mod: number): number {
  return ((seed % mod) + mod) % mod;
}

export function buildHeroVisualEntity(seed: number, fatigueScore: number, overlap01: number): HeroVisualEntity {
  const compositionType = ARCHETYPES[pick(seed, ARCHETYPES.length)]!;
  const base = 72 - fatigueScore * 0.35 + (1 - overlap01) * 10;
  const framing =
    compositionType === "static_luxury_hero"
      ? "center-weighted, minimal motion blur, face optional off-frame"
      : compositionType === "cinematic_movement_hero"
        ? "leading lines, asymmetric balance, controlled motion trail"
        : compositionType === "brutalist_studio_hero"
          ? "hard edge frame, top-down authority, print plane dominant"
          : compositionType === "architectural_street_hero"
            ? "environment as structure, garment as geometry block"
            : "SKU-first framing, safe margins for WB crop, Ozon card symmetry";

  return {
    id: `hero-vis-${seed}-${compositionType.slice(0, 3)}`,
    compositionType,
    modelFraming: framing,
    garmentVisibility: Math.max(38, Math.min(96, Math.round(base + pick(seed, 11)))),
    printVisibility: Math.max(35, Math.min(94, Math.round(base - pick(seed + 3, 9) + overlap01 * 12))),
    readability: Math.max(40, Math.min(95, Math.round(base - overlap01 * 22))),
    ctrSuitability: Math.max(42, Math.min(94, Math.round(78 - fatigueScore * 0.22 + (1 - overlap01) * 14))),
    premiumPerception: Math.max(44, Math.min(96, Math.round(82 - fatigueScore * 0.28))),
    refreshAge: Math.max(0, Math.min(100, Math.round(fatigueScore * 0.85 + overlap01 * 40))),
    overlapRisk: Math.max(0, Math.min(100, Math.round(overlap01 * 100 + fatigueScore * 0.15))),
  };
}
