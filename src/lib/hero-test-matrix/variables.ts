import type { HeroTestVariable } from "./types";

export const HERO_TEST_VARIABLES: readonly HeroTestVariable[] = [
  "framing",
  "lighting",
  "print_scale",
  "print_positioning",
  "typography_emphasis",
  "model_position",
  "contrast_intensity",
  "background_complexity",
  "premium_proof_visibility",
  "emotional_tone",
  "color_emphasis",
] as const;

const LABEL_KEYS: Record<HeroTestVariable, string> = {
  framing: "htm.var.framing",
  lighting: "htm.var.lighting",
  print_scale: "htm.var.print_scale",
  print_positioning: "htm.var.print_positioning",
  typography_emphasis: "htm.var.typography_emphasis",
  model_position: "htm.var.model_position",
  contrast_intensity: "htm.var.contrast_intensity",
  background_complexity: "htm.var.background_complexity",
  premium_proof_visibility: "htm.var.premium_proof_visibility",
  emotional_tone: "htm.var.emotional_tone",
  color_emphasis: "htm.var.color_emphasis",
};

export function labelTestVariable(v: HeroTestVariable, t: (key: string) => string): string {
  return t(LABEL_KEYS[v]);
}

export function formatChangedVariables(vars: HeroTestVariable[], t: (key: string) => string): string {
  return vars.map((x) => labelTestVariable(x, t)).join(" · ");
}

export function allVariablesExcept(changed: HeroTestVariable[], t: (key: string) => string): string[] {
  const set = new Set(changed);
  return HERO_TEST_VARIABLES.filter((v) => !set.has(v)).map((v) => labelTestVariable(v, t));
}
