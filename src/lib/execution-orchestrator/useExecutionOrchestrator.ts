import { useMemo } from "react";
import { COGNITIVE_NETWORK_IDS, useCognitiveOs } from "../cognitive-os";
import type { NavId } from "../../types";
import type { ModuleCognitiveSnapshot } from "../cognitive-os/types";
import { useTemporalStrategy } from "../temporal-strategy";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { usePredictiveEngine } from "../predictive-engine";
import { buildExecutionOrchestration } from "./derive";
import type { ExecutionOrchestrationSnapshot } from "./types";

export function useExecutionOrchestrator(): ExecutionOrchestrationSnapshot {
  const { synthesis, decision, initiatives, pulseGeneration, getModule } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const fabric = useSignalFabricOptional();
  const { snapshot: predictive } = usePredictiveEngine();

  const modules = useMemo(() => {
    const m: Partial<Record<NavId, ModuleCognitiveSnapshot>> = {};
    for (const id of COGNITIVE_NETWORK_IDS) {
      m[id] = getModule(id);
    }
    return m;
  }, [getModule, pulseGeneration]);

  return useMemo(
    () =>
      buildExecutionOrchestration({
        synthesis,
        decision,
        initiatives,
        modules,
        pulseGeneration,
        temporal,
        fabric,
        predictive,
      }),
    [synthesis, decision, initiatives, modules, pulseGeneration, temporal, fabric, predictive],
  );
}
