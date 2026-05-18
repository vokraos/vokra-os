import type { ComposerPhysicsInput } from "./types";

/** Translate marketplace physics into prompt-safe operator language (English for model APIs). */
export function marketplacePhysicsPromptBlock(p: ComposerPhysicsInput): string {
  const parts: string[] = [];
  if (p.thumbnailReadability < 65) parts.push("Prioritize thumbnail dominance: single focal plane, high edge contrast.");
  else parts.push("Maintain thumbnail dominance: clear focal hierarchy at small crop.");

  if (p.mobileContrast < 62) parts.push("Boost local contrast for mobile legibility without neon.");
  else parts.push("Mobile-safe contrast: readable midtones, no muddy mid-gray mush.");

  if (p.heroFocus < 62) parts.push("Hero focus under pressure: isolate garment block, reduce prop count.");
  else parts.push("Strong hero focus: garment occupies predictable WB/Ozon safe frame.");

  if (p.printDominance < 55) parts.push("Print must read at marketplace scale: simplify micro-detail, increase print plane clarity.");
  else parts.push("Print readable at card scale: clean registration edges, fashion-grade integration.");

  if (p.silhouetteRecognition < 60) parts.push("Silhouette recognition priority: readable outline against background.");
  else parts.push("Silhouette clarity: geometric read of garment massing.");

  if (p.visualNoise > 68) parts.push("Reduce visual noise: low clutter, no busy patterns competing with SKU.");
  else parts.push("Low clutter composition: conversion clarity over decoration.");

  if (p.conversionClarity < 58) parts.push("Conversion clarity: explicit visual hierarchy, no ambiguous focal competition.");
  else parts.push("Conversion-oriented hierarchy: one story per frame.");

  parts.push("Marketplace visuals are not pure editorial spreads — keep sellable structure.");

  return parts.join(" ");
}
