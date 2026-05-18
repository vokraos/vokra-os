/**
 * Phase 4 — strategic organism: pulse, weather, gravity, time, ecology, trade-offs, simulation projections.
 * Deterministic from seeds + live scalars; no backend.
 */

import {
  demoCardTitle,
  demoClusterLabelRu,
  demoCorridor,
  demoLaunchWaveLabel,
  demoProductionLane,
  demoRegionLabel,
  demoSemanticTerritory,
  demoSkuId,
} from "./sku-demo";
import { empireScaleNumbers, mix, rRange, type MicroSig } from "./sku-empire";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export type MarketWeather = "calm" | "dense" | "unstable" | "overheated" | "fragmented" | "compressing" | "drifting" | "exhausted";

const WEATHERS: MarketWeather[] = [
  "calm",
  "dense",
  "unstable",
  "overheated",
  "fragmented",
  "compressing",
  "drifting",
  "exhausted",
];

/** Environmental weather from tension, fatigue, volatility (0–1 each). */
export function marketWeatherFromSignals(seed: number, tension01: number, fatigue01: number, vol01: number): MarketWeather {
  const s = clamp01(tension01 * 0.42 + fatigue01 * 0.28 + vol01 * 0.35);
  const j = (Math.floor(s * 10) + mix(seed, 2001) % 3) % WEATHERS.length;
  return WEATHERS[j]!;
}

export function marketWeatherId(seed: number, tension01: number, fatigue01: number, vol01: number): string {
  return marketWeatherFromSignals(seed, tension01, fatigue01, vol01);
}

/** Phase 8 — ambient market weather 3.0 (shell + topology emphasis; orthogonal to legacy `MarketWeather`). */
export type MarketWeather3 =
  | "calm"
  | "volatile"
  | "overheated"
  | "compressed"
  | "drifting"
  | "fragmented"
  | "unstable"
  | "recovering"
  | "expansion_ready";

const WEATHER3_ORDER: MarketWeather3[] = [
  "calm",
  "volatile",
  "overheated",
  "compressed",
  "drifting",
  "fragmented",
  "unstable",
  "recovering",
  "expansion_ready",
];

export function marketWeather3FromSignals(
  seed: number,
  tension01: number,
  fatigue01: number,
  vol01: number,
): MarketWeather3 {
  const s = clamp01(tension01 * 0.38 + fatigue01 * 0.22 + vol01 * 0.42);
  const jitter = ((mix(seed, 4102) % 5) * 0.028) / 5;
  const idx = Math.floor((s + jitter) * WEATHER3_ORDER.length) % WEATHER3_ORDER.length;
  return WEATHER3_ORDER[(idx + mix(seed, 4103)) % WEATHER3_ORDER.length]!;
}

export type Weather3ShellScalars = {
  topologyEmphasis01: number;
  signalSharpness01: number;
  executiveSilence01: number;
  motionCadenceMul: number;
};

export function weather3ShellScalars(weather3: MarketWeather3, tension01: number): Weather3ShellScalars {
  const t = clamp01(tension01);
  let top = 0.42;
  let sharp = 0.55;
  let silence = 0.35;
  let cad = 1;
  switch (weather3) {
    case "calm":
      top = 0.22;
      sharp = 0.44;
      silence = 0.74;
      cad = 1.08;
      break;
    case "volatile":
      top = 0.84;
      sharp = 0.9;
      silence = 0.14;
      cad = 0.82;
      break;
    case "overheated":
      top = 0.9;
      sharp = 0.88;
      silence = 0.11;
      cad = 0.78;
      break;
    case "compressed":
      top = 0.72;
      sharp = 0.78;
      silence = 0.24;
      cad = 0.88;
      break;
    case "drifting":
      top = 0.36;
      sharp = 0.48;
      silence = 0.6;
      cad = 1.02;
      break;
    case "fragmented":
      top = 0.78;
      sharp = 0.74;
      silence = 0.26;
      cad = 0.9;
      break;
    case "unstable":
      top = 0.86;
      sharp = 0.84;
      silence = 0.17;
      cad = 0.84;
      break;
    case "recovering":
      top = 0.46;
      sharp = 0.52;
      silence = 0.64;
      cad = 0.96;
      break;
    case "expansion_ready":
      top = 0.55;
      sharp = 0.62;
      silence = 0.44;
      cad = 1.05;
      break;
    default:
      break;
  }
  const topologyEmphasis01 = clamp01(top + t * 0.12);
  const signalSharpness01 = clamp01(sharp + t * 0.1);
  const executiveSilence01 = clamp01(silence * (1 - t * 0.48));
  const motionCadenceMul = cad * (1 - t * 0.08);
  return { topologyEmphasis01, signalSharpness01, executiveSilence01, motionCadenceMul };
}

