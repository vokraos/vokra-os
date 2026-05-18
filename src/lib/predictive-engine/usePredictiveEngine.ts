import { useMemo, useState } from "react";
import type { NavId } from "../../types";
import type { ModuleCognitiveSnapshot } from "../cognitive-os/types";
import { COGNITIVE_NETWORK_IDS, useCognitiveOs } from "../cognitive-os";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { buildPredictiveSnapshot } from "./buildSnapshot";
import type { PredictiveEngineSnapshot, TimeHorizonId } from "./types";

export function usePredictiveEngine(): {
  horizon: TimeHorizonId;
  setHorizon: (h: TimeHorizonId) => void;
  snapshot: PredictiveEngineSnapshot;
} {
  const { synthesis, decision, getModule, pulseGeneration } = useCognitiveOs();
  const fabric = useSignalFabricOptional();
  const [horizon, setHorizon] = useState<TimeHorizonId>("d30");

  const modules = useMemo(() => {
    const m: Partial<Record<NavId, ModuleCognitiveSnapshot>> = {};
    for (const id of COGNITIVE_NETWORK_IDS) {
      m[id] = getModule(id);
    }
    return m;
  }, [getModule, pulseGeneration]);

  const snapshot = useMemo(
    () =>
      buildPredictiveSnapshot(
        {
          synthesis,
          decision,
          modules,
          pulseGeneration,
          fabric: fabric ?? undefined,
        },
        horizon,
      ),
    [synthesis, decision, modules, pulseGeneration, horizon, fabric],
  );

  return { horizon, setHorizon, snapshot };
}
