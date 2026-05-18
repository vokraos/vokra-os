/**
 * Market War OS — Phase 2 presentation layer (no backend).
 * Topology gravity, cadence, executive pulse, signal tiers, memory scars.
 */

import { demoClusterLabelRu, demoCorridor, demoSkuId } from "./sku-demo";
import { mix, rRange, type MicroSig } from "./sku-empire";

export type ExecPulse =
  | "cooling"
  | "expanding"
  | "overloaded"
  | "drifting"
  | "amplifying"
  | "stabilizing"
  | "decaying"
  | "recovering"
  | "compressing"
  | "fragmenting";

const PULSE_CYCLE: ExecPulse[] = [
  "cooling",
  "expanding",
  "overloaded",
  "drifting",
  "amplifying",
  "stabilizing",
  "decaying",
  "recovering",
  "compressing",
  "fragmenting",
];

export function executivePulseFromSeed(seed: number, tension01: number): ExecPulse {
  const bias = Math.floor(tension01 * 3) % 3;
  const i = (mix(seed, 900) + bias * 2) % PULSE_CYCLE.length;
  return PULSE_CYCLE[i]!;
}

export type SignalTier = "passive" | "active" | "elevated" | "critical" | "dominant" | "archived";

/** Phase 6 — executive signal ladder (chrome + copy). Maps from legacy tiers. */
export type ExecutiveSignalPriority = "ambient" | "monitored" | "elevated" | "dominant" | "critical";

export function executiveSignalPriorityFromTier(tier: SignalTier): ExecutiveSignalPriority {
  switch (tier) {
    case "archived":
    case "passive":
      return "ambient";
    case "active":
      return "monitored";
    case "elevated":
      return "elevated";
    case "critical":
      return "critical";
    case "dominant":
      return "dominant";
  }
}

export function signalTierForIndex(tension01: number, seed: number, index: number): SignalTier {
  const base = tension01 * 4 + (mix(seed, 120 + index) % 100) * 0.008;
  const t = Math.min(0.99, base + index * 0.04);
  if (index > 0 && t < 0.14 && mix(seed, 300 + index) % 7 === 0) return "archived";
  if (t > 0.82) return "dominant";
  if (t > 0.65) return "critical";
  if (t > 0.48) return "elevated";
  if (t > 0.28) return "active";
  return "passive";
}

/** Shell-level dominant tier — never archived (executive anchor). */
export function dominantSignalTier(tension01: number, seed: number): SignalTier {
  const base = tension01 * 4.15 + (mix(seed, 778) % 100) * 0.007;
  const t = Math.min(0.99, base);
  if (t > 0.8) return "dominant";
  if (t > 0.62) return "critical";
  if (t > 0.44) return "elevated";
  if (t > 0.22) return "active";
  return "passive";
}

