import { demoCorridor, demoLaunchWaveLabel, demoSkuId } from "../cognitive-depth/sku-demo";
import { empireScaleNumbers, mix, rRange } from "../cognitive-depth/sku-empire";
import type { DecisionWeightId, ExecutiveIntelSig } from "./types";
import { clamp } from "../math";

const WEIGHT_CYCLE: DecisionWeightId[] = ["tactical", "operational", "structural", "strategic", "irreversible"];

export function decisionWeightForRow(seed: number, rowSalt: number): DecisionWeightId {
  return WEIGHT_CYCLE[(mix(seed, rowSalt) + rowSalt) % WEIGHT_CYCLE.length]!;
}

const LEVERAGE_KEYS = [
  "depth.eai9.leverage.heroVisualUnlocks",
  "depth.eai9.leverage.archiveExpansion",
  "depth.eai9.leverage.packagingDragWaves",
  "depth.eai9.leverage.ampLaneMargin",
  "depth.eai9.leverage.clusterRefreshCorridor",
] as const;

export function topLeverageSignal(seed: number, tension01: number): ExecutiveIntelSig {
  const i = (mix(seed, 13001) + Math.floor(tension01 * 7)) % LEVERAGE_KEYS.length;
  const corridor = demoCorridor(seed + 2);
  const sku = demoSkuId(seed + 8);
  const waves = String(rRange(seed, 13002, 2, 5));
  const linked = String(rRange(seed, 13003, 22, 48));
  const score = rRange(seed, 13004, 61, 94);
  return {
    key: LEVERAGE_KEYS[i]!,
    vars: {
      corridor,
      sku,
      waves,
      linked,
      n: linked,
      pct: String(rRange(seed, 13005, 14, 32)),
      clusters: String(rRange(seed, 13006, 3, 9)),
    },
    score01: score / 100,
  };
}

const BLINDSPOT_KEYS = [
  "depth.eai9.blindspot.supportReco",
  "depth.eai9.blindspot.dragBehindRevenue",
  "depth.eai9.blindspot.longTailSemantic",
  "depth.eai9.blindspot.visualDupHero",
  "depth.eai9.blindspot.fboCadenceMask",
] as const;

export function topBlindspotSignal(seed: number, pressure01: number): ExecutiveIntelSig {
  const i = (mix(seed, 13101) + Math.floor(pressure01 * 6)) % BLINDSPOT_KEYS.length;
  return {
    key: BLINDSPOT_KEYS[i]!,
    vars: {
      corridor: demoCorridor(seed + 11),
      sku: demoSkuId(seed + 17),
      pct: String(rRange(seed, 13102, 18, 44)),
    },
    score01: (mix(seed, 13103) % 100) / 100,
  };
}

const OPPORTUNITY_KEYS = [
  "depth.eai9.opp.premiumBasicsUnderdefended",
  "depth.eai9.opp.archiveLuxuryRecovery",
  "depth.eai9.opp.fboTerritoryLight",
  "depth.eai9.opp.quietStreetwearGap",
  "depth.eai9.opp.corridorFatigueEntry",
] as const;

export function topOpportunitySignal(seed: number, tension01: number): ExecutiveIntelSig {
  const i = (mix(seed, 13201) + Math.floor((1 - tension01) * 5)) % OPPORTUNITY_KEYS.length;
  return {
    key: OPPORTUNITY_KEYS[i]!,
    vars: {
      corridor: demoCorridor(seed + 19),
      region: demoCorridor(seed + 23),
      wave: demoLaunchWaveLabel(seed + 3),
    },
    score01: 0.55 + (1 - tension01) * 0.25,
  };
}

const COMPRESS_KEYS = [
  "depth.eai9.compress.rotateHeroOverlap",
  "depth.eai9.compress.pauseFboPackaging",
  "depth.eai9.compress.holdLaunchUntilPack",
  "depth.eai9.compress.throttleAmpLane",
  "depth.eai9.compress.refreshHeroVisual7d",
] as const;

export function compressedConsequenceLine(seed: number, tension01: number): ExecutiveIntelSig {
  const i = (mix(seed, 13301) + Math.floor(tension01 * 4)) % COMPRESS_KEYS.length;
  return {
    key: COMPRESS_KEYS[i]!,
    vars: {
      days: String(rRange(seed, 13302, 5, 9)),
      dayspan: `${rRange(seed, 13311, 5, 7)}–${rRange(seed, 13312, 8, 11)}`,
      corridor: demoCorridor(seed + 29),
    },
  };
}

const MEMORY_KEYS = [
  "depth.eai9.mem.prevHeroOverlap",
  "depth.eai9.mem.lastAmpWavePackaging",
  "depth.eai9.mem.earlyFboCadence",
  "depth.eai9.mem.corridorRotateFracture",
] as const;

export function decisionMemoryLine(seed: number): ExecutiveIntelSig {
  const i = mix(seed, 13401) % MEMORY_KEYS.length;
  return {
    key: MEMORY_KEYS[i]!,
    vars: {
      corridor: demoCorridor(seed + 31),
      wave: String(rRange(seed, 13402, 1, 4)),
    },
  };
}

const TENSION_CALM_KEYS = [
  "depth.eai9.tension.scalingFast",
  "depth.eai9.tension.heroHot",
  "depth.eai9.tension.recoDrift",
  "depth.eai9.tension.marginPress",
  "depth.eai9.tension.fulfillUnstable",
  "depth.eai9.tension.prodOverload",
] as const;

export type StrategicTensionCalmId = "scale" | "hero" | "reco" | "margin" | "fulfill" | "prod";

export function strategicTensionCalm(seed: number, tension01: number, pressure01: number): {
  id: StrategicTensionCalmId;
  sig: ExecutiveIntelSig;
} {
  const i = (mix(seed, 13501) + Math.floor(tension01 * 4 + pressure01 * 3)) % TENSION_CALM_KEYS.length;
  const ids: StrategicTensionCalmId[] = ["scale", "hero", "reco", "margin", "fulfill", "prod"];
  const id = ids[i % ids.length]!;
  return {
    id,
    sig: {
      key: TENSION_CALM_KEYS[i]!,
      vars: {
        corridor: demoCorridor(seed + 41),
        pct: String(rRange(seed, 13502, 22, 48)),
      },
    },
  };
}

const PRIORITY_KEYS = [
  "depth.eai9.priority.spine1",
  "depth.eai9.priority.spine2",
  "depth.eai9.priority.spine3",
] as const;

export function prioritizationSpine(seed: number, tension01: number): ExecutiveIntelSig {
  const sc = empireScaleNumbers(seed);
  const i = mix(seed, 13601) % PRIORITY_KEYS.length;
  return {
    key: PRIORITY_KEYS[i]!,
    vars: {
      primary: demoCorridor(seed + 51),
      secondary: demoCorridor(seed + 52),
      ambient: String(clamp(sc.pendingRefreshes, 40, 140)),
      archived: String(sc.archiveSku),
    },
    score01: tension01,
  };
}
