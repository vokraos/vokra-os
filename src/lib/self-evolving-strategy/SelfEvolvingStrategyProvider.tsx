import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCognitiveOs } from "../cognitive-os";
import { useTemporalStrategy } from "../temporal-strategy";
import { useExecutionOrchestrator } from "../execution-orchestrator";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { useExecutiveMemory } from "../executive-memory";
import { useOrganismModel } from "../organism-model/useOrganismModel";
import type { IngestSelfEvolvingWorld, SelfEvolvingSnapshot } from "./types";
import { buildSelfEvolvingSnapshot } from "./derive";
import { ingestSelfEvolvingPulse, loadPersistedSelfEvolvingStrategy, savePersistedSelfEvolvingStrategy } from "./persistence";

type Ctx = { snapshot: SelfEvolvingSnapshot };

const SelfEvolvingStrategyContext = createContext<Ctx | null>(null);

function buildWorldPulse(
  pulseGeneration: number,
  tension01: number,
  organismNarrativeCoherence: number,
  operationalDrag: number,
  executionConfidence: number,
  initiativeCount: number,
  seoSaturation: number,
  riskBrandDilution: number,
  riskProductionOverload: number,
  fabricConflictCount: number,
  launchReadiness: number,
  emPatternIds: readonly string[],
  emDriftCaptionRu: string,
): IngestSelfEvolvingWorld {
  return {
    pulseGeneration,
    tension01,
    narrativeCoherencePct: organismNarrativeCoherence,
    operationalDrag,
    executionConfidence,
    initiativeCount,
    seoSaturation,
    riskBrandDilution,
    riskProductionOverload,
    fabricConflictCount,
    launchReadiness,
    emPatternIds,
    emDriftCaptionRu,
  };
}

export function SelfEvolvingStrategyProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState(loadPersistedSelfEvolvingStrategy);
  const { pulseGeneration, synthesis, decision, initiatives } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const orchestration = useExecutionOrchestrator();
  const fabric = useSignalFabricOptional();
  const { snapshot: emSnap } = useExecutiveMemory();
  const organism = useOrganismModel();

  const tension01 =
    (synthesis.pressureIndex / 100) * 0.42 +
    ((decision.riskCtrFatigue + decision.riskBrandDilution + decision.riskSaturationProb + decision.riskProductionOverload) / 400) * 0.58;

  // Intentionally pulse-scoped: one adaptation ingest per cognitive tick.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- contour reads latest hooks; avoid duplicate ingests
  useEffect(() => {
    setPersisted((prev) => {
      if (pulseGeneration <= prev.lastIngestPulse) return prev;
      const world = buildWorldPulse(
        pulseGeneration,
        Math.min(1, Math.max(0, tension01)),
        organism.cognitiveLoad.narrativeCoherence,
        orchestration.operationalDrag,
        orchestration.executionConfidence,
        initiatives.length,
        temporal.decay.seoSaturation,
        decision.riskBrandDilution,
        decision.riskProductionOverload,
        fabric?.conflicts.length ?? 0,
        synthesis.launchReadiness,
        emSnap.patterns.map((p) => p.id),
        emSnap.drift.captionRu,
      );
      const next = ingestSelfEvolvingPulse(prev, world);
      savePersistedSelfEvolvingStrategy(next);
      return next;
    });
  }, [pulseGeneration]);

  const snapshot = useMemo(() => buildSelfEvolvingSnapshot(persisted, pulseGeneration), [persisted, pulseGeneration]);

  const value = useMemo(() => ({ snapshot }), [snapshot]);

  return <SelfEvolvingStrategyContext.Provider value={value}>{children}</SelfEvolvingStrategyContext.Provider>;
}

export function useSelfEvolvingStrategy(): Ctx {
  const v = useContext(SelfEvolvingStrategyContext);
  if (!v) throw new Error("SelfEvolvingStrategyProvider is required for useSelfEvolvingStrategy");
  return v;
}

export function useSelfEvolvingStrategyOptional(): Ctx | null {
  return useContext(SelfEvolvingStrategyContext);
}
