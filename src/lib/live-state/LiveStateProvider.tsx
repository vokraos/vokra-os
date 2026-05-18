import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { NavId } from "../../types";
import { COGNITIVE_NETWORK_IDS } from "../cognitive-os/types";
import { useCognitiveOs } from "../cognitive-os";
import type { ModuleCognitiveSnapshot } from "../cognitive-os/types";
import { useTemporalStrategy } from "../temporal-strategy";
import { useExecutionOrchestrator } from "../execution-orchestrator";
import { usePredictiveEngine } from "../predictive-engine";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { buildLiveState, type BuildLiveStateInput } from "./derive";
import type { LiveShellCssVars, LiveState, ModuleLiveActivity } from "./types";
import { useExecutiveMemoryOptional } from "../executive-memory";
import { useSelfEvolvingStrategyOptional } from "../self-evolving-strategy";

export type LiveStateContextValue = {
  live: LiveState;
  cssVars: LiveShellCssVars;
  moduleActivity: (id: NavId) => ModuleLiveActivity;
};

const LiveStateContext = createContext<LiveStateContextValue | null>(null);

export function LiveStateProvider({ children }: { children: ReactNode }) {
  const { synthesis, decision, initiatives, pulseGeneration, regime, initiativeUrgency, getModule } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const orchestration = useExecutionOrchestrator();
  const { snapshot: predictive } = usePredictiveEngine();
  const fabricSnap = useSignalFabricOptional();
  const em = useExecutiveMemoryOptional();
  const se = useSelfEvolvingStrategyOptional();

  const modules = useMemo(() => {
    const m: Partial<Record<NavId, ModuleCognitiveSnapshot>> = {};
    for (const id of COGNITIVE_NETWORK_IDS) {
      m[id] = getModule(id);
    }
    return m;
  }, [getModule, pulseGeneration]);

  const fabricLite = useMemo(() => {
    if (!fabricSnap) return null;
    const edges = fabricSnap.edges;
    const n = edges.length;
    const avgIntensity = n === 0 ? 0 : edges.reduce((s, e) => s + e.intensity, 0) / n;
    return {
      edgeCount: n,
      avgIntensity,
      conflictCount: fabricSnap.conflicts.length,
    };
  }, [fabricSnap]);

  const value = useMemo(() => {
    const input: BuildLiveStateInput = {
      pulseGeneration,
      regime,
      synthesis: {
        pressureIndex: synthesis.pressureIndex,
        launchReadiness: synthesis.launchReadiness,
        memoryEchoRu: synthesis.memoryEchoRu,
        topOpportunityRu: synthesis.topOpportunityRu,
      },
      decision: {
        riskCtrFatigue: decision.riskCtrFatigue,
        riskBrandDilution: decision.riskBrandDilution,
        riskSaturationProb: decision.riskSaturationProb,
        riskProductionOverload: decision.riskProductionOverload,
        priorityHeadlineRu: decision.priorityHeadlineRu,
      },
      initiatives: { priorities: initiatives.map((i) => i.priority) },
      initiativeUrgency,
      orchestration: {
        executionConfidence: orchestration.executionConfidence,
        operationalDrag: orchestration.operationalDrag,
        resourcePressure: {
          dtfQueue: orchestration.resourcePressure.dtfQueue,
          contentLoad: orchestration.resourcePressure.contentLoad,
          fboReadiness: orchestration.resourcePressure.fboReadiness,
        },
      },
      temporal: {
        phase: temporal.phase,
        bestLaunchWindowRu: temporal.bestLaunchWindowRu,
        decay: temporal.decay,
        patienceScore: temporal.patienceScore,
      },
      predictive: predictive
        ? { decayPressure: predictive.decayPressure, volatilityIndex: predictive.volatilityIndex }
        : null,
      fabric: fabricLite,
      modules,
      executiveMemoryHints: em
        ? {
            tensionBias: em.snapshot.hints.tensionBias,
            confidenceBias: em.snapshot.hints.confidenceBias,
            stabilityBias: em.snapshot.hints.stabilityBias,
            stripEchoRu: em.snapshot.hints.stripEchoRu,
          }
        : null,
      selfEvolvingHints: se
        ? {
            tensionDelta: se.snapshot.hints.tensionDelta,
            confidenceDelta: se.snapshot.hints.confidenceDelta,
            stabilityDelta: se.snapshot.hints.stabilityDelta,
            stripRu: se.snapshot.hints.stripRu,
          }
        : null,
    };
    return buildLiveState(input);
  }, [
    pulseGeneration,
    synthesis,
    decision,
    initiatives,
    initiativeUrgency,
    orchestration,
    temporal,
    predictive,
    fabricLite,
    modules,
    em,
    se,
  ]);

  return <LiveStateContext.Provider value={value}>{children}</LiveStateContext.Provider>;
}

export function useLiveState(): LiveStateContextValue {
  const v = useContext(LiveStateContext);
  if (!v) throw new Error("LiveStateProvider is required for useLiveState");
  return v;
}
