import { useMemo } from "react";
import type { NavId } from "../../types";
import { BRAND_DNA } from "../brand-dna";
import { COGNITIVE_NETWORK_IDS, useCognitiveOs } from "../cognitive-os";
import type { ModuleCognitiveSnapshot } from "../cognitive-os/types";
import { useTemporalStrategy } from "../temporal-strategy";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { useExecutionOrchestrator } from "../execution-orchestrator";
import { usePredictiveEngine } from "../predictive-engine";
import { useMemorySnapshot } from "../memory";
import { buildBrandEvolution } from "./derive";
import type { BrandEvolutionSnapshot } from "./types";

export function useBrandEvolution(): BrandEvolutionSnapshot {
  const { synthesis, decision, initiatives, pulseGeneration, getModule } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const fabric = useSignalFabricOptional();
  const orchestration = useExecutionOrchestrator();
  const { snapshot: predictive } = usePredictiveEngine();
  const memorySnap = useMemorySnapshot();

  const modules = useMemo(() => {
    const m: Partial<Record<NavId, ModuleCognitiveSnapshot>> = {};
    for (const id of COGNITIVE_NETWORK_IDS) {
      m[id] = getModule(id);
    }
    return m;
  }, [getModule, pulseGeneration]);

  const memoryGenerationCount = useMemo(() => Object.keys(memorySnap.generations).length, [memorySnap.generations]);
  const memoryProjectCount = useMemo(() => Object.keys(memorySnap.projects).length, [memorySnap.projects]);

  return useMemo(
    () =>
      buildBrandEvolution({
        constitution: BRAND_DNA,
        orchestration,
        synthesis,
        decision,
        initiatives,
        temporal,
        fabric,
        modules,
        predictive,
        pulseGeneration,
        memoryGenerationCount,
        memoryProjectCount,
      }),
    [
      orchestration,
      synthesis,
      decision,
      initiatives,
      temporal,
      fabric,
      modules,
      predictive,
      pulseGeneration,
      memoryGenerationCount,
      memoryProjectCount,
    ],
  );
}
