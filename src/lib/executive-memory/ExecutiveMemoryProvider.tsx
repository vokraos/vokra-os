import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCognitiveOs } from "../cognitive-os";
import { useTemporalStrategy } from "../temporal-strategy";
import { useExecutionOrchestrator } from "../execution-orchestrator";
import { usePredictiveEngine } from "../predictive-engine";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { useMemorySnapshot } from "../memory";
import { useOrganismModel } from "../organism-model/useOrganismModel";
import { buildExecutiveMemorySnapshot, buildIngestWorldPulse, worldPulseToSample } from "./derive";
import { ingestPulseSample, loadPersistedExecutiveMemory, savePersistedExecutiveMemory } from "./persistence";
import type { ExecutiveMemorySnapshot } from "./types";

type Ctx = { snapshot: ExecutiveMemorySnapshot };

const ExecutiveMemoryContext = createContext<Ctx | null>(null);

export function ExecutiveMemoryProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState(loadPersistedExecutiveMemory);
  const { synthesis, decision, initiatives, pulseGeneration, regime, initiativeUrgency } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const orchestration = useExecutionOrchestrator();
  const { snapshot: predictive, horizon } = usePredictiveEngine();
  const fabric = useSignalFabricOptional();
  const memorySnap = useMemorySnapshot();
  const organism = useOrganismModel();

  const memoryGenCount = useMemo(() => Object.keys(memorySnap.generations).length, [memorySnap.generations]);

  // Intentionally pulse-scoped: each cognitive tick snapshots the full contour once.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- world reads latest hooks; avoid duplicate ingests per pulse
  useEffect(() => {
    setPersisted((prev) => {
      if (pulseGeneration <= prev.lastIngestPulse) return prev;
      const world = buildIngestWorldPulse({
        pulseGeneration,
        regime,
        synthesis: {
          pressureIndex: synthesis.pressureIndex,
          launchReadiness: synthesis.launchReadiness,
        },
        decision: {
          riskCtrFatigue: decision.riskCtrFatigue,
          riskBrandDilution: decision.riskBrandDilution,
          riskSaturationProb: decision.riskSaturationProb,
          riskProductionOverload: decision.riskProductionOverload,
        },
        orchestration: {
          executionConfidence: orchestration.executionConfidence,
          operationalDrag: orchestration.operationalDrag,
        },
        temporal: {
          phase: temporal.phase,
          decay: temporal.decay,
        },
        initiatives: {
          count: initiatives.length,
          topLabelsRu: initiatives.slice(0, 10).map((i) => i.headlineRu),
        },
        initiativeUrgency,
        fabricConflictCount: fabric?.conflicts.length ?? 0,
        memoryGenerationCount: memoryGenCount,
        organism: {
          operationalStress: organism.operationalStress.index / 100,
          narrativeCoherence: organism.cognitiveLoad.narrativeCoherence / 100,
        },
        predictive: predictive ? { volatilityIndex: predictive.volatilityIndex } : null,
        simHorizonId: horizon,
      });
      const sample = worldPulseToSample(world);
      const next = ingestPulseSample(prev, sample);
      savePersistedExecutiveMemory(next);
      return next;
    });
  }, [pulseGeneration]);

  const snapshot = useMemo(() => buildExecutiveMemorySnapshot(persisted, pulseGeneration), [persisted, pulseGeneration]);

  const value = useMemo(() => ({ snapshot }), [snapshot]);

  return <ExecutiveMemoryContext.Provider value={value}>{children}</ExecutiveMemoryContext.Provider>;
}

export function useExecutiveMemory(): Ctx {
  const v = useContext(ExecutiveMemoryContext);
  if (!v) throw new Error("ExecutiveMemoryProvider is required for useExecutiveMemory");
  return v;
}

export function useExecutiveMemoryOptional(): Ctx | null {
  return useContext(ExecutiveMemoryContext);
}