const WEATHER2_KEYS = [
  "depth.weather2.recoTurbulence",
  "depth.weather2.semanticStorm",
  "depth.weather2.saturationFog",
  "depth.weather2.promoHeat",
  "depth.weather2.corridorCooling",
  "depth.weather2.visibilityPressure",
  "depth.weather2.rankingTurbulence",
] as const;

/** Phase 6 — marketplace weather narrative (layered on base weather). */
export function marketplaceWeather2Sig(seed: number, tension01: number, vol01: number): MicroSig {
  const score = clamp01(tension01 * 0.55 + vol01 * 0.4);
  const i = (Math.floor(score * WEATHER2_KEYS.length) + mix(seed, 3001)) % WEATHER2_KEYS.length;
  return {
    key: WEATHER2_KEYS[i]!,
    vars: {
      corridor: demoCorridor(seed + 14),
      rival: demoCorridor(seed + 21),
      cluster: demoClusterLabelRu(seed + 16),
      semantic: demoSemanticTerritory(seed + 18),
      sku: demoSkuId(seed + 24),
      wave: demoLaunchWaveLabel(seed + 5),
      region: demoRegionLabel(seed + 7),
    },
  };
}

const GLOBAL_PULSE_KEYS = [
  "depth.organism.pulse.unstable",
  "depth.organism.pulse.balanced",
  "depth.organism.pulse.ampRising",
  "depth.organism.pulse.visualHeat",
  "depth.organism.pulse.semanticVol",
  "depth.organism.pulse.fulfillmentStrain",
  "depth.organism.pulse.rankingJitter",
  "depth.organism.pulse.launchDense",
] as const;

export function globalMarketPulseMessageKey(seed: number, tension01: number, pressure01: number): (typeof GLOBAL_PULSE_KEYS)[number] {
  const score = tension01 * 0.5 + pressure01 * 0.45 + (mix(seed, 2002) % 17) * 0.004;
  const i = Math.floor(clamp01(score) * GLOBAL_PULSE_KEYS.length) % GLOBAL_PULSE_KEYS.length;
  return GLOBAL_PULSE_KEYS[(i + mix(seed, 2003)) % GLOBAL_PULSE_KEYS.length]!;
}

export function globalMarketPulseVars(seed: number): Record<string, string> {
  return {
    corridor: demoCorridor(seed + 3),
    sat: String(rRange(seed, 2004, 38, 71)),
    launch: String(rRange(seed, 2005, 6, 14)),
    pct: String(rRange(seed, 2006, 22, 58)),
    sku: demoSkuId(seed + 8),
    cluster: demoClusterLabelRu(seed + 9),
    wave: demoLaunchWaveLabel(seed + 1),
    region: demoRegionLabel(seed + 2),
    lane: demoProductionLane(seed + 5),
    semantic: demoSemanticTerritory(seed + 7),
    rival: demoCorridor(seed + 10),
  };
}

export type OrganismShellMultipliers = {
  glow01: number;
  contrastMul: number;
  saturationMul: number;
};

