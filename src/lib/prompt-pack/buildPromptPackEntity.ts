import type { CollectionEntity } from "../collection-builder/types";
import { composeMarketplacePrompts, buildComposerInputForCollection } from "../prompt-composer";
import type { MarketplacePromptType, MarketplaceTarget } from "../prompt-composer/types";
import type { PromptPackEntity, PromptPackKind, PromptPackMarketplaceCode } from "./types";

function newPackId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `pp-${crypto.randomUUID()}`;
  return `pp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function uniqStrings(xs: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of xs) {
    const t = x.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function mergeNegatives(...blocks: { negatives: readonly string[] }[]): string[] {
  return uniqStrings(blocks.flatMap((b) => [...b.negatives].map((n) => `no ${n}`)));
}

function marketplaceTargetLabel(code: PromptPackMarketplaceCode, locale: "ru" | "en"): string {
  if (code === "wb") return locale === "ru" ? "Wildberries" : "Wildberries";
  if (code === "ozon") return "Ozon";
  return locale === "ru" ? "Wildberries + Ozon" : "Wildberries + Ozon";
}

function mpTargetForCompose(code: PromptPackMarketplaceCode): MarketplaceTarget {
  if (code === "wb") return "wb";
  if (code === "ozon") return "ozon";
  return "neutral";
}

function visualDirectionBlock(entity: CollectionEntity): string {
  const v = entity.visualDirection;
  return uniqStrings([
    `Mood: ${v.mood}`,
    `Print: ${v.printDirection}`,
    `Hero card: ${v.heroCardDirection}`,
    `Thumbnail logic: ${v.marketplaceMainPhotoLogic}`,
    `Model / BG: ${v.modelBackgroundStyle}`,
    `Reels bias: ${v.reelsDirection}`,
  ]).join("\n");
}

function productionNotes(entity: CollectionEntity): string {
  const p = entity.productionFit;
  const lines = [
    `DTF suitability: ${p.dtfSuitability}`,
    `Print complexity: ${p.printComplexity}`,
    `SKU complexity: ${p.skuComplexity}`,
    `Packaging pressure: ${p.packagingPressure}`,
    `FBO prep: ${p.fboPrepPressure}`,
    `Launch speed: ${p.launchSpeed}`,
    `Production risk: ${p.productionRisk}`,
  ];
  if (p.operationalWarning) lines.push(`Operational warning: ${p.operationalWarning}`);
  return lines.join("\n");
}

function marketplaceNotes(entity: CollectionEntity): string {
  return uniqStrings([
    entity.visualDirection.marketplaceMainPhotoLogic,
    entity.seoPlan.wbVsOzon,
    `Primary SEO cluster: ${entity.seoPlan.primaryCluster}`,
    `Rich content angle: ${entity.seoPlan.richContentAngle}`,
  ])
    .filter(Boolean)
    .join("\n");
}

function riskFlagsFrom(entity: CollectionEntity): string[] {
  return uniqStrings([entity.risk, ...entity.stopConditions.map((s) => `Stop: ${s}`)]);
}

function compose(
  entity: CollectionEntity,
  pulse: number,
  tension01: number,
  pressure01: number,
  promptType: MarketplacePromptType,
  marketplaceTarget: MarketplaceTarget,
) {
  return composeMarketplacePrompts(
    buildComposerInputForCollection(entity, pulse, tension01, pressure01, { promptType, marketplaceTarget }),
  );
}

function exhibitionPack(entity: CollectionEntity, corridorLabel: string): Omit<PromptPackEntity, "id" | "createdAt"> {
  const name = entity.name;
  const mood = entity.visualDirection.mood;
  const hero = [
    `VOKRA exhibition hero — Moscow advertising industry expo, premium dark-luxury hall. Collection "${name}" (${corridorLabel}). ${mood} Neo-noir cinematic lighting, matte black architecture, single hero mannequin or model in corporate futurewear oversized tee + utility shell. Capsule rack with 4–6 folded SKUs, crisp silhouette, DTF print readable at 3m, no neon clutter, no stock-smile retail casting. Subtle VOKRA mark once on signage or garment label — tasteful B2B supplier presence.`,
  ];
  const booth = [
    `Booth installation — modular black aluminum truss, low fog, narrow beam spots on garment + print zone. Transparent DTF sample strip mounted vertically with macro-readable ink edge. Corporate visitors in soft focus background; hero is product + installation. VOKRA dark luxury palette, monochrome with cold blue edge light.`,
  ];
  const lookbook = [
    `Model lookbook — editorial runway spacing on charcoal cyclorama. Two looks: oversized monochrome tee + tailored cargo; second look utility outerwear layered. Architectural poses, controlled shadow falloff, print legibility priority, DTF realistic matte film on cotton. Include one rack pull moment with hanger texture.`,
  ];
  const merch = [
    `Corporate merch vignette — modern company apparel wall: premium polos, oversize tees, utility vests, packable shells in single-tone capsule. Subtle debossed or tonal VOKRA mark. Reads as uniform program for tech / creative firms, not souvenir shop.`,
  ];
  const dtf = [
    `DTF capability shot — macro flatbed of film on dark fabric, micro-texture visible, registration clean, no fake neon ink. Hands in thin gloves lifting corner to show stretch-safe bond; workstation hints (covered), premium supplier story for booth screen.`,
  ];
  const social = [
    `Social teaser vertical 9:16 — slow dolly across booth edge light, flash of VOKRA wordmark, rack silhouette, 1s hero garment punch-in on print. Beat-friendly; mobile-safe contrast; no busy typography overlays beyond one line "B2B apparel · DTF Moscow".`,
  ];
  return {
    collectionId: entity.id,
    collectionName: name,
    corridor: corridorLabel,
    marketplaceTarget: "B2B exhibition",
    promptPackKind: "exhibition_capsule",
    visualDirection: visualDirectionBlock(entity),
    heroPrompts: hero,
    supportPrompts: booth,
    detailPrompts: dtf,
    reelsPrompts: social,
    campaignPrompts: [...lookbook, ...merch],
    negativeConstraints: [
      "no cartoon HDR",
      "no oversaturated neon streetwear clutter",
      "no illegible micro-print mockups",
      "no fake holographic foil",
      "no crowded influencer party scene",
      "no watermark spam",
    ],
    productionNotes: productionNotes(entity),
    marketplaceNotes: `Exhibition / B2B presentation context. Corridor: ${corridorLabel}. ${marketplaceNotes(entity)}`,
    brandFit: entity.brandFit,
    riskFlags: riskFlagsFrom(entity),
  };
}

function corporateMerchPack(entity: CollectionEntity, corridorLabel: string): Omit<PromptPackEntity, "id" | "createdAt"> {
  const name = entity.name;
  const mood = entity.visualDirection.mood;
  const hero = [
    `VOKRA corporate program hero — "${name}", ${corridorLabel}. Premium charcoal studio, three models in monochrome staff uniform: fitted technical polo, oversize tee, utility vest layered over lightweight jacket. Subtle tonal branding only; luxury minimalism; DTF realistic for logos on chest 8–12cm max.`,
  ];
  const support = [
    `Oversize tee mono capsule — flat lay + on-model pair: black / graphite / fog white only. Fabric texture visible, shoulder seam clean, neckline stable; print zone flat for corporate lockup; marketplace-ready clarity.`,
    `Utility vest + lightweight jacket system — modern field uniform for creative / logistics teams. Matte shells, taped seams hint, packable hood stowed; no tactical molle overload; premium company apparel not cosplay.`,
  ];
  const detail = [
    `Rain shell / packable layer — translucent hanger shot + macro zipper + cuff DTF patch legibility. Show water-bead behavior subtly (practical, not CGI storm).`,
    `Staff uniform table still — polos folded stack, size tags discreet, embroidery vs DTF decision note in scene as small printed card prop (readable).`,
  ];
  const reels = [
    `Reels — 15s corporate capsule: fold reveal of polo stack, rack slide of shells, quick macro on DTF chest mark, end frame quiet VOKRA wordmark on dark.`,
  ];
  const campaign = [
    `Campaign still — boardroom-adjacent loft, glass and concrete, team walking in unified kit. Cinematic low contrast; brand reads as modern B2B apparel partner.`,
    `Client gifting set — premium box partially open, tissue, one tee + note card; dark luxury packaging, no toy aesthetics.`,
  ];
  return {
    collectionId: entity.id,
    collectionName: name,
    corridor: corridorLabel,
    marketplaceTarget: "B2B corporate clients",
    promptPackKind: "corporate_merch",
    visualDirection: `${visualDirectionBlock(entity)}\nMood anchor: ${mood}`,
    heroPrompts: hero,
    supportPrompts: support,
    detailPrompts: detail,
    reelsPrompts: reels,
    campaignPrompts: campaign,
    negativeConstraints: [
      "no loud meme graphics",
      "no souvenir-shop saturation",
      "no fake metallic ink",
      "no cluttered multi-logo chaos",
      "no casual snapshot smartphone vibe for hero",
    ],
    productionNotes: productionNotes(entity),
    marketplaceNotes: `Corporate merch / uniform pitch. ${marketplaceNotes(entity)}`,
    brandFit: entity.brandFit,
    riskFlags: riskFlagsFrom(entity),
  };
}

function marketplaceLaunchPack(
  entity: CollectionEntity,
  pulse: number,
  tension01: number,
  pressure01: number,
  mp: PromptPackMarketplaceCode,
  corridorLabel: string,
  locale: "ru" | "en",
): Omit<PromptPackEntity, "id" | "createdAt"> {
  const heroPrompts: string[] = [];
  const bundles: ReturnType<typeof compose>[] = [];
  if (mp === "wb" || mp === "both") {
    const b = compose(entity, pulse, tension01, pressure01, "wb_hero_card", "wb");
    bundles.push(b);
    heroPrompts.push(b.outputs.marketplaceOptimized);
  }
  if (mp === "ozon" || mp === "both") {
    const b = compose(entity, pulse, tension01, pressure01, "ozon_hero_card", "ozon");
    bundles.push(b);
    heroPrompts.push(b.outputs.marketplaceOptimized);
  }

  const t0: MarketplaceTarget = mp === "ozon" ? "ozon" : mp === "wb" ? "wb" : "wb";
  const t1: MarketplaceTarget = mp === "both" ? "ozon" : t0;
  const ls = compose(entity, pulse, tension01, pressure01, "lifestyle_visual", t0);
  bundles.push(ls);
  const supportPrompts = [ls.outputs.marketplaceOptimized];
  if (mp === "both") {
    const ls2 = compose(entity, pulse, tension01, pressure01, "lifestyle_visual", t1);
    bundles.push(ls2);
    supportPrompts.push(ls2.outputs.marketplaceOptimized);
  }

  const d1 = compose(entity, pulse, tension01, pressure01, "detail_shot", mpTargetForCompose(mp));
  const d2 = compose(entity, pulse, tension01, pressure01, "size_grid", mpTargetForCompose(mp));
  bundles.push(d1, d2);

  const r1 = compose(entity, pulse, tension01, pressure01, "reels_visual", "neutral");
  bundles.push(r1);

  const c1 = compose(entity, pulse, tension01, pressure01, "campaign_visual", mpTargetForCompose(mp));
  const c2 = compose(entity, pulse, tension01, pressure01, "premium_editorial", "neutral");
  bundles.push(c1, c2);

  const banner = `${c2.outputs.marketplaceOptimized} Rich-content banner: single headline-safe negative space top third, SKU + print legible at mobile width, premium perception, no tiny text cluster.`;

  return {
    collectionId: entity.id,
    collectionName: entity.name,
    corridor: corridorLabel,
    marketplaceTarget: marketplaceTargetLabel(mp, locale),
    promptPackKind: "marketplace_launch",
    visualDirection: visualDirectionBlock(entity),
    heroPrompts,
    supportPrompts,
    detailPrompts: [d1.outputs.marketplaceOptimized, d2.outputs.marketplaceOptimized],
    reelsPrompts: [r1.outputs.reelsDirection],
    campaignPrompts: [c1.outputs.marketplaceOptimized, banner],
    negativeConstraints: mergeNegatives(...bundles),
    productionNotes: productionNotes(entity),
    marketplaceNotes: `${marketplaceNotes(entity)}\nMobile thumbnail: silhouette + print zone high contrast; avoid micro-details in outer 10% crop.`,
    brandFit: entity.brandFit,
    riskFlags: riskFlagsFrom(entity),
  };
}

function campaignPack(
  entity: CollectionEntity,
  pulse: number,
  tension01: number,
  pressure01: number,
  corridorLabel: string,
  locale: "ru" | "en",
): Omit<PromptPackEntity, "id" | "createdAt"> {
  const e1 = compose(entity, pulse, tension01, pressure01, "premium_editorial", "neutral");
  const e2 = compose(entity, pulse, tension01, pressure01, "campaign_visual", "neutral");
  const e3 = compose(entity, pulse, tension01, pressure01, "launch_teaser", "wb");
  const e4 = compose(entity, pulse, tension01, pressure01, "detail_shot", "neutral");
  const e5 = compose(entity, pulse, tension01, pressure01, "reels_visual", "neutral");
  const bundles = [e1, e2, e3, e4, e5];
  return {
    collectionId: entity.id,
    collectionName: entity.name,
    corridor: corridorLabel,
    marketplaceTarget: locale === "ru" ? "Бренд / кампании" : "Brand / paid social",
    promptPackKind: "campaign",
    visualDirection: visualDirectionBlock(entity),
    heroPrompts: [e1.outputs.fullCinematic, e1.outputs.marketplaceOptimized],
    supportPrompts: [e2.outputs.editorial, e3.outputs.short],
    detailPrompts: [e4.outputs.marketplaceOptimized],
    reelsPrompts: [e5.outputs.reelsDirection],
    campaignPrompts: [e2.outputs.marketplaceOptimized, e3.outputs.marketplaceOptimized],
    negativeConstraints: mergeNegatives(...bundles),
    productionNotes: productionNotes(entity),
    marketplaceNotes: marketplaceNotes(entity),
    brandFit: entity.brandFit,
    riskFlags: riskFlagsFrom(entity),
  };
}

function reelsPack(
  entity: CollectionEntity,
  pulse: number,
  tension01: number,
  pressure01: number,
  corridorLabel: string,
  locale: "ru" | "en",
): Omit<PromptPackEntity, "id" | "createdAt"> {
  const r = compose(entity, pulse, tension01, pressure01, "reels_visual", "neutral");
  const d = compose(entity, pulse, tension01, pressure01, "detail_shot", "neutral");
  const h = compose(entity, pulse, tension01, pressure01, "wb_hero_card", "wb");
  const te = compose(entity, pulse, tension01, pressure01, "launch_teaser", "neutral");
  const bundles = [r, d, h, te];
  return {
    collectionId: entity.id,
    collectionName: entity.name,
    corridor: corridorLabel,
    marketplaceTarget: locale === "ru" ? "Reels / Shorts" : "Reels / Shorts",
    promptPackKind: "reels",
    visualDirection: visualDirectionBlock(entity),
    heroPrompts: [h.outputs.marketplaceOptimized],
    supportPrompts: [r.outputs.marketplaceOptimized],
    detailPrompts: [d.outputs.short],
    reelsPrompts: uniqStrings([r.outputs.reelsDirection, r.outputs.short, r.outputs.fullCinematic]),
    campaignPrompts: [te.outputs.marketplaceOptimized],
    negativeConstraints: mergeNegatives(...bundles),
    productionNotes: productionNotes(entity),
    marketplaceNotes: `${entity.visualDirection.reelsDirection}\nVertical-safe framing; beat cuts every 1.2–1.8s; print read in first 2s.`,
    brandFit: entity.brandFit,
    riskFlags: riskFlagsFrom(entity),
  };
}

export type BuildPromptPackArgs = {
  entity: CollectionEntity;
  corridorLabel: string;
  pulse: number;
  tension01: number;
  pressure01: number;
  packKind: PromptPackKind;
  marketplaceCode: PromptPackMarketplaceCode;
  locale: "ru" | "en";
};

export function buildPromptPackEntity(args: BuildPromptPackArgs): PromptPackEntity {
  const { entity, corridorLabel, pulse, tension01, pressure01, packKind, marketplaceCode, locale } = args;
  const createdAt = Date.now();
  const id = newPackId();

  let base: Omit<PromptPackEntity, "id" | "createdAt">;
  switch (packKind) {
    case "marketplace_launch":
      base = marketplaceLaunchPack(entity, pulse, tension01, pressure01, marketplaceCode, corridorLabel, locale);
      break;
    case "campaign":
      base = campaignPack(entity, pulse, tension01, pressure01, corridorLabel, locale);
      break;
    case "reels":
      base = reelsPack(entity, pulse, tension01, pressure01, corridorLabel, locale);
      break;
    case "exhibition_capsule":
      base = exhibitionPack(entity, corridorLabel);
      break;
    case "corporate_merch":
      base = corporateMerchPack(entity, corridorLabel);
      break;
    default: {
      const _x: never = packKind;
      throw new Error(`Unknown pack ${_x}`);
    }
  }

  return { id, createdAt, ...base };
}
