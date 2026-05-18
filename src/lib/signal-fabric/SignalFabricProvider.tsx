import { useMemo, type ReactNode } from "react";
import { useCognitiveOs } from "../cognitive-os";
import { useTemporalStrategyInput } from "../temporal-strategy/useTemporalStrategyInput";
import { buildTemporalStrategySnapshot } from "../temporal-strategy/derive";
import { buildFabricMemoryHints } from "./memoryHints";
import { buildSignalFabric } from "./derive";
import { SignalFabricContext } from "./context";

export function SignalFabricProvider({ children }: { children: ReactNode }) {
  const { lastEvent, brandDnaSurfaceActive } = useCognitiveOs();
  const temporalInput = useTemporalStrategyInput();
  const temporal = useMemo(() => buildTemporalStrategySnapshot(temporalInput), [temporalInput]);

  const fabric = useMemo(
    () =>
      buildSignalFabric({
        synthesis: temporalInput.synthesis,
        decision: temporalInput.decision,
        initiatives: temporalInput.initiatives,
        modules: temporalInput.modules,
        pulseGeneration: temporalInput.pulseGeneration,
        temporal,
        lastEvent,
        brandDnaSurfaceActive,
        fabricMemory: buildFabricMemoryHints(),
      }),
    [temporalInput, temporal, lastEvent, brandDnaSurfaceActive],
  );

  return <SignalFabricContext.Provider value={fabric}>{children}</SignalFabricContext.Provider>;
}