export function organismShellMultipliers(
  tension01: number,
  fatigue01: number,
  vol01: number,
  weather: MarketWeather,
): OrganismShellMultipliers {
  const heat =
    weather === "overheated" || weather === "fragmented"
      ? 0.18
      : weather === "calm" || weather === "drifting"
        ? -0.06
        : 0;
  const glow01 = clamp01(0.12 + tension01 * 0.38 + fatigue01 * 0.22 + vol01 * 0.2 + heat);
  const contrastMul = 0.97 + tension01 * 0.05 + (weather === "compressing" ? 0.03 : 0);
  const saturationMul = 0.92 + vol01 * 0.12 + (weather === "dense" ? 0.05 : 0);
  return { glow01, contrastMul, saturationMul };
}

const GRAVITY_KEYS = [
  "depth.gravity2.absorb",
  "depth.gravity2.losePull",
  "depth.gravity2.collision",
  "depth.gravity2.fragment",
  "depth.gravity2.orbit",
  "depth.gravity2.drift",
] as const;

export function corridorGravityNarratives(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 2010) % GRAVITY_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: GRAVITY_KEYS[(start + j) % GRAVITY_KEYS.length]!,
    vars: {
      prey: demoCorridor(seed + j * 2),
      predator: demoCorridor(seed + j * 2 + 5),
      corridor: demoCorridor(seed + j * 7),
      sku: demoSkuId(seed + j * 41),
      cluster: demoClusterLabelRu(seed + j * 3),
      wave: demoLaunchWaveLabel(seed + j * 5),
    },
  }));
}

const TRADE_KEYS = [
  "depth.trade.seoProdFulfill",
  "depth.trade.heroCtrReco",
  "depth.trade.fboLaunchWave",
] as const;

export function tradeOffConsequence(seed: number): MicroSig {
  return {
    key: TRADE_KEYS[mix(seed, 2020) % TRADE_KEYS.length]!,
    vars: {
      corridor: demoCorridor(seed + 8),
      days: String(rRange(seed, 2021, 9, 21)),
      pct: String(rRange(seed, 2022, 18, 44)),
    },
  };
}

const TIME_KEYS = [
  "depth.execTime.expansionWindow",
  "depth.execTime.satHorizon",
  "depth.execTime.coolingCycle",
  "depth.execTime.recoveryDelay",
  "depth.execTime.ampPhase",
  "depth.execTime.launchSeason",
  "depth.execTime.exhaustion",
] as const;

export function executiveTimeAmbient(seed: number): MicroSig {
  return {
    key: TIME_KEYS[mix(seed, 2030) % TIME_KEYS.length]!,
    vars: {
      d: String(rRange(seed, 2031, 4, 18)),
      corridor: demoCorridor(seed + 12),
      horizon: String(rRange(seed, 2032, 11, 34)),
    },
  };
}

const ECOLOGY_KEYS = [
  "depth.ecology.supportDrop",
  "depth.ecology.predatorCompress",
  "depth.ecology.adaptiveStabilize",
  "depth.ecology.fragileEdge",
  "depth.ecology.exhaustedHero",
  "depth.ecology.parasiticOverlap",
] as const;

export function skuEcologyMicroLines(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 2040) % ECOLOGY_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: ECOLOGY_KEYS[(start + j) % ECOLOGY_KEYS.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 4),
      hero: demoCorridor(seed + j + 1),
      sku: demoSkuId(seed + j * 31),
    },
  }));
}

const PRESSURE_LIVE = [
  "depth.opsLive.launchCongestion",
  "depth.opsLive.queueImbalance",
  "depth.opsLive.overnightRisk",
  "depth.opsLive.packInstability",
  "depth.opsLive.pressFatigue",
  "depth.opsLive.visualBottleneck",
  "depth.opsLive.regionalShipment",
] as const;

export function executionPressureLive(seed: number, take = 3): MicroSig[] {
  const start = mix(seed, 2050) % PRESSURE_LIVE.length;
  return Array.from({ length: take }, (_, j) => ({
    key: PRESSURE_LIVE[(start + j) % PRESSURE_LIVE.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 3),
      pct: String(rRange(seed, 2051 + j, 52, 94)),
      waves: String(rRange(seed, 2052 + j, 4, 11)),
      region: demoRegionLabel(seed + j * 5),
      wave: demoLaunchWaveLabel(seed + j * 7),
      sku: demoSkuId(seed + j * 31),
      lane: demoProductionLane(seed + j * 4),
    },
  }));
}

