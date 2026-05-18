import { advanceDrift, initialDrift } from "./drift";
import { closeEpoch, openEpochFromSample, shouldStartNewEpoch, trimEpochs } from "./epochs";
import type { ExecutivePatternId, PersistedExecutiveMemoryState, PulseMemorySample } from "./types";
import { EXECUTIVE_MEMORY_SCHEMA_VERSION } from "./types";

const STORAGE_KEY = "vokra.executiveMemory.v1";
const MAX_SAMPLES = 320;

function uid(pulse: number): string {
  return `ep-${pulse}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialPersisted(): PersistedExecutiveMemoryState {
  return {
    schemaVersion: EXECUTIVE_MEMORY_SCHEMA_VERSION,
    samples: [],
    epochs: [],
    patternStats: {},
    drift: initialDrift(),
    lastIngestPulse: -1,
    lastRecoveryPulse: 0,
  };
}

export function loadPersistedExecutiveMemory(): PersistedExecutiveMemoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialPersisted();
    const p = JSON.parse(raw) as PersistedExecutiveMemoryState;
    if (p.schemaVersion !== EXECUTIVE_MEMORY_SCHEMA_VERSION || !Array.isArray(p.samples)) return createInitialPersisted();
    const base = createInitialPersisted();
    return {
      ...base,
      ...p,
      drift: { ...base.drift, ...p.drift },
      samples: p.samples.slice(-MAX_SAMPLES),
      epochs: Array.isArray(p.epochs) ? p.epochs : [],
      patternStats: p.patternStats ?? {},
      lastRecoveryPulse: typeof p.lastRecoveryPulse === "number" ? p.lastRecoveryPulse : 0,
    };
  } catch {
    return createInitialPersisted();
  }
}

export function savePersistedExecutiveMemory(state: PersistedExecutiveMemoryState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function bumpPattern(
  stats: PersistedExecutiveMemoryState["patternStats"],
  id: ExecutivePatternId,
  pulse: number,
  leverageSignal: number,
): PersistedExecutiveMemoryState["patternStats"] {
  const cur = stats[id] ?? { hits: 0, lastPulse: 0, leverageEMA: 0.42 };
  return {
    ...stats,
    [id]: {
      hits: cur.hits + 1,
      lastPulse: pulse,
      leverageEMA: Math.min(1, cur.leverageEMA * 0.94 + leverageSignal * 0.06),
    },
  };
}

function applyPatternHeuristics(
  s: PulseMemorySample,
  prev: PulseMemorySample | undefined,
  stats: PersistedExecutiveMemoryState["patternStats"],
): PersistedExecutiveMemoryState["patternStats"] {
  let next = { ...stats };
  if (s.initiativeCount >= 4 && s.riskBrandDilution > 46) {
    next = bumpPattern(next, "parallel_initiative_dilution", s.pulse, s.riskBrandDilution / 100);
  }
  if (s.riskProductionOverload > 52 && s.operationalDrag > 56) {
    next = bumpPattern(next, "execution_wave_overload", s.pulse, s.riskProductionOverload / 100);
  }
  if (s.seoSaturation > 48 && s.riskBrandDilution > 48) {
    next = bumpPattern(next, "aggressive_seo_hero_drift", s.pulse, (s.seoSaturation + s.riskBrandDilution) / 200);
  }
  if (s.executiveProfile === "recovery" && s.ctrFatigue > 42 && s.visualFatigue < 50) {
    next = bumpPattern(next, "motion_recovery_ctr", s.pulse, 0.55);
  }
  if (s.launchReadiness > 68 && s.pressureIndex < 46) {
    next = bumpPattern(next, "premium_launch_stability", s.pulse, s.launchReadiness / 100);
  }
  if (s.fabricConflictCount === 0 && s.executiveProfile === "recovery" && prev && prev.fabricConflictCount > 0) {
    next = bumpPattern(next, "reels_hero_sync_recovery", s.pulse, 0.62);
  }
  return next;
}

export function ingestPulseSample(prev: PersistedExecutiveMemoryState, s: PulseMemorySample): PersistedExecutiveMemoryState {
  const samples = [...prev.samples, s].slice(-MAX_SAMPLES);
  const prevSample = prev.samples.length ? prev.samples[prev.samples.length - 1] : undefined;
  let epochs = [...prev.epochs];
  const openIndices = epochs.map((e, i) => (e.endPulse == null ? i : -1)).filter((i) => i >= 0);
  const lastOpenIdx = openIndices.length ? openIndices[openIndices.length - 1]! : undefined;

  if (shouldStartNewEpoch(prevSample, s)) {
    if (lastOpenIdx != null && epochs[lastOpenIdx]?.endPulse == null) {
      epochs[lastOpenIdx] = closeEpoch(epochs[lastOpenIdx]!, s.pulse, s);
    }
    epochs = trimEpochs([...epochs, openEpochFromSample(s, uid(s.pulse))]);
  } else if (lastOpenIdx != null && epochs[lastOpenIdx]) {
    const e = epochs[lastOpenIdx]!;
    epochs[lastOpenIdx] = {
      ...e,
      strategicTension01: (e.strategicTension01 + s.tension01) / 2,
      operationalStress01: Math.min(1, (e.operationalStress01 + s.operationalDrag / 100) / 2),
      executiveSummaryRu: `${e.executiveSummaryRu} Обновление пульса ${s.pulse}.`,
    };
  }

  let lastRecoveryPulse = prev.lastRecoveryPulse;
  if (s.executiveProfile === "recovery" || s.regime === "production_load") {
    lastRecoveryPulse = s.pulse;
  }

  const drift = advanceDrift(prev.drift, s);
  const patternStats = applyPatternHeuristics(s, prevSample, prev.patternStats);

  return {
    schemaVersion: EXECUTIVE_MEMORY_SCHEMA_VERSION,
    samples,
    epochs,
    patternStats,
    drift,
    lastIngestPulse: s.pulse,
    lastRecoveryPulse,
  };
}
