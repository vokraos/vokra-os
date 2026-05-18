import { useMemo } from "react";
import { useCognitiveOs } from "../cognitive-os";
import { useExecutionOrchestrator } from "../execution-orchestrator";
import { useTemporalStrategy } from "../temporal-strategy";
import { useI18n } from "../i18n/I18nContext";
import type { CollectionPipelineBuildInput } from "./pipeline-types";

export type CollectionPipelineInputWithoutEntity = Omit<CollectionPipelineBuildInput, "entity">;

/** Shared OS inputs for `buildCollectionExecutionPipeline` and workshop candidate comparison. */
export function useCollectionPipelineInputWithoutEntity(): CollectionPipelineInputWithoutEntity {
  const { locale } = useI18n();
  const orchestration = useExecutionOrchestrator();
  const { synthesis, decision } = useCognitiveOs();
  const temporal = useTemporalStrategy();

  return useMemo(() => {
    const loc = locale === "en" ? "en" : "ru";
    return {
      orchestration,
      launchReadiness: synthesis.launchReadiness,
      brandFitRank: decision.rank.brandFit,
      visualFatigue: temporal.decay.visualFatigue,
      seoSaturation: temporal.decay.seoSaturation,
      riskProductionOverload: decision.riskProductionOverload,
      patienceScore: temporal.patienceScore,
      locale: loc,
    };
  }, [
    decision.rank.brandFit,
    decision.riskProductionOverload,
    locale,
    orchestration,
    synthesis.launchReadiness,
    temporal.decay.seoSaturation,
    temporal.decay.visualFatigue,
    temporal.patienceScore,
  ]);
}
