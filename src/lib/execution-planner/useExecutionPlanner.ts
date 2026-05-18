import { useMemo } from "react";
import { COGNITIVE_NETWORK_IDS, useCognitiveOs } from "../cognitive-os";
import type { NavId } from "../../types";
import type { ModuleCognitiveSnapshot } from "../cognitive-os/types";
import { useTemporalStrategy } from "../temporal-strategy";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { useMemorySnapshot } from "../memory/hooks";
import { buildExecutionPlan } from "./derive";
import { buildExecutionMemoryHints } from "./memoryHints";
import type { ExecutionPlanSnapshot } from "./types";

export function useExecutionPlanner(): ExecutionPlanSnapshot {
  const { synthesis, decision, initiatives, pulseGeneration, getModule } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const fabric = useSignalFabricOptional();
  const snap = useMemorySnapshot();

  const modules = useMemo(() => {
    const m: Partial<Record<NavId, ModuleCognitiveSnapshot>> = {};
    for (const id of COGNITIVE_NETWORK_IDS) {
      m[id] = getModule(id);
    }
    return m;
  }, [getModule, pulseGeneration]);

  const memoryHints = useMemo(() => buildExecutionMemoryHints(), [snap]);

  return useMemo(
    () =>
      buildExecutionPlan({
        synthesis,
        decision,
        initiatives,
        modules,
        pulseGeneration,
        temporal,
        memoryHints,
        fabric: fabric ?? undefined,
      }),
    [synthesis, decision, initiatives, modules, pulseGeneration, temporal, memoryHints, fabric],
  );
}
