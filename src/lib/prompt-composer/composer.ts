import type {
  ComposedPromptBundle,
  PromptComposerInput,
  PromptLayerId,
  PromptOutputPack,
} from "./types";
import { corridorLayerSentence } from "./visualGrammar";
import { marketplacePhysicsPromptBlock } from "./marketplaceRules";
import {
  buildAutomaticNegatives,
  dtfCompatibilityBlock,
  heroArchetypeBlock,
  premiumPerceptionBlock,
  refreshRecommendationLines,
} from "./modifiers";
import { typeCameraLogic, typeCompositionBias, typeLightingBias, typeMarketplaceLogic } from "./templates";

function joinLayers(layers: Record<PromptLayerId, string>): string {
  const order: PromptLayerId[] = [
    "corridor",
    "visual_mood",
    "composition",
    "lighting",
    "model_direction",
    "garment_focus",
    "marketplace_logic",
    "camera_logic",
    "premium_perception",
    "dtf_compatibility",
    "brand_dna",
  ];
  return order.map((k) => layers[k]).filter(Boolean).join(" ");
}

function buildOutputs(full: string): PromptOutputPack {
  const short = `${full.split(".").slice(0, 3).join(". ").trim()}.`;
  const cinematic = `${full} Cinematic finish: cold grade, restrained grain, premium editorial realism, tactical minimalism.`;
  const marketplaceOptimized = `${full} Marketplace optimization: thumbnail clarity, mobile contrast discipline, conversion-oriented hierarchy, low clutter.`;
  const editorial = `${full} Editorial mode: fashion-campaign distance, architectural silhouette, premium darkness — still manufacturable.`;
  const reelsDirection = `${full} Reels direction: vertical-safe framing, silhouette-first cuts, beat-friendly motion without losing print read.`;
  return { short, fullCinematic: cinematic, marketplaceOptimized, editorial, reelsDirection };
}

export function composeMarketplacePrompts(input: PromptComposerInput): ComposedPromptBundle {
  const corridor = corridorLayerSentence(input.corridorId);
  const mood = `${input.visualMood.trim()}.`;
  const composition = `${typeCompositionBias(input.promptType)} ${heroArchetypeBlock(input.heroArchetype)}`;
  const lighting = typeLightingBias(input.promptType);
  const modelDir =
    "Model direction: architectural posture, restrained emotion, garment-led silhouette, no stock-smile retail casting.";
  const garment = `Garment focus: ${input.garmentFocus}`;
  const mpLogic = typeMarketplaceLogic(input.promptType, input.marketplaceTarget);
  const camera = typeCameraLogic(input.promptType, input.marketplaceTarget);
  const premium = premiumPerceptionBlock(input.premiumPerception);
  const dtf = dtfCompatibilityBlock(input);
  const brand = input.brandDnaLine.trim();
  const physics = marketplacePhysicsPromptBlock(input.physics);

  const negatives = buildAutomaticNegatives(input);
  const negStr = negatives.map((n) => `no ${n}`).join(", ");

  const layers: Record<PromptLayerId, string> = {
    corridor,
    visual_mood: mood,
    composition,
    lighting,
    model_direction: modelDir,
    garment_focus: garment,
    marketplace_logic: `${mpLogic} ${physics}`,
    camera_logic: camera,
    premium_perception: premium,
    dtf_compatibility: dtf,
    brand_dna: brand,
    negative_constraints: negStr,
  };

  const core = joinLayers(layers);
  const full = `${core} Negative constraints: ${negStr}.`;

  const outputs = buildOutputs(full);

  return {
    schema: "vokra.promptComposer.v1",
    generatedAt: Date.now(),
    input,
    layers,
    negatives,
    outputs,
    refreshNotes: refreshRecommendationLines(input),
  };
}
