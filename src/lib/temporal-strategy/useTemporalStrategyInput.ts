import { useMemo } from "react";
import { COGNITIVE_NETWORK_IDS, useCognitiveOs } from "../cognitive-os";
import type { NavId } from "../../types";
import type { ModuleCognitiveSnapshot } from "../cognitive-os/types";
import { useMemorySnapshot } from "../memory/hooks";
import { buildTemporalMemoryHints } from "./memoryHints";
import type { BuildTemporalStrategyInput } from "./derive";

/** Shared bundle for temporal snapshot + signal fabric (avoids duplicate module maps). */
export function useTemporalStrategyInput(): BuildTemporalStrategyInput {
  const { synthesis, decision, regime, initiatives, pulseGeneration, getModule } = useCognitiveOs();
  const snap = useMemorySnapshot();

  const modules = useMemo(() => {
    const m: Partial<Record<NavId, ModuleCognitiveSnapshot>> = {};
    for (const id of COGNITIVE_NETWORK_IDS) {
      m[id] = getModule(id);
    }
    return m;
  }, [getModule, pulseGeneration]);

  const memoryHints = useMemo(() => buildTemporalMemoryHints(), [snap]);

  return useMemo(
    () => ({
      synthesis,
      decision,
      regime,
      initiatives,
      modules,
      pulseGeneration,
      memoryHints,
    }),
    [synthesis, decision, regime, initiatives, modules, pulseGeneration, memoryHints],
  );
}
