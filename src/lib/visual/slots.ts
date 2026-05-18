import type { VisualAssetKind, VisualStagedAsset } from "./types";

/** English labels for model prompts (internal). */
export const SLOT_LABEL_MODEL_EN: Record<VisualAssetKind, string> = {
  print: "Print / graphic flat",
  mockup: "Garment mockup",
  product: "On-body or studio product photo",
  marketplace_screenshot: "Wildberries / Ozon mobile screenshot",
  fashion_reference: "Fashion editorial reference",
  campaign_reference: "Campaign / ads reference",
};

/** API submission order: marketplace and product visuals first when present. */
export const VISUAL_API_PRIORITY: VisualAssetKind[] = [
  "marketplace_screenshot",
  "product",
  "mockup",
  "print",
  "fashion_reference",
  "campaign_reference",
];

export const MAX_VISION_IMAGES = 4;

export function selectAssetsForApi(
  assets: Record<VisualAssetKind, VisualStagedAsset | null>,
): { kind: VisualAssetKind; asset: VisualStagedAsset }[] {
  const out: { kind: VisualAssetKind; asset: VisualStagedAsset }[] = [];
  for (const kind of VISUAL_API_PRIORITY) {
    const a = assets[kind];
    if (a) out.push({ kind, asset: a });
    if (out.length >= MAX_VISION_IMAGES) break;
  }
  return out;
}

/** Prefer product + mockup; else first two in priority order (max 2). */
export function selectAssetsForCompare(
  assets: Record<VisualAssetKind, VisualStagedAsset | null>,
): { kind: VisualAssetKind; asset: VisualStagedAsset }[] {
  const p = assets.product;
  const m = assets.mockup;
  if (p && m) return [
    { kind: "product", asset: p },
    { kind: "mockup", asset: m },
  ];
  return selectAssetsForApi(assets).slice(0, 2);
}
