import type { MarketplaceVisualPhysics } from "./types";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function buildMarketplaceVisualPhysics(input: {
  visualFatigue01: number;
  tension01: number;
  pressure01: number;
  ctrFatigueRisk: number;
  overlap01: number;
  heroDensity01: number;
}): MarketplaceVisualPhysics {
  const vf = input.visualFatigue01;
  const t = input.tension01;
  const p = input.pressure01;
  const ctr = input.ctrFatigueRisk;
  const ov = input.overlap01;
  const hd = input.heroDensity01;

  const thumbnailReadability = clamp(92 - vf * 38 - ov * 22 + (1 - t) * 6);
  const mobileContrast = clamp(88 - vf * 25 + p * 12);
  const heroFocus = clamp(90 - hd * 35 - ov * 18);
  const printDominance = clamp(78 + p * 8 - vf * 20);
  const silhouetteRecognition = clamp(85 - ov * 30 - vf * 15);
  const visualNoise = clamp(22 + vf * 55 + t * 20 + ov * 25);
  const conversionClarity = clamp(86 - ctr * 0.35 - visualNoise * 0.25);
  const visualFatigue = clamp(vf * 100);
  const overlapSaturation = clamp(ov * 100);

  const diagnosticsRu: string[] = [];
  if (thumbnailReadability < 62) diagnosticsRu.push("Hero visual losing thumbnail dominance.");
  if (printDominance < 52) diagnosticsRu.push("Print composition unreadable at marketplace scale.");
  if (overlapSaturation > 58) diagnosticsRu.push("Visual overlap weakening corridor differentiation.");
  if (visualNoise > 68) diagnosticsRu.push("Marketplace composition density unsafe.");
  if (conversionClarity < 58) diagnosticsRu.push("Conversion clarity under CTR fatigue pressure.");
  if (diagnosticsRu.length === 0) diagnosticsRu.push("Marketplace visual pressure within guarded band.");

  return {
    thumbnailReadability,
    mobileContrast,
    heroFocus,
    printDominance,
    silhouetteRecognition,
    visualNoise,
    conversionClarity,
    visualFatigue,
    overlapSaturation,
    diagnosticsRu,
  };
}
