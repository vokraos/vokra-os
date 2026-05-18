import { useMemo } from "react";
import type { NavId } from "../../types";
import { COGNITIVE_NETWORK_IDS, useCognitiveOs } from "../cognitive-os";
import type { ModuleCognitiveSnapshot } from "../cognitive-os/types";
import { useTemporalStrategy } from "../temporal-strategy";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { useExecutionOrchestrator } from "../execution-orchestrator";
import { buildFeedbackLoop } from "./derive";
import type { FeedbackLoopSnapshot } from "./types";

export function useFeedbackLoop(): FeedbackLoopSnapshot {
  const { synthesis, decision, initiatives, pulseGeneration, getModule } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const fabric = useSignalFabricOptional();
  const orchestration = useExecutionOrchestrator();

  const modules = useMemo(() => {
    const m: Partial<Record<NavId, ModuleCognitiveSnapshot>> = {};
    for (const id of COGNITIVE_NETWORK_IDS) {
      m[id] = getModule(id);
    }
    return m;
  }, [getModule, pulseGeneration]);

  return useMemo(
    () =>
      buildFeedbackLoop({
        orchestration,
        synthesis,
        decision,
        initiatives,
        temporal,
        fabric,
        modules,
        pulseGeneration,
      }),
    [orchestration, synthesis, decision, initiatives, temporal, fabric, modules, pulseGeneration],
  );
}
