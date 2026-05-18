import type { MarketplacePromptType, MarketplaceTarget } from "./types";

export function typeCameraLogic(t: MarketplacePromptType, target: MarketplaceTarget): string {
  if (t === "reels_visual") return "Camera: handheld-adjacent stability, short lens compression, subject tracking on garment, cut-friendly framing.";
  if (t === "detail_shot") return "Camera: macro-capable flatness, controlled DOF, stitch-safe edges for marketplace detail module.";
  if (t === "size_grid") return "Camera: orthographic-adjacent consistency, matched lighting across grid, SKU-neutral background.";
  if (t === "premium_editorial") return "Camera: editorial medium format look, restrained lens character, fashion-campaign distance discipline.";
  if (t === "launch_teaser") return "Camera: teaser tension — partial reveal, premium shadow, single readable hook.";
  if (t === "lifestyle_visual") return "Camera: lifestyle but commerce-first — environment supports silhouette, not a travel postcard.";
  if (t === "corporate_capsule_visual") return "Camera: operational minimalism, uniform logic, industrial luxury distance.";
  if (t === "wb_hero_card" || t === "ozon_hero_card")
    return target === "wb"
      ? "Camera: WB hero card discipline — centered garment block, safe margins for crop, no edge-critical print details."
      : "Camera: Ozon hero symmetry — calmer background, slightly wider product read, packaging-aware edges.";
  return "Camera: campaign master framing — readable at distance, premium darkness, controlled contrast.";
}

export function typeLightingBias(t: MarketplacePromptType): string {
  if (t === "reels_visual") return "Lighting: motivated key with cold bias, controlled rim for silhouette, no beauty-dish retail glow.";
  if (t === "premium_editorial" || t === "launch_teaser") return "Lighting: fashion-campaign key, cinematic shadows, premium darkness, cold atmosphere.";
  if (t === "detail_shot" || t === "size_grid") return "Lighting: flat premium product light with micro-contrast for texture truth.";
  return "Lighting: controlled key, premium shadow falloff, editorial realism.";
}

export function typeMarketplaceLogic(t: MarketplacePromptType, target: MarketplaceTarget): string {
  const base =
    target === "wb"
      ? "Wildberries logic: thumbnail-first readability, single hero story, print legible at 64px preview, low prop noise."
      : target === "ozon"
        ? "Ozon logic: packaging-aware framing, calmer background, structured title-adjacent visual clarity."
        : "Marketplace-neutral: conversion hierarchy, CTR-safe silhouette, low clutter.";
  if (t === "campaign_visual") return `${base} Campaign layer: coherent capsule story without decorative drift.`;
  if (t === "reels_visual") return `${base} Reels layer: motion-safe composition, silhouette-first beats.`;
  return base;
}

export function typeCompositionBias(t: MarketplacePromptType): string {
  if (t === "detail_shot") return "Composition: macro hierarchy, print plane dominant, garment context minimal.";
  if (t === "size_grid") return "Composition: grid-stable, consistent scale cues, no perspective tricks that break comparability.";
  if (t === "reels_visual") return "Composition: vertical 9:16 safe, headroom for UI overlays, center-weighted garment read.";
  if (t === "premium_editorial") return "Composition: editorial negative space, premium darkness, restrained aggression.";
  return "Composition: rule-of-thirds adapted for SKU — garment mass as anchor, background subordinate.";
}