const MEMORY_DEPTH = [
  "depth.mem.depth.satCollapse",
  "depth.mem.depth.failedExpansion",
  "depth.mem.depth.recoveredCorridor",
  "depth.mem.depth.oldHero",
  "depth.mem.depth.semanticFracture",
  "depth.mem.depth.promoScar",
] as const;

export function memoryArchiveDepth(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 2060) % MEMORY_DEPTH.length;
  return Array.from({ length: take }, (_, j) => ({
    key: MEMORY_DEPTH[(start + j) % MEMORY_DEPTH.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 13),
      wave: String(rRange(seed, 2061 + j, 2, 9)),
      sku: demoSkuId(seed + j * 19),
      cluster: demoClusterLabelRu(seed + j * 7),
      card: demoCardTitle(seed + j * 11),
      region: demoRegionLabel(seed + j * 5),
    },
  }));
}

export type SimProjection = { ifKey: string; thenKey: string; vars: Record<string, string> };

export function simulationChamberProjections(seed: number): SimProjection[] {
  const pairs: [string, string][] = [
    ["depth.sim4.if.amp", "depth.sim4.then.premium"],
    ["depth.sim4.if.heroDelay", "depth.sim4.then.recoDecay"],
    ["depth.sim4.if.dtf", "depth.sim4.then.waveCompress"],
    ["depth.sim5.if.heroSat", "depth.sim5.then.quietReco"],
    ["depth.sim5.if.packDrag", "depth.sim5.then.launchCompress"],
    ["depth.sim5.if.refreshSlow", "depth.sim5.then.visualOverlap"],
  ];
  const start = mix(seed, 2070) % pairs.length;
  return [0, 1, 2].map((j) => {
    const [ifKey, thenKey] = pairs[(start + j) % pairs.length]!;
    return {
      ifKey,
      thenKey,
      vars: {
        corridor: demoCorridor(seed + j * 5 + 1),
        daysLo: String(rRange(seed, 2071 + j, 12, 16)),
        daysHi: String(rRange(seed, 2072 + j, 18, 24)),
        threshold: String(rRange(seed, 2073 + j, 72, 91)),
        daysShortLo: String(rRange(seed, 2074 + j, 7, 9)),
        daysShortHi: String(rRange(seed, 2075 + j, 10, 14)),
        overlapPct: String(rRange(seed, 2076 + j, 22, 48)),
      },
    };
  });
}

/* ─── Phase 5 — founder-grade scale, energy flow, fields, hero drama, terrain, echoes ─── */

export function ambientLatticeWhisperVars(seed: number): Record<string, string> {
  const n = empireScaleNumbers(seed);
  return {
    latticeSku: String(n.latticeSku),
    waves: String(n.launchWaves),
    compression: String(n.compressionCorridors),
    heroes: String(n.heroCandidates),
    archive: String(n.archiveSku),
    refreshes: String(n.refreshCycles),
    regional: String(n.regionalMoves),
    reco: String(n.recoBattlefronts),
    linked: String(n.linkedSku),
    activeSku: String(n.activeSku),
    fronts: String(n.launchFronts),
    unstableReco: String(n.unstableRecoCorridors),
    archivedSemantic: String(n.archivedSemanticUnits),
  };
}

const ENERGY_FLOW = [
  "depth.energy.seoFulfill",
  "depth.energy.heroPack",
  "depth.energy.prodReco",
  "depth.energy.visualLaunch",
  "depth.energy.marginCadence",
] as const;

export function strategicEnergyFlowLines(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 2080) % ENERGY_FLOW.length;
  return Array.from({ length: take }, (_, j) => ({
    key: ENERGY_FLOW[(start + j) % ENERGY_FLOW.length]!,
    vars: { corridor: demoCorridor(seed + j * 6), pct: String(rRange(seed, 2081 + j, 14, 52)) },
  }));
}

const FIELD_LINES = [
  "depth.field.visualUnstable",
  "depth.field.recoDriftOverlap",
  "depth.field.marginCompress",
  "depth.field.saturationRidge",
  "depth.field.launchFieldDense",
] as const;

