import type { PromptFoundationSlot, PromptFoundationTemplate, VisualCorridorId } from "./types";

export const PROMPT_FOUNDATION_ORDER: readonly PromptFoundationSlot[] = [
  "corridor",
  "visual_mood",
  "composition",
  "lighting",
  "model_style",
  "garment_focus",
  "marketplace_logic",
  "cinematic_direction",
  "dtf_compatibility",
  "premium_level",
];

export function buildPromptFoundationTemplate(input: {
  corridor: VisualCorridorId;
  visualMood: string;
  composition: string;
  premiumLevel: number;
  dtfNote: string;
}): PromptFoundationTemplate {
  return {
    schema: "vokra.promptFoundation.v1",
    slotOrder: PROMPT_FOUNDATION_ORDER,
    slots: {
      corridor: input.corridor,
      visual_mood: input.visualMood,
      composition: input.composition,
      lighting: "Controlled key; cold bias; no beauty-dish retail glow unless corridor demands it.",
      model_style: "Architectural posture; restrained emotion; garment-led silhouette.",
      garment_focus: "Print plane legibility first; folds serve readability not drama.",
      marketplace_logic: "WB/Ozon crop-safe margins; thumbnail dominance hierarchy explicit.",
      cinematic_direction: "Editorial realism; tactical minimalism; premium darkness.",
      dtf_compatibility: input.dtfNote,
      premium_level: `premium_index=${input.premiumLevel}`,
    },
  };
}
