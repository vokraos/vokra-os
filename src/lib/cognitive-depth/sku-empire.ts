/**
 * SKU-at-scale presentation helpers — deterministic from seed, no catalog engine.
 * Used for micro-signals, hero triads, waves, marketplace pressure copy.
 */

import {
  demoCardTitle,
  demoClusterLabelRu,
  demoCorridor,
  demoLaunchWaveLabel,
  demoPrintFamily,
  demoProductionLane,
  demoRegionLabel,
  demoSemanticTerritory,
  demoSkuId,
} from "./sku-demo";

export function mix(seed: number, salt: number): number {
  let x = Math.imul(seed ^ salt, 0x9e3779b1);
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  return x >>> 0;
}

export function rRange(seed: number, salt: number, min: number, max: number): number {
  const m = mix(seed, salt) % (max - min + 1);
  return min + m;
}

export type HeroRole = "hero" | "support" | "amplifier" | "anchor" | "saturation" | "refresh";

export type EmpireHeroCard = {
  id: string;
  print: string;
  corridor: string;
  role: HeroRole;
};

export function empireHeroTriad(seed: number): readonly EmpireHeroCard[] {
  return [
    {
      id: demoSkuId(seed),
      print: demoPrintFamily(seed).toUpperCase(),
      corridor: demoCorridor(seed),
      role: "hero",
    },
    {
      id: demoSkuId(seed + 76),
      print: demoPrintFamily(seed + 2).toLowerCase(),
      corridor: demoCorridor(seed + 1),
      role: "amplifier",
    },
    {
      id: demoSkuId(seed + 430),
      print: demoPrintFamily(seed + 5).toLowerCase(),
      corridor: demoCorridor(seed + 4),
      role: "saturation",
    },
  ] as const;
}

export type LaunchWaveState = "active" | "cooling" | "blocked" | "pending" | "unstable";

export type EmpireWave = { wave: 1 | 2 | 3 | 4 | 5; state: LaunchWaveState };

export function empireLaunchWaves(seed: number): EmpireWave[] {
  const states: LaunchWaveState[] = ["active", "cooling", "blocked", "pending", "unstable"];
  return [1, 2, 3, 4, 5].map((w, i) => ({
    wave: w as EmpireWave["wave"],
    state: states[(mix(seed, 40 + i) + i) % states.length]!,
  }));
}

/** Compact scale strip for headers / tickers (numbers only; labels from i18n). */
export function empireScaleNumbers(seed: number) {
  return {
    cards: rRange(seed, 1, 36, 52),
    linkedSku: rRange(seed, 2, 860, 980),
    heroCandidates: rRange(seed, 3, 52, 82),
    archiveSku: rRange(seed, 4, 300, 360),
    visualWait: rRange(seed, 5, 28, 48),
    blockedPackaging: rRange(seed, 6, 72, 118),
    launchWaves: rRange(seed, 7, 8, 16),
    semanticFronts: rRange(seed, 8, 4, 11),
    refreshQueueDelta: rRange(seed, 9, 4, 22),
    heroCooling: rRange(seed, 10, 2, 8),
    /** Phase 3 — ambient scale (deterministic, not catalog). */
    pendingRefreshes: rRange(seed, 11, 62, 118),
    unstableCorridors: rRange(seed, 12, 2, 6),
    regionalZones: rRange(seed, 13, 5, 12),
    /** Phase 5 — implied infrastructure scale (deterministic). */
    latticeSku: rRange(seed, 14, 620, 1040),
    compressionCorridors: rRange(seed, 15, 2, 6),
    refreshCycles: rRange(seed, 16, 8, 34),
    regionalMoves: rRange(seed, 17, 3, 15),
    recoBattlefronts: rRange(seed, 18, 4, 12),
    /** Phase 6 — ambient scale immersion (deterministic). */
    activeSku: rRange(seed, 19, 720, 1040),
    launchFronts: rRange(seed, 20, 14, 20),
    unstableRecoCorridors: rRange(seed, 21, 4, 8),
    archivedSemanticUnits: rRange(seed, 22, 320, 360),
    /** Phase 8 — disciplined operational mass (deterministic). */
    refreshOperations: rRange(seed, 24, 98, 128),
  };
}

export type MicroSig = { key: string; vars: Record<string, string> };

const MICRO_KEYS = [
  "depth.empire.micro.refreshQ",
  "depth.empire.micro.heroCool",
  "depth.empire.micro.clusterWide",
  "depth.empire.micro.semOverlap",
  "depth.empire.micro.promoDense",
  "depth.empire.micro.marginStable",
  "depth.empire.micro.archiveRec",
  "depth.empire.micro.linkedBurst",
  "depth.empire.micro.waveCadence",
  "depth.empire.micro.fboQueue",
  "depth.empire.micro.heroSkuFatigue",
  "depth.empire.micro.clusterOverlapBattle",
  "depth.empire.micro.waveBlockedPack",
  "depth.empire.micro.recoCannibal",
  "depth.empire.micro.regionImbalanceReco",
  "depth.empire.micro.dtfEcologyStress",
] as const;