export function marketFieldTheoryLines(seed: number, take = 1): MicroSig[] {
  const start = mix(seed, 2090) % FIELD_LINES.length;
  return Array.from({ length: take }, (_, j) => ({
    key: FIELD_LINES[(start + j) % FIELD_LINES.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 9),
      sku: demoSkuId(seed + j * 47),
      rival: demoCorridor(seed + j * 9 + 2),
      cluster: demoClusterLabelRu(seed + j * 4),
    },
  }));
}

const TERRAIN_LINES = [
  "depth.terrain.premiumAltitude",
  "depth.terrain.hostileZone",
  "depth.terrain.overlapSwamp",
  "depth.terrain.lowMarginTerrain",
  "depth.terrain.crowdedField",
] as const;

export function marketTerrainNarratives(seed: number, take = 1): MicroSig[] {
  const start = mix(seed, 2095) % TERRAIN_LINES.length;
  return Array.from({ length: take }, (_, j) => ({
    key: TERRAIN_LINES[(start + j) % TERRAIN_LINES.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 11),
      rival: demoCorridor(seed + j * 11 + 3),
      semantic: demoSemanticTerritory(seed + j * 13),
      sku: demoSkuId(seed + j * 53),
    },
  }));
}

const HERO_DRAMA = [
  "depth.hero.drama.overheat",
  "depth.hero.drama.cooling",
  "depth.hero.drama.decay",
  "depth.hero.drama.recovery",
  "depth.hero.drama.fragment",
  "depth.hero.drama.rotation",
  "depth.hero.drama.fatigue",
] as const;

export function heroSkuDramaMessageKey(seed: number, triadIndex: number): string {
  return HERO_DRAMA[(mix(seed, 2100 + triadIndex) + triadIndex * 3) % HERO_DRAMA.length]!;
}

const CONSEQUENCE_KEYS = [
  "depth.conseq.expansionRecoPurity",
  "depth.conseq.fboDrag",
  "depth.conseq.visualLaunchDelay",
  "depth.conseq.promoLongTail",
] as const;

export function consequenceAtmosphere(seed: number, take = 1): MicroSig[] {
  const start = mix(seed, 2110) % CONSEQUENCE_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: CONSEQUENCE_KEYS[(start + j) % CONSEQUENCE_KEYS.length]!,
    vars: { corridor: demoCorridor(seed + j * 7), pct: String(rRange(seed, 2111 + j, 12, 38)) },
  }));
}

const OPS_ORCH = [
  "depth.ops5.launchQueue",
  "depth.ops5.dtfCadence",
  "depth.ops5.packLane",
  "depth.ops5.overnightFulfill",
  "depth.ops5.fboPrepStream",
  "depth.ops5.visualLoad",
  "depth.ops5.rolloutSync",
] as const;

export function operationsOrchestrationFloor(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 2120) % OPS_ORCH.length;
  return Array.from({ length: take }, (_, j) => ({
    key: OPS_ORCH[(start + j) % OPS_ORCH.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 4),
      pct: String(rRange(seed, 2121 + j, 48, 94)),
      n: String(rRange(seed, 2122 + j, 3, 14)),
    },
  }));
}

const MEMORY_ECHO = [
  "depth.mem.echo.failedHeroExpansion",
  "depth.mem.echo.promoCollision",
  "depth.mem.echo.collapsedCorridor",
  "depth.mem.echo.unstableLaunchSeason",
  "depth.mem.echo.recoveredRecoLayer",
  "depth.mem.echo.historicalSaturation",
] as const;

export function memoryStrategicEchoes(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 2130) % MEMORY_ECHO.length;
  return Array.from({ length: take }, (_, j) => ({
    key: MEMORY_ECHO[(start + j) % MEMORY_ECHO.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 17),
      wave: String(rRange(seed, 2131 + j, 2, 11)),
      sku: demoSkuId(seed + j * 43),
      cluster: demoClusterLabelRu(seed + j * 9),
    },
  }));
}