export type TopologyCorridor = {
  id: string;
  nameKey: string;
  pressure: number;
  saturation: number;
  expansion: number;
  momentum: number;
  fatigue: number;
  marginStability: number;
  heroDensity: number;
  overlapRisk: number;
  productionCompat: number;
  skuCount: number;
  pulse: ExecPulse;
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clampRange(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

const CORRIDOR_KEYS = [
  "depth.topo.c1",
  "depth.topo.c2",
  "depth.topo.c3",
  "depth.topo.c4",
  "depth.topo.c5",
  "depth.topo.c6",
  "depth.topo.c7",
  "depth.topo.c8",
] as const;

export function buildTopologyCorridors(seed: number, tension01: number, pressure01: number): TopologyCorridor[] {
  const t0 = tension01 * 100;
  const p0 = pressure01 * 100;
  return CORRIDOR_KEYS.map((nameKey, i) => {
    const wobble = (i * 7 + t0 * 0.3) % 23;
    const pressure = clamp(38 + p0 * 0.4 + wobble);
    const saturation = clamp(42 + t0 * 0.35 - i * 2);
    const expansion = clamp(70 - i * 5 - (100 - t0) * 0.1);
    const momentum = clamp(55 - i * 3 + p0 * 0.25 + (mix(seed, i) % 12));
    const fatigue = clamp(28 + i * 4 + t0 * 0.15);
    const marginStability = clamp(72 - pressure * 0.15 - saturation * 0.12);
    const heroDensity = clamp(22 + (i % 4) * 11 + (mix(seed, 50 + i) % 18));
    const overlapRisk = clamp(saturation * 0.45 + pressure * 0.25 - 10 + (mix(seed, 60 + i) % 8));
    const productionCompat = clamp(88 - fatigue * 0.35 - overlapRisk * 0.2);
    const pulse = PULSE_CYCLE[(mix(seed, 800 + i) + i) % PULSE_CYCLE.length]!;
    return {
      id: `cor-${i}`,
      nameKey,
      pressure,
      saturation,
      expansion,
      momentum,
      fatigue,
      marginStability,
      heroDensity,
      overlapRisk,
      productionCompat,
      skuCount: 120 + i * 84 + (i % 3) * 40,
      pulse,
    };
  });
}

export type TopologyRelation = { key: string; from: number; to: number };

export function topologyRelations(seed: number, count = 4): TopologyRelation[] {
  const pairs: [number, number][] = [
    [1, 6],
    [3, 6],
    [4, 1],
    [0, 6],
    [2, 7],
    [5, 1],
    [3, 0],
  ];
  const REL_KEYS = [
    "depth.topo.relate.r1",
    "depth.topo.relate.r2",
    "depth.topo.relate.r3",
    "depth.topo.relate.r4",
    "depth.topo.relate.r5",
    "depth.topo.relate.r6",
  ] as const;
  const start = mix(seed, 910) % pairs.length;
  return Array.from({ length: count }, (_, j) => {
    const [from, to] = pairs[(start + j) % pairs.length]!;
    const key = REL_KEYS[mix(seed, 920 + j) % REL_KEYS.length]!;
    return { key, from, to };
  });
}

const GRAVITY_KEYS = [
  "depth.gravity.heroPull",
  "depth.gravity.amplifierDestab",
  "depth.gravity.anchorCool",
  "depth.gravity.longTailDecay",
] as const;

export function skuGravityLines(seed: number, take = 3): MicroSig[] {
  const start = mix(seed, 930) % GRAVITY_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: GRAVITY_KEYS[(start + j) % GRAVITY_KEYS.length]!,
    vars: {
      hero: demoCorridor(seed + j),
      corridor: demoCorridor(seed + j * 3),
      cluster: demoClusterLabelRu(seed + j * 5),
      sku: demoSkuId(seed + j * 23),
      spread: String(rRange(seed, 940 + j, 12, 38)),
    },
  }));
}

export type CadenceLane = "launch" | "refresh" | "amplification" | "recovery" | "archive" | "premium";

const CADENCE_LANES: CadenceLane[] = ["launch", "refresh", "amplification", "recovery", "archive", "premium"];

const CADENCE_PHASE: ExecPulse[] = ["overloaded", "amplifying", "cooling", "stabilizing", "drifting", "expanding"];

export function launchCadenceState(seed: number): { lane: CadenceLane; phase: ExecPulse }[] {
  return CADENCE_LANES.map((lane, i) => ({
    lane,
    phase: CADENCE_PHASE[(mix(seed, 950 + i) + i) % CADENCE_PHASE.length]!,
  }));
}

const WAR_MP = [
  "depth.war.mp.recoFight",
  "depth.war.mp.searchVol",
  "depth.war.mp.promoCannibal",
  "depth.war.mp.ctrInstability",
  "depth.war.mp.visualDupe",
  "depth.war.mp.rankDrift",
  "depth.war.mp.regionalImb",
  "depth.war.mp.fulfillTiming",
  "depth.war.mp.heroRecoOverlap",
  "depth.war.mp.semanticCannibal",
  "depth.war.mp.searchDriftMargin",
] as const;

export function warMarketplaceSig(seed: number): MicroSig {
  const k = WAR_MP[mix(seed, 960) % WAR_MP.length]!;
  return {
    key: k,
    vars: {
      corridor: demoCorridor(seed + 11),
      hero: demoSkuId(seed),
    },
  };
}

const WAR_PROD = [
  "depth.war.prod.packThroughput",
  "depth.war.prod.dtfUnstable",
  "depth.war.prod.fulfillDecay",
  "depth.war.prod.queueInstability",
  "depth.war.prod.overnightRisk",
  "depth.war.prod.launchMismatch",
  "depth.war.prod.pressImbalance",
  "depth.war.prod.fboDrag",
] as const;