function microEntityVars(seed: number, i: number, nums: ReturnType<typeof empireScaleNumbers>): Record<string, string> {
  const s = seed + i * 13;
  return {
    n: String(nums.refreshQueueDelta + i * 3),
    h: String(nums.heroCooling),
    corridor: demoCorridor(s),
    rival: demoCorridor(s + 9),
    linked: String(nums.linkedSku - i * 40),
    waves: String(nums.launchWaves),
    sku: demoSkuId(s),
    sku2: demoSkuId(s + 220),
    card: demoCardTitle(s),
    cluster: demoClusterLabelRu(s + 1),
    wave: demoLaunchWaveLabel(s + 2),
    region: demoRegionLabel(s + 3),
    lane: demoProductionLane(s + 4),
    semantic: demoSemanticTerritory(s + 5),
    fronts: String(nums.launchFronts),
    unstableReco: String(nums.unstableRecoCorridors),
  };
}

export function empireMicroSignals(seed: number, take = 5): MicroSig[] {
  const start = mix(seed, 99) % MICRO_KEYS.length;
  const out: MicroSig[] = [];
  const nums = empireScaleNumbers(seed);
  for (let i = 0; i < take; i++) {
    const k = MICRO_KEYS[(start + i) % MICRO_KEYS.length]!;
    out.push({
      key: k,
      vars: microEntityVars(seed, i, nums),
    });
  }
  return out;
}

const MP_KEYS = [
  "depth.empire.mp.wbSat",
  "depth.empire.mp.visualOverlap",
  "depth.empire.mp.ozonLag",
  "depth.empire.mp.longTail",
  "depth.empire.mp.ctrErode",
  "depth.empire.mp.promoFatigue",
  "depth.empire.mp.catHeat",
  "depth.empire.mp.recoDecay",
  "depth.empire.mp.rankJitter",
  "depth.empire.mp.seoCollision",
] as const;

export function empireMarketPressureSig(seed: number): MicroSig {
  const k = MP_KEYS[mix(seed, 501) % MP_KEYS.length]!;
  const s = seed + 17;
  return {
    key: k,
    vars: {
      corridor: demoCorridor(s),
      rival: demoCorridor(s + 4),
      sku: demoSkuId(s),
      cluster: demoClusterLabelRu(s + 1),
      wave: demoLaunchWaveLabel(s + 2),
    },
  };
}

const PROD_KEYS = [
  "depth.empire.prod.packCadence",
  "depth.empire.prod.dtfOverload",
  "depth.empire.prod.fulfillWindow",
  "depth.empire.prod.pressLane",
  "depth.empire.prod.fboPrep",
  "depth.empire.prod.visualCadence",
] as const;

export function empireProductionSigs(seed: number, take = 2): MicroSig[] {
  const a = mix(seed, 601) % PROD_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: PROD_KEYS[(a + j) % PROD_KEYS.length]!,
    vars: {
      pct: String(rRange(seed, 700 + j, 58, 94)),
      corridor: demoCorridor(seed + j * 5),
      lane: demoProductionLane(seed + j * 7),
      wave: demoLaunchWaveLabel(seed + j * 11),
      sku: demoSkuId(seed + j * 33),
      region: demoRegionLabel(seed + j * 13),
    },
  }));
}

export function empireMemoryWarfare(seed: number): MicroSig[] {
  return [
    {
      key: "depth.mem.war1",
      vars: {
        corridor: demoCorridor(seed + 2),
        rival: demoCorridor(seed + 9),
        dominance: String(rRange(seed, 801, 38, 72)),
        sku: demoSkuId(seed + 12),
        wave: demoLaunchWaveLabel(seed + 3),
      },
    },
    {
      key: "depth.mem.war2",
      vars: {
        corridor: demoCorridor(seed + 4),
        fatigue: String(rRange(seed, 802, 41, 68)),
        expansion: String(rRange(seed, 803, 22, 55)),
        cluster: demoClusterLabelRu(seed + 6),
      },
    },
  ];
}

/** One-line corridor warfare for topology cards. */
export function empireCorridorWarfareKey(rowIndex: number, pressure: number, saturation: number): string {
  if (pressure > 72 && saturation > 68) return "depth.topo.war.hotConflict";
  if (pressure > 62) return "depth.topo.war.pressureDominance";
  if (saturation > 65) return "depth.topo.war.satVictim";
  if (pressure < 42 && saturation < 45) return "depth.topo.war.expansionSafe";
  if (rowIndex % 3 === 0) return "depth.topo.war.fatigueLine";
  return "depth.topo.war.clusterStalemate";
}

/** Phase 6 — entity-bound corridor warfare line (SKU / cluster / wave). */
export function empireCorridorWarfareSig(rowIndex: number, pressure: number, saturation: number, seed: number): MicroSig {
  const key = empireCorridorWarfareKey(rowIndex, pressure, saturation);
  const s = seed + rowIndex * 29;
  return {
    key,
    vars: {
      sku: demoSkuId(s),
      card: demoCardTitle(s),
      cluster: demoClusterLabelRu(s + 1),
      wave: demoLaunchWaveLabel(s + 2),
      corridor: demoCorridor(s),
      rival: demoCorridor(s + 6),
      lane: demoProductionLane(s + 3),
    },
  };
}
