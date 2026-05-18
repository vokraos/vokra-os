/**
 * Deterministic marketplace snapshot — mirrors “massive machine” scale without catalog APIs.
 */

import {
  demoCardTitle,
  demoClusterLabelRu,
  demoRegionLabel,
  demoSkuId,
} from "../cognitive-depth/sku-demo";
import { empireScaleNumbers, mix } from "../cognitive-depth/sku-empire";
import { defaultExecutionGeometryEdges } from "./relationships";
import type {
  CardEntity,
  CorridorEntity,
  CorridorId,
  EntityId,
  EntityLifecycleState,
  FulfillmentEntity,
  HeroEntity,
  LaunchWaveEntity,
  MarketplaceEntity,
  MarketplaceEntitySnapshot,
  MarketplaceTerrainKind,
  OperationalStatus,
  ProductionEntity,
  ProductFamilyEntity,
  RecommendationFieldEntity,
  RecommendationFieldKind,
  SKUEntity,
  StrategicRole,
} from "./types";

const CORRIDOR_NAME_KEYS = [
  "depth.topo.c1",
  "depth.topo.c2",
  "depth.topo.c3",
  "depth.topo.c4",
  "depth.topo.c5",
  "depth.topo.c6",
  "depth.topo.c7",
  "depth.topo.c8",
] as const;

const TERRAINS: MarketplaceTerrainKind[] = [
  "premium_altitude",
  "low_margin_swamp",
  "saturation_ridge",
  "visibility_canyon",
  "recommendation_battlefield",
  "semantic_deadzone",
  "amplification_corridor",
];

const LIFECYCLES: EntityLifecycleState[] = [
  "emerging",
  "stabilizing",
  "dominant",
  "overloaded",
  "fatigued",
  "decaying",
  "archived",
  "amplifying",
  "blocked",
  "unstable",
  "cooling",
  "recovering",
];

const OPS_STATUS: OperationalStatus[] = ["nominal", "stressed", "critical", "halted", "recovering"];

const STRATEGIC: StrategicRole[] = [
  "hero",
  "anchor",
  "amplifier",
  "support",
  "disposable",
  "archive",
  "recovery",
];

const RECO_FIELDS: RecommendationFieldKind[] = [
  "overlap",
  "collision",
  "visual_density",
  "semantic",
  "promo",
  "saturation",
];

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function corridorId(i: number): CorridorId {
  return `corridor-${i}` as CorridorId;
}

