import { useMemo } from "react";
import { useCognitiveOs } from "../cognitive-os";
import { useTemporalStrategy } from "../temporal-strategy";
import { useLiveState } from "../live-state";
import { useI18n } from "../i18n/I18nContext";
import { useExecutiveDecisionBoard } from "../executive-decision-compression";
import { useCollectionBuilderEntity } from "../collection-builder";
import { buildMarketplaceEntitySnapshot } from "../entity-core/snapshot";
import type { CorridorId } from "../entity-core/types";
import { buildVisualStrategySnapshot, type VisualStrategySnapshotInput } from "./snapshot";

export function useVisualStrategySnapshot(): ReturnType<typeof buildVisualStrategySnapshot> {
  const { locale } = useI18n();
  const { synthesis, decision, pulseGeneration, brandDnaSurfaceActive } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const { live } = useLiveState();
  const edc = useExecutiveDecisionBoard();
  const collection = useCollectionBuilderEntity();

  return useMemo(() => {
    const loc = locale === "en" ? "en" : "ru";
    const snap = buildMarketplaceEntitySnapshot(
      pulseGeneration,
      live.strategicTension.index01,
      live.pressureWave.amplitude01,
    );
    const ce = snap.corridors.get(collection.corridorId as CorridorId);
    const overlap01 = ce?.overlapRisk01 ?? 0.45;
    const heroDensity01 = ce?.heroDensity01 ?? 0.35;

    const input: VisualStrategySnapshotInput = {
      pulseSeed: pulseGeneration,
      locale: loc,
      visualFatigue01: temporal.decay.visualFatigue,
      seoSaturation01: temporal.decay.seoSaturation,
      tension01: live.strategicTension.index01,
      pressure01: live.pressureWave.amplitude01,
      riskCtrFatigue: decision.riskCtrFatigue,
      dominantClusterRu: synthesis.dominantClusterRu,
      executiveBestNext: edc.bestNext,
      executiveWhyNow: edc.whyNow,
      brandDnaSurfaceActive,
      collectionCorridorId: collection.corridorId,
      collectionCorridorNameKey: collection.corridorNameKey,
      collectionKind: collection.kind,
      visualMood: collection.visualDirection.mood,
      corridorPressure01: collection.corridorPressure01,
      overlap01,
      heroDensity01,
      dtfSuitabilityLine: collection.productionFit.dtfSuitability,
      collectionReelsDirection: collection.visualDirection.reelsDirection,
      collectionMarketplaceThumb: collection.visualDirection.marketplaceMainPhotoLogic,
      collectionModelBg: collection.visualDirection.modelBackgroundStyle,
    };
    return buildVisualStrategySnapshot(input);
  }, [
    brandDnaSurfaceActive,
    collection,
    decision.riskCtrFatigue,
    edc.bestNext,
    edc.whyNow,
    live.pressureWave.amplitude01,
    live.strategicTension.index01,
    locale,
    pulseGeneration,
    synthesis.dominantClusterRu,
    temporal.decay.seoSaturation,
    temporal.decay.visualFatigue,
  ]);
}
