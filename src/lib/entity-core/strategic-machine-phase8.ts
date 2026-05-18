/**
 * Phase 8 — strategic machine layer: entity networks, reco topology, pressure stream,
 * hero rotation narrative, command-chain summary. Deterministic copy only; no APIs.
 */

import type { MicroSig } from "../cognitive-depth/sku-empire";
import { mix, rRange } from "../cognitive-depth/sku-empire";
import {
  demoCorridor,
  demoLaunchWaveLabel,
  demoSemanticTerritory,
  demoSkuId,
} from "../cognitive-depth/sku-demo";

const COMMAND_CHAIN_KEY = "depth.p8.chain.summary" as const;

const ENTITY_NET_KEYS = [
  "depth.p8.net.archiveLuxuryUnstableReco",
  "depth.p8.net.heroAmplifyLattice",
  "depth.p8.net.waveProductionCongestion",
  "depth.p8.net.packagingDegradeAmp",
] as const;

const TOPO_KEYS = [
  "depth.p8.topo.visibilityFrontPremium",
  "depth.p8.topo.semanticFractureAnime",
  "depth.p8.topo.ampCorridorUnstableDensity",
  "depth.p8.topo.overlapBeltSaturation",
] as const;

const PRESSURE_KEYS = [
  "depth.p8.pressure.promoCollisionRecoPurity",
  "depth.p8.pressure.visualDupHeroGravity",
  "depth.p8.pressure.fulfillmentDragLaunch",
  "depth.p8.pressure.productionLoadOverlap",
  "depth.p8.pressure.semanticSaturationFront",
  "depth.p8.pressure.launchDensityCollision",
] as const;

const HERO_ROTATION_KEYS = [
  "depth.p8.hero.emerging",
  "depth.p8.hero.dominant",
  "depth.p8.hero.overheated",
  "depth.p8.hero.exhausted",
  "depth.p8.hero.cooling",
  "depth.p8.hero.recovering",
  "depth.p8.hero.replaced",
  "depth.p8.hero.archived",
] as const;

/** Single-line structural chain: market → margin (territorial, not analytics). */
export function marketCommandChainMicro(seed: number): MicroSig {
  return {
    key: COMMAND_CHAIN_KEY,
    vars: {
      corridor: demoCorridor(seed + 2),
      sku: demoSkuId(seed + 9),
      wave: demoLaunchWaveLabel(seed + 1),
      pct: String(rRange(seed, 9201, 22, 48)),
    },
  };
}

export function entityNetworkAwarenessMicros(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 9101) % ENTITY_NET_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: ENTITY_NET_KEYS[(start + j) % ENTITY_NET_KEYS.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 3),
      sku: demoSkuId(seed + j * 11),
      wave: demoLaunchWaveLabel(seed + j * 2),
      semantic: demoSemanticTerritory(seed + j * 5),
    },
  }));
}

export function recommendationTopologyTerritoryMicros(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 9105) % TOPO_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: TOPO_KEYS[(start + j) % TOPO_KEYS.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 7),
      semantic: demoSemanticTerritory(seed + j * 4),
      belt: String(rRange(seed, 9110 + j, 31, 64)),
    },
  }));
}

export function liveMarketPressureMicros(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 9115) % PRESSURE_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: PRESSURE_KEYS[(start + j) % PRESSURE_KEYS.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 5),
      sku: demoSkuId(seed + j * 13),
      pct: String(rRange(seed, 9120 + j, 18, 52)),
    },
  }));
}

export function heroRotationNarrativeMicro(seed: number): MicroSig {
  const i = (mix(seed, 9130) + Math.floor(seed / 120) % 4) % HERO_ROTATION_KEYS.length;
  return {
    key: HERO_ROTATION_KEYS[i]!,
    vars: {
      corridor: demoCorridor(seed + 4),
      sku: demoSkuId(seed + 21),
      wave: demoLaunchWaveLabel(seed + 3),
    },
  };
}
