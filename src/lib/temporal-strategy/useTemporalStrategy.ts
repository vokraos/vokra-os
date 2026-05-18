import { useMemo } from "react";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { buildTemporalStrategySnapshot } from "./derive";
import { applyFabricToTemporal } from "./applyFabricRefinement";
import { useTemporalStrategyInput } from "./useTemporalStrategyInput";
import type { TemporalStrategySnapshot } from "./types";

export function useTemporalStrategy(): TemporalStrategySnapshot {
  const input = useTemporalStrategyInput();
  const fabric = useSignalFabricOptional();
  const base = useMemo(() => buildTemporalStrategySnapshot(input), [input]);
  return useMemo(() => (fabric ? applyFabricToTemporal(base, fabric) : base), [base, fabric]);
}
