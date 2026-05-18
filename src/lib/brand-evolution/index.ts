export type {
  BrandEvolutionSnapshot,
  EvolutionVector,
  AestheticTrajectory,
  CategoryExpansionSignal,
  BrandRisk,
  DNAProtectionRule,
  EvolutionDecision,
  HeritageAnchor,
  FutureDirection,
  EvolutionStance,
} from "./types";
export { EVOLUTION_STANCE_RU } from "./types";
export { buildBrandEvolution, type BuildBrandEvolutionInput } from "./derive";
export { brandEvolutionToJson, brandEvolutionToMarkdown } from "./export";
export { useBrandEvolution } from "./useBrandEvolution";
