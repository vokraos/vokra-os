import { useMemo } from "react";
import { useCognitiveOs } from "../cognitive-os";
import { useExecutionOrchestrator } from "../execution-orchestrator";
import { useTemporalStrategy } from "../temporal-strategy";
import { useLiveState } from "../live-state";
import { useSignalFabricOptional } from "../signal-fabric/context";
import { useI18n } from "../i18n/I18nContext";
import { PRIORITY_RANK } from "../initiative-engine/types";
import type { CollectionDeriveInput } from "./derive";

/** Shared OS snapshot for primary collection + workshop candidates (no duplicate hook wiring). */
export function useCollectionDeriveInput(): CollectionDeriveInput {
  const { locale } = useI18n();
  const { synthesis, decision, regime, initiatives, pulseGeneration, brandDnaSurfaceActive } = useCognitiveOs();
  const orchestration = useExecutionOrchestrator();
  const temporal = useTemporalStrategy();
  const { live } = useLiveState();
  const fabricSnap = useSignalFabricOptional();

  return useMemo(() => {
    const loc = locale === "en" ? "en" : "ru";
    const sorted = [...initiatives].sort(
      (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || b.leverage - a.leverage,
    );
    const top = sorted[0];
    const initiativeHeadline = (loc === "en" ? top?.headlineEn : top?.headlineRu)?.trim() ?? "";

    return {
      locale: loc,
      seed: pulseGeneration,
      tension01: live.strategicTension.index01,
      pressure01: live.pressureWave.amplitude01,
      regime,
      synthesis: {
        launchReadiness: synthesis.launchReadiness,
        pressureIndex: synthesis.pressureIndex,
        topOpportunityRu: synthesis.topOpportunityRu,
        dominantClusterRu: synthesis.dominantClusterRu,
        activeMissionRu: synthesis.activeMissionRu,
        memoryEchoRu: synthesis.memoryEchoRu,
      },
      decision: {
        riskProductionOverload: decision.riskProductionOverload,
        riskBrandDilution: decision.riskBrandDilution,
        riskCtrFatigue: decision.riskCtrFatigue,
        riskSaturationProb: decision.riskSaturationProb,
        rank: decision.rank,
      },
      orchestration: {
        executionConfidence: orchestration.executionConfidence,
        operationalDrag: orchestration.operationalDrag,
        primaryRouteId: orchestration.primaryRouteId,
        routes: orchestration.routes,
        nextBestActionRu: orchestration.nextBestActionRu,
        resourcePressure: orchestration.resourcePressure,
      },
      temporalPhase: temporal.phase,
      visualFatigue: temporal.decay.visualFatigue,
      seoSaturation: temporal.decay.seoSaturation,
      initiativeHeadline,
      marketWeatherId: live.strategicOrganism.weatherId,
      weather3Id: live.strategicOrganism.weather3Id,
      brandDnaSurfaceActive,
      fabricEdgeCount: fabricSnap ? fabricSnap.edges.length : null,
      fabricConflictCount: fabricSnap ? fabricSnap.conflicts.length : null,
    };
  }, [
    brandDnaSurfaceActive,
    decision,
    fabricSnap,
    initiatives,
    live.pressureWave.amplitude01,
    live.strategicOrganism.weather3Id,
    live.strategicOrganism.weatherId,
    live.strategicTension.index01,
    locale,
    orchestration,
    pulseGeneration,
    regime,
    synthesis,
    temporal.decay.seoSaturation,
    temporal.decay.visualFatigue,
    temporal.phase,
  ]);
}