export function warProductionSigs(seed: number, take = 2): MicroSig[] {
  const a = mix(seed, 970) % WAR_PROD.length;
  return Array.from({ length: take }, (_, j) => ({
    key: WAR_PROD[(a + j) % WAR_PROD.length]!,
    vars: {
      pct: String(rRange(seed, 980 + j, 52, 94)),
      corridor: demoCorridor(seed + j * 4),
    },
  }));
}

const MEMORY_SCARS = [
  "depth.mem.scar.corridorCollapse",
  "depth.mem.scar.heroRecovered",
  "depth.mem.scar.ampFailed",
  "depth.mem.scar.satEcho",
  "depth.mem.scar.oldWaves",
  "depth.mem.scar.semanticDrift",
] as const;

export function marketMemoryScars(seed: number, take = 4): MicroSig[] {
  const start = mix(seed, 990) % MEMORY_SCARS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: MEMORY_SCARS[(start + j) % MEMORY_SCARS.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 7),
      wave: String(rRange(seed, 991 + j, 2, 9)),
      pulse: String(mix(seed, 992 + j) % 1000),
      sku: demoSkuId(seed + j * 29),
      cluster: demoClusterLabelRu(seed + j * 4),
    },
  }));
}

export function tensionNarrativeVars(seed: number, tension01: number): Record<string, string> {
  return {
    window: String(rRange(seed, 1001, 4, 11)),
    overlap: String(rRange(seed, 1002, 22, 61)),
    sat: String(rRange(seed, 1003, 38, 72)),
    compression: String(rRange(seed, 1004, 12, 34)),
    marginDrift: String(rRange(seed, 1005, 3, 14)),
    heroFatigue: String(rRange(seed, 1006, 18, 44)),
    tension: String(Math.round(tension01 * 100)),
  };
}

/* ─── Phase 3: seasons, SKU lifecycle, causal flow, execution lanes, memory markers ─── */

const MARKET_SEASON_KEYS = [
  "depth.season.preWave",
  "depth.season.acceleration",
  "depth.season.compression",
  "depth.season.promoCollision",
  "depth.season.cooling",
  "depth.season.recoveryCorridor",
  "depth.season.expansion",
] as const;

const MARKET_SEASON_DATA_IDS = [
  "pre-wave",
  "acceleration",
  "compression",
  "promo-collision",
  "cooling",
  "recovery-corridor",
  "expansion",
] as const;

export function marketSeasonMessageKey(seed: number): (typeof MARKET_SEASON_KEYS)[number] {
  return MARKET_SEASON_KEYS[mix(seed, 1020) % MARKET_SEASON_KEYS.length]!;
}

/** Kebab-case id for `data-market-season` on shell. */
export function marketSeasonId(seed: number): string {
  const i = mix(seed, 1020) % MARKET_SEASON_DATA_IDS.length;
  return MARKET_SEASON_DATA_IDS[i]!;
}

const SEASON_NARR_KEYS = [
  "depth.season.narr.compressionCorridor",
  "depth.season.narr.expansionUnsafe",
  "depth.season.narr.promoCollision",
  "depth.season.narr.recoveryLane",
] as const;

export function seasonNarrativeSig(seed: number): MicroSig {
  return {
    key: SEASON_NARR_KEYS[mix(seed, 1022) % SEASON_NARR_KEYS.length]!,
    vars: { corridor: demoCorridor(seed + 4) },
  };
}

export type SkuLifecycle =
  | "emerging"
  | "accelerating"
  | "dominant"
  | "saturated"
  | "unstable"
  | "decaying"
  | "archived"
  | "recovering"
  | "reborn";

const LIFECYCLE_LINE: Record<SkuLifecycle, string> = {
  emerging: "depth.lifecycle.one.emerging",
  accelerating: "depth.lifecycle.one.accelerating",
  dominant: "depth.lifecycle.one.dominant",
  saturated: "depth.lifecycle.one.saturated",
  unstable: "depth.lifecycle.one.unstable",
  decaying: "depth.lifecycle.one.decaying",
  archived: "depth.lifecycle.one.archived",
  recovering: "depth.lifecycle.one.recovering",
  reborn: "depth.lifecycle.one.reborn",
};

const LIFECYCLE_ORDER: SkuLifecycle[] = [
  "emerging",
  "accelerating",
  "dominant",
  "saturated",
  "unstable",
  "decaying",
  "archived",
  "recovering",
  "reborn",
];

