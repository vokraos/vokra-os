import type { HeroPromptArchetype, PromptComposerInput } from "./types";

export function heroArchetypeBlock(a: HeroPromptArchetype): string {
  switch (a) {
    case "static_luxury_hero":
      return "Static luxury hero: dominant garment visibility, restrained pose, print focus without motion blur, premium stillness, readable composition, marketplace-safe margins.";
    case "cinematic_movement_hero":
      return "Cinematic hero: controlled motion, leading lines, garment still identifiable, print plane tracked, premium editorial tension, crop-safe framing.";
    case "brutalist_studio_hero":
      return "Brutalist studio hero: hard-edge studio geometry, print-forward plane, emotional pressure via structure not expression, monochrome discipline.";
    case "architectural_street_hero":
      return "Architectural street hero: environment as structure, garment as geometry block, premium urban minimalism, silhouette-first.";
    default:
      return "Clean premium hero: SKU-first framing, safe WB/Ozon crop margins, print legible at thumbnail scale, calm premium energy.";
  }
}

export function dtfCompatibilityBlock(input: Pick<PromptComposerInput, "printFocus" | "garmentFocus">): string {
  return [
    "DTF-aware composition: realistic print placement on garment, premium ink integration, no sticker-like float.",
    "Fashion-grade folds: believable fabric behavior, avoid overloaded graphic noise on seams.",
    "Manufacturable look: avoid impossible seams, avoid cheap heat-press aesthetic.",
    `Garment emphasis: ${input.garmentFocus}`,
    `Print emphasis: ${input.printFocus}`,
  ].join(" ");
}

export function premiumPerceptionBlock(score: number): string {
  if (score >= 78) return "Premium perception: dark cinematic restraint, quiet luxury, editorial realism, no retail-cheer staging.";
  if (score >= 62) return "Premium perception: elevate with controlled shadow depth and material truth; avoid generic polish.";
  return "Premium perception recovery: remove stock cues, tighten palette, increase material micro-contrast.";
}

export function buildAutomaticNegatives(input: PromptComposerInput): string[] {
  const base = [
    "cheap streetwear cliché",
    "generic AI fashion look",
    "cyberpunk neon overload",
    "oversaturated candy colors",
    "fake luxury gold accents",
    "anime face / anime proportions",
    "marketplace clutter collage",
    "unrealistic garment folds",
    "extra fingers, deformed hands",
    "watermarks, logos, UI text",
    "busy bokeh soup background",
  ];
  if (input.physics.visualNoise > 70) base.push("pattern chaos competing with product");
  if (input.physics.overlapSaturation > 65) base.push("corridor-duplicated visual tropes");
  if (input.fatigueScore > 65) base.push("repetitive composition beats from fatigue cycle");
  return base;
}

export function refreshRecommendationLines(input: PromptComposerInput): string[] {
  const r: string[] = [];
  if (input.fatigueScore > 62) r.push("Refresh: rotate hero archetype and background complexity on next wave.");
  if (input.physics.overlapSaturation > 58) r.push("Refresh: tighten corridor-specific cues to reduce overlap saturation.");
  if (input.physics.thumbnailReadability < 62) r.push("Refresh: simplify background plane; increase hero silhouette separation.");
  if (r.length === 0) r.push("Refresh cadence: maintain disciplined variation without breaking corridor DNA.");
  return r;
}
