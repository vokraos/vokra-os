/**
 * Localized microstates for strategic surfaces only (Mission Control, Signal Fabric, EIC).
 * Keep motion subconscious — opacity, cadence, soft transforms; no global chrome churn.
 */

import type { SignalEdge, SignalFabricSnapshot, FabricModuleKey } from "../signal-fabric/types";
import type { ExecutiveRegimeProfile, LiveState } from "./types";

export type LocalizedMicrostate =
  | "stabilizing"
  | "drifting"
  | "overloaded"
  | "synchronizing"
  | "recovering"
  | "escalating";

export type MissionLiveContextInput = {
  live: LiveState;
  /** 0–1 aggregate from Mission Control market stress */
  marketStress01: number;
  /** Recent cognitive pulse (e.g. last event present this generation) */
  pulseSynced: boolean;
  /** Count of active initiatives (cognitive layer) */
  activeInitiativeCount: number;
};

export function deriveMissionControlMicrostate(input: MissionLiveContextInput): LocalizedMicrostate {
  const { live, marketStress01, pulseSynced, activeInitiativeCount } = input;
  const profile = live.regimeTransition.profile;
  const tension = live.strategicTension.index01;
  const pressure = live.pressureWave.amplitude01;
  const settling = live.confidenceDrift.settling01;

  if (pulseSynced && tension < 0.62) return "synchronizing";
  if (profile === "recovery" || profile === "silent_accumulation") {
    if (settling > 0.62 && tension < 0.48) return "stabilizing";
    return "recovering";
  }
  if (marketStress01 > 0.68 || pressure > 0.72) return "overloaded";
  if (profile === "expansion" && tension > 0.52) return "escalating";
  if (settling > 0.72 && tension < 0.42 && activeInitiativeCount <= 2) return "stabilizing";
  if (tension > 0.38 && tension < 0.58 && Math.abs(live.confidenceDrift.deltaSigned) < 12) return "drifting";
  return "drifting";
}

export type FabricEdgeLiveState = "stable" | "reinforced" | "decayed" | "blocked" | "conflict" | "sync";

export function deriveFabricEdgeLiveState(
  edge: SignalEdge,
  fabric: Pick<SignalFabricSnapshot, "nodes" | "conflicts">,
  live: LiveState,
): FabricEdgeLiveState {
  const mod = new Set<FabricModuleKey>();
  for (const c of fabric.conflicts) {
    for (const m of c.modules) mod.add(m);
  }
  if (mod.has(edge.from) || mod.has(edge.to)) return "conflict";

  const nFrom = fabric.nodes.find((n) => n.id === edge.from);
  const nTo = fabric.nodes.find((n) => n.id === edge.to);
  const avgP = ((nFrom?.pressure ?? 50) + (nTo?.pressure ?? 50)) / 200;
  if (avgP > 0.68) return "blocked";
  if (edge.intensity >= 62 && (nFrom?.confidence ?? 0) > 58 && (nTo?.confidence ?? 0) > 58) return "reinforced";
  if (edge.intensity < 32) return "decayed";
  if (live.regimeTransition.profile === "recovery" && edge.intensity >= 44) return "sync";
  return "stable";
}

export type ExecutiveLiveContextInput = {
  live: LiveState;
  maxContradictionSeverity: number;
  stabilityIndex: number;
  cognitiveConflictCount: number;
};

export function deriveExecutiveMicrostate(input: ExecutiveLiveContextInput): LocalizedMicrostate {
  const { live, maxContradictionSeverity, stabilityIndex, cognitiveConflictCount } = input;
  const profile = live.regimeTransition.profile;
  const tension = live.strategicTension.index01;
  const coh = stabilityIndex / 100;

  if (cognitiveConflictCount >= 2 && maxContradictionSeverity > 52) return "overloaded";
  if (profile === "recovery" && coh > 0.55) return "recovering";
  if (profile === "expansion" && tension > 0.48) return "escalating";
  if (coh > 0.68 && tension < 0.45) return "stabilizing";
  if (maxContradictionSeverity > 44 && tension > 0.4) return "drifting";
  if (live.executiveBreath.periodSec > 100 && profile === "observation") return "drifting";
  return "stabilizing";
}

/** Motion intensity multiplier: premium defense & recovery calm the surface. */
export function localizedMotionMul(profile: ExecutiveRegimeProfile, micro: LocalizedMicrostate): number {
  let m = 1;
  if (profile === "premium_defense" || profile === "recovery") m *= 0.88;
  if (profile === "expansion") m *= 1.05;
  if (micro === "overloaded") m *= 1.06;
  if (micro === "recovering" || micro === "stabilizing") m *= 0.94;
  if (micro === "synchronizing") m *= 0.96;
  return Math.min(1.12, Math.max(0.82, m));
}

export function deriveSignalFabricLabMicrostate(
  fabric: Pick<SignalFabricSnapshot, "conflicts" | "edges">,
  live: LiveState,
): LocalizedMicrostate {
  const maxI = fabric.edges.length ? Math.max(...fabric.edges.map((e) => e.intensity)) : 0;
  const tension = live.strategicTension.index01;
  if (fabric.conflicts.length >= 2 || tension > 0.72) return "overloaded";
  if (maxI > 74 && tension > 0.48) return "escalating";
  if (live.regimeTransition.profile === "recovery" && maxI < 56) return "recovering";
  if (fabric.conflicts.length === 0 && tension < 0.38 && maxI < 52) return "stabilizing";
  if (fabric.conflicts.length === 1 || (tension > 0.5 && maxI > 60)) return "drifting";
  return "synchronizing";
}