export function skuLifecycleState(seed: number, triadIndex: number): SkuLifecycle {
  return LIFECYCLE_ORDER[(mix(seed, 1030 + triadIndex) + triadIndex * 2) % LIFECYCLE_ORDER.length]!;
}

export function skuLifecycleLineKey(state: SkuLifecycle): string {
  return LIFECYCLE_LINE[state];
}

export const CAUSAL_FLOW_KEYS = [
  "depth.flow.seoAmp",
  "depth.flow.traffic",
  "depth.flow.production",
  "depth.flow.packaging",
  "depth.flow.fulfillment",
  "depth.flow.ranking",
] as const;

export function causalFlowVars(seed: number, step: number): Record<string, string> {
  return {
    corridor: demoCorridor(seed + step * 5 + 1),
    pct: String(rRange(seed, 1050 + step, 14, 48)),
  };
}

export type ExecLaneId =
  | "hero"
  | "refresh"
  | "archive"
  | "amplification"
  | "production"
  | "packaging"
  | "fbo"
  | "fulfillment";

export type ExecLaneRow = {
  id: ExecLaneId;
  pressure: number;
  stability: number;
  risk: number;
  phase: ExecPulse;
  cadenceSec: number;
  drag: number;
  throughput: number;
  congestion: number;
};

const EXEC_LANE_IDS: ExecLaneId[] = [
  "hero",
  "refresh",
  "amplification",
  "production",
  "packaging",
  "fbo",
  "fulfillment",
  "archive",
];

export function executionLanesFull(seed: number): ExecLaneRow[] {
  return EXEC_LANE_IDS.map((id, i) => {
    const p = clamp(32 + (mix(seed, 1060 + i) % 48) + i * 3);
    const s = clamp(88 - p * 0.35 + (mix(seed, 1070 + i) % 12));
    const r = clamp(18 + (mix(seed, 1080 + i) % 40) + (p > 72 ? 12 : 0));
    const congestion = clampRange(r * 0.62 + p * 0.22 + (mix(seed, 1085 + i) % 14), 12, 94);
    const drag = clampRange(22 + p * 0.35 + (mix(seed, 1087 + i) % 28), 14, 88);
    const throughput = clampRange(96 - congestion * 0.38 - drag * 0.18 + (mix(seed, 1089 + i) % 10), 28, 98);
    const cadenceSec = clampRange(16 + (mix(seed, 1092 + i) % 52) + Math.round(p * 0.08), 18, 96);
    return {
      id,
      pressure: p,
      stability: s,
      risk: r,
      phase: PULSE_CYCLE[(mix(seed, 1090 + i) + i) % PULSE_CYCLE.length]!,
      cadenceSec,
      drag,
      throughput,
      congestion,
    };
  });
}

const LANE_BLOCK_KEYS = [
  "depth.lane.block.refreshProd",
  "depth.lane.block.ampPack",
  "depth.lane.block.fulfillFbo",
  "depth.lane.block.heroArchive",
] as const;

type LaneSlug = "refresh" | "production" | "amplification" | "packaging" | "fulfillment" | "fbo" | "hero" | "archive";

export function laneBlockNarrative(seed: number): MicroSig {
  const pairs: [LaneSlug, LaneSlug][] = [
    ["refresh", "production"],
    ["amplification", "packaging"],
    ["fulfillment", "fbo"],
    ["hero", "archive"],
  ];
  const [blocked, blocker] = pairs[mix(seed, 1100) % pairs.length]!;
  return {
    key: LANE_BLOCK_KEYS[mix(seed, 1101) % LANE_BLOCK_KEYS.length]!,
    vars: { blocked, blocker },
  };
}

const MEMORY_MARKERS = [
  "depth.mem.marker.collapse",
  "depth.mem.marker.wavefail",
  "depth.mem.marker.oldHero",
  "depth.mem.marker.corridorScar",
  "depth.mem.marker.satEcho",
] as const;

export function memoryCampaignMarkers(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 1110) % MEMORY_MARKERS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: MEMORY_MARKERS[(start + j) % MEMORY_MARKERS.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 11),
      wave: String(rRange(seed, 1111 + j, 3, 11)),
      sku: demoSkuId(seed + j * 17),
    },
  }));
}
