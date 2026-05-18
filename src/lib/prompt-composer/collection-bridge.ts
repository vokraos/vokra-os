import type { CorridorId } from "../entity-core/types";
import { buildMarketplaceEntitySnapshot } from "../entity-core/snapshot";
import type { CollectionEntity } from "../collection-builder/types";
import { getBrandConstitution } from "../brand-dna";
import { visualCorridorFromMarketplaceCorridorId } from "../visual-intelligence/corridors";
import type {
  ComposerPhysicsInput,
  HeroPromptArchetype,
  MarketplacePromptType,
  MarketplaceTarget,
  PromptComposerInput,
  ComposedPromptBundle,
} from "./types";
import { composeMarketplacePrompts } from "./composer";

function heroArchetypeFromCollection(entity: CollectionEntity): HeroPromptArchetype {
  const k = entity.kind;
  if (k === "premium_capsule" || k === "gift_collection") return "static_luxury_hero";
  if (k === "trend_capture_wave" || k === "visual_refresh_collection") return "cinematic_movement_hero";
  if (k === "fbo_scale_collection" || k === "evergreen_basics_line") return "clean_marketplace_hero";
  if (k === "brand_building_capsule") return "architectural_street_hero";
  if (k === "fast_dtf_test_capsule") return "brutalist_studio_hero";
  return "clean_marketplace_hero";
}

function physicsFromEntity(
  entity: CollectionEntity,
  ce: { overlapRisk01: number; heroDensity01: number } | undefined,
): ComposerPhysicsInput {
  const o = ce?.overlapRisk01 ?? entity.corridorPressure01 * 0.5 + 0.2;
  const h = ce?.heroDensity01 ?? 0.38;
  const vf = Math.min(1, entity.corridorPressure01 * 0.55 + o * 0.25);
  return {
    thumbnailReadability: Math.round(88 - vf * 28 - o * 18),
    mobileContrast: Math.round(82 - vf * 18 + entity.corridorPressure01 * 10),
    heroFocus: Math.round(86 - h * 32 - o * 15),
    printDominance: Math.round(72 + entity.corridorPressure01 * 8 - vf * 15),
    silhouetteRecognition: Math.round(84 - o * 28 - vf * 12),
    visualNoise: Math.round(24 + vf * 50 + o * 22),
    conversionClarity: Math.round(82 - vf * 22),
    visualFatigue: Math.round(vf * 100),
    overlapSaturation: Math.round(o * 100),
  };
}

/** Shared wiring for Prompt Composer + Phase 15 Prompt Pack from a collection entity. */
export function buildComposerInputForCollection(
  entity: CollectionEntity,
  pulse: number,
  tension01: number,
  pressure01: number,
  opts: { promptType: MarketplacePromptType; marketplaceTarget: MarketplaceTarget },
): PromptComposerInput {
  const corridorG = visualCorridorFromMarketplaceCorridorId(entity.corridorId, pulse);
  const snap = buildMarketplaceEntitySnapshot(pulse, tension01, pressure01);
  const ce = snap.corridors.get(entity.corridorId as CorridorId);
  const C = getBrandConstitution();
  const brandLine = `${C.core.enemy} · ${C.core.promise}`.slice(0, 220);
  const physics = physicsFromEntity(entity, ce);
  const fatigue = Math.round(physics.visualFatigue * 0.85 + physics.overlapSaturation * 0.12);
  const premium = Math.round(72 + (entity.brandFit.length % 7) + (100 - physics.visualNoise) * 0.08);

  return {
    corridorId: corridorG.id,
    promptType: opts.promptType,
    marketplaceTarget: opts.marketplaceTarget,
    visualMood: entity.visualDirection.mood,
    garmentFocus: entity.visualDirection.heroCardDirection.slice(0, 200),
    printFocus: entity.visualDirection.printDirection.slice(0, 200),
    heroArchetype: heroArchetypeFromCollection(entity),
    brandDnaLine: brandLine,
    physics,
    fatigueScore: fatigue,
    premiumPerception: Math.min(96, premium),
    collectionName: entity.name,
  };
}

export type CollectionPromptPack = {
  hero: ComposedPromptBundle;
  support: ComposedPromptBundle;
  reels: ComposedPromptBundle;
  campaign: ComposedPromptBundle;
  launch: ComposedPromptBundle;
};

export function buildCollectionPromptPack(
  entity: CollectionEntity,
  pulse: number,
  tension01: number,
  pressure01: number,
): CollectionPromptPack {
  return {
    hero: composeMarketplacePrompts(
      buildComposerInputForCollection(entity, pulse, tension01, pressure01, {
        promptType: "wb_hero_card",
        marketplaceTarget: "wb",
      }),
    ),
    support: composeMarketplacePrompts(
      buildComposerInputForCollection(entity, pulse, tension01, pressure01, {
        promptType: "detail_shot",
        marketplaceTarget: "neutral",
      }),
    ),
    reels: composeMarketplacePrompts(
      buildComposerInputForCollection(entity, pulse, tension01, pressure01, {
        promptType: "reels_visual",
        marketplaceTarget: "neutral",
      }),
    ),
    campaign: composeMarketplacePrompts(
      buildComposerInputForCollection(entity, pulse, tension01, pressure01, {
        promptType: "campaign_visual",
        marketplaceTarget: "neutral",
      }),
    ),
    launch: composeMarketplacePrompts(
      buildComposerInputForCollection(entity, pulse, tension01, pressure01, {
        promptType: "launch_teaser",
        marketplaceTarget: "wb",
      }),
    ),
  };
}