export function buildMarketplaceEntitySnapshot(
  seed: number,
  tension01: number,
  pressure01: number,
): MarketplaceEntitySnapshot {
  const t = tension01;
  const p = pressure01;

  const corridorIdsList = CORRIDOR_NAME_KEYS.map((_, i) => corridorId(i));
  const corridors = new Map<CorridorId, CorridorEntity>();
  const families = new Map<EntityId, ProductFamilyEntity>();
  const cards = new Map<EntityId, CardEntity>();
  const skus = new Map<EntityId, SKUEntity>();
  const heroes = new Map<EntityId, HeroEntity>();
  const launchWaves = new Map<EntityId, LaunchWaveEntity>();
  const recommendationFields = new Map<EntityId, RecommendationFieldEntity>();

  for (let i = 0; i < CORRIDOR_NAME_KEYS.length; i++) {
    const cid = corridorId(i);
    const wobble = (i * 7 + t * 100 * 0.3) % 23;
    const pressure = clamp01(0.38 + p * 0.4 + wobble * 0.004);
    const saturation = clamp01(0.42 + t * 0.35 - i * 0.02);
    const stability = clamp01(0.72 - pressure * 0.15 - saturation * 0.12);
    const momentum = clamp01(0.55 - i * 0.03 + p * 0.25 + (mix(seed, i) % 12) * 0.008);
    const lifecycle = LIFECYCLES[(mix(seed, 500 + i) + i) % LIFECYCLES.length]!;
    const operationalStatus = OPS_STATUS[(mix(seed, 520 + i) + i) % OPS_STATUS.length]!;
    const strategicRole: StrategicRole = i < 2 ? "hero" : i < 4 ? "anchor" : "support";

    corridors.set(cid, {
      id: cid,
      nameKey: CORRIDOR_NAME_KEYS[i]!,
      skuCount: 120 + i * 84 + (i % 3) * 40,
      heroDensity01: clamp01(0.22 + (i % 4) * 0.11 + (mix(seed, 50 + i) % 18) * 0.01),
      overlapRisk01: clamp01(saturation * 0.45 + pressure * 0.25 - 0.1 + (mix(seed, 60 + i) % 8) * 0.01),
      terrain: TERRAINS[(mix(seed, 600 + i) + i) % TERRAINS.length]!,
      parentId: "marketplace",
      childFamilyIds: [`fam-${i}`],
      pressure01: pressure,
      stability01: stability,
      saturation01: saturation,
      momentum01: momentum,
      lifecycle,
      operationalStatus,
      strategicRole,
    });

    const fid = `fam-${i}` as EntityId;
    families.set(fid, {
      id: fid,
      label: demoClusterLabelRu(seed + i * 3),
      parentCorridorId: cid,
      childCardIds: [`card-${i}`],
      pressure01: clamp01(pressure + 0.04),
      stability01: clamp01(stability - 0.02),
      saturation01: clamp01(saturation + 0.02),
      momentum01: clamp01(momentum),
      lifecycle: LIFECYCLES[(mix(seed, 610 + i) + 1) % LIFECYCLES.length]!,
      operationalStatus: OPS_STATUS[(mix(seed, 611 + i) + 1) % OPS_STATUS.length]!,
      strategicRole: "support",
    });

    const cardId = `card-${i}` as EntityId;
    cards.set(cardId, {
      id: cardId,
      title: demoCardTitle(seed + i * 5),
      parentFamilyId: fid,
      childSkuIds: [`sku-${i}-a`, `sku-${i}-b`],
      pressure01: clamp01(pressure + 0.02),
      stability01: clamp01(stability - 0.01),
      saturation01: clamp01(saturation + 0.03),
      momentum01: clamp01(momentum - 0.02),
      lifecycle: LIFECYCLES[(mix(seed, 620 + i) + 2) % LIFECYCLES.length]!,
      operationalStatus: OPS_STATUS[(mix(seed, 621 + i)) % OPS_STATUS.length]!,
      strategicRole: i % 5 === 0 ? "amplifier" : "support",
    });

    for (const suffix of ["a", "b"] as const) {
      const skuId = `sku-${i}-${suffix}` as EntityId;
      const hier = suffix === "a" ? (i === 0 ? "hero" : i === 1 ? "anchor" : "amplifier") : "support";
      skus.set(skuId, {
        id: skuId,
        wbStyleId: demoSkuId(seed + i * 17 + (suffix === "a" ? 0 : 33)),
        parentCardId: cardId,
        corridorId: cid,
        hierarchy: hier,
        pressure01: clamp01(pressure + (suffix === "a" ? 0.08 : -0.04)),
        stability01: clamp01(stability + (suffix === "a" ? -0.05 : 0.04)),
        saturation01: clamp01(saturation + (suffix === "a" ? 0.06 : 0)),
        momentum01: clamp01(momentum + (suffix === "a" ? 0.05 : -0.02)),
        lifecycle: LIFECYCLES[(mix(seed, 630 + i + suffix.charCodeAt(0)) + 3) % LIFECYCLES.length]!,
        operationalStatus: OPS_STATUS[(mix(seed, 631 + i)) % OPS_STATUS.length]!,
        strategicRole: hier === "hero" ? "hero" : hier === "anchor" ? "anchor" : "support",
      });
      if (suffix === "a" && i < 4) {
        const hid = `hero-ent-${i}` as EntityId;
        heroes.set(hid, {
          id: hid,
          skuId,
          hierarchy: i === 0 ? "hero" : i === 1 ? "anchor" : "amplifier",
          corridorId: cid,
          pressure01: clamp01(pressure + 0.1),
          stability01: clamp01(stability - 0.06),
          saturation01: clamp01(saturation + 0.08),
          momentum01: clamp01(momentum + 0.04),
          lifecycle: LIFECYCLES[(mix(seed, 640 + i) + 4) % LIFECYCLES.length]!,
          operationalStatus: OPS_STATUS[(mix(seed, 641 + i) + 1) % OPS_STATUS.length]!,
          strategicRole: "hero",
        });
      }
    }

    if (i < 6) {
      const fk = `reco-field-${i}` as EntityId;
      const kind = RECO_FIELDS[i % RECO_FIELDS.length]!;
      recommendationFields.set(fk, {
        id: fk,
        kind,
        instability01: clamp01(0.35 + t * 0.4 + (mix(seed, 700 + i) % 20) * 0.01),
        corridorId: cid,
        rivalCorridorId: corridorId((i + 3) % CORRIDOR_NAME_KEYS.length),
      });
    }
  }

  for (let w = 1; w <= 5; w++) {
    const wid = `wave-${w}` as EntityId;
    launchWaves.set(wid, {
      id: wid,
      waveIndex: w as LaunchWaveEntity["waveIndex"],
      parentId: "marketplace",
      linkedCorridorIds: [corridorId((w + seed) % 8), corridorId((w * 2 + seed) % 8)],
      pressure01: clamp01(0.4 + (mix(seed, 800 + w) % 40) * 0.01),
      stability01: clamp01(0.55 + p * 0.2 - w * 0.03),
      saturation01: clamp01(0.3 + t * 0.25),
      momentum01: clamp01(0.5 + (mix(seed, 810 + w) % 15) * 0.02),
      lifecycle: LIFECYCLES[(mix(seed, 820 + w) + w) % LIFECYCLES.length]!,
      operationalStatus: OPS_STATUS[(mix(seed, 821 + w)) % OPS_STATUS.length]!,
      strategicRole: STRATEGIC[(mix(seed, 822 + w) + w) % STRATEGIC.length]!,
    });
  }

  const fulfillment: FulfillmentEntity = {
    id: "fulfillment",
    regionLabel: demoRegionLabel(seed + 4),
    timingStrain01: clamp01(0.35 + p * 0.45),
    shippingPressure01: clamp01(0.38 + t * 0.35),
    pressure01: clamp01(0.42 + p * 0.38),
    stability01: clamp01(0.62 - p * 0.2),
    saturation01: clamp01(0.28 + t * 0.22),
    momentum01: clamp01(0.48 + (mix(seed, 900) % 12) * 0.02),
    lifecycle: LIFECYCLES[(mix(seed, 901) + 2) % LIFECYCLES.length]!,
    operationalStatus: OPS_STATUS[(mix(seed, 902) + 1) % OPS_STATUS.length]!,
    strategicRole: "recovery",
  };

  const production: ProductionEntity = {
    id: "production",
    dtfThroughput01: clamp01(0.55 + p * 0.35),
    packagingFatigue01: clamp01(0.4 + t * 0.3),
    overnightRisk01: clamp01(0.32 + (mix(seed, 910) % 25) * 0.02),
    queueInstability01: clamp01(0.38 + p * 0.28),
    pressure01: clamp01(0.48 + p * 0.4),
    stability01: clamp01(0.58 - p * 0.22),
    saturation01: clamp01(0.33 + t * 0.2),
    momentum01: clamp01(0.52 + (mix(seed, 911) % 10) * 0.02),
    lifecycle: LIFECYCLES[(mix(seed, 912) + 5) % LIFECYCLES.length]!,
    operationalStatus: OPS_STATUS[(mix(seed, 913)) % OPS_STATUS.length]!,
    strategicRole: "anchor",
  };

  const marketplace: MarketplaceEntity = {
    id: "marketplace",
    labelKey: "depth.entity7.marketplace",
    childCorridorIds: corridorIdsList,
    childLaunchWaveIds: [1, 2, 3, 4, 5].map((w) => `wave-${w}` as EntityId),
    pressure01: clamp01(0.45 + t * 0.35 + p * 0.15),
    stability01: clamp01(0.58 - t * 0.18 - p * 0.1),
    saturation01: clamp01(0.4 + t * 0.28),
    momentum01: clamp01(0.52 + p * 0.2),
    lifecycle: LIFECYCLES[(mix(seed, 1000) + 7) % LIFECYCLES.length]!,
    operationalStatus: OPS_STATUS[(mix(seed, 1001) + 2) % OPS_STATUS.length]!,
    strategicRole: "anchor",
  };

  return {
    version: 1,
    seed,
    tension01: t,
    pressure01: p,
    marketplace,
    corridors,
    families,
    cards,
    skus,
    heroes,
    launchWaves,
    fulfillment,
    production,
    recommendationFields,
    relationEdges: defaultExecutionGeometryEdges(),
  };
}

/** Executive immersion numbers — same source as empire scale, typed for UI. */
export function liveExecutiveScale(seed: number) {
  const n = empireScaleNumbers(seed);
  return {
    activeSku: n.activeSku,
    launchFronts: n.launchFronts,
    heroCandidates: n.heroCandidates,
    pendingRefreshes: n.pendingRefreshes,
    unstableCorridors: n.unstableCorridors,
    archivedSemanticUnits: n.archivedSemanticUnits,
    linkedSku: n.linkedSku,
    launchWaves: n.launchWaves,
  };
}

export function formatPct01(x: number): string {
  return String(Math.round(x * 100));
}
