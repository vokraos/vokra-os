import type { CollectionEntity } from "../types";
import type { WorkshopDraft } from "./types";

export function mergeWorkshopEntity(base: CollectionEntity, draft: WorkshopDraft): CollectionEntity {
  const stopConditions =
    draft.stopLines !== undefined
      ? draft.stopLines
          .split(/\n+/)
          .map((x) => x.trim())
          .filter(Boolean)
      : [...base.stopConditions];

  let skuClusters = base.skuClusters.map((c) => ({ ...c }));
  if (draft.heroCount != null) {
    skuClusters = skuClusters.map((c) => (c.role === "hero" ? { ...c, count: Math.max(1, Math.min(3, draft.heroCount!)) } : c));
  }
  if (draft.supportCount != null) {
    skuClusters = skuClusters.map((c) =>
      c.role === "support" ? { ...c, count: Math.max(4, Math.min(12, draft.supportCount!)) } : c,
    );
  }

  const hasVisualPatch =
    draft.visualMood != null ||
    draft.printDirection != null ||
    draft.visualHeroCard != null ||
    draft.visualModelBg != null ||
    draft.visualReels != null ||
    draft.visualThumb != null;
  const visualDirection = hasVisualPatch
    ? {
        ...base.visualDirection,
        mood: draft.visualMood ?? base.visualDirection.mood,
        printDirection: draft.printDirection ?? base.visualDirection.printDirection,
        heroCardDirection: draft.visualHeroCard ?? base.visualDirection.heroCardDirection,
        modelBackgroundStyle: draft.visualModelBg ?? base.visualDirection.modelBackgroundStyle,
        reelsDirection: draft.visualReels ?? base.visualDirection.reelsDirection,
        marketplaceMainPhotoLogic: draft.visualThumb ?? base.visualDirection.marketplaceMainPhotoLogic,
      }
    : base.visualDirection;

  const seoPlan =
    draft.seoPrimary || draft.seoSecondary
      ? {
          ...base.seoPlan,
          primaryCluster: draft.seoPrimary ?? base.seoPlan.primaryCluster,
          secondaryClusters: draft.seoSecondary
            ? draft.seoSecondary.split(/[,;]+/).map((x) => x.trim()).filter(Boolean)
            : base.seoPlan.secondaryClusters,
        }
      : base.seoPlan;

  const hasLaunchPatch =
    draft.launchTestWave != null ||
    draft.launchRefreshWave != null ||
    draft.launchAmpWave != null ||
    draft.launchFboWave != null ||
    draft.launchHoldStop != null;
  const launchPlan = hasLaunchPatch
    ? {
        ...base.launchPlan,
        testWave: draft.launchTestWave ?? base.launchPlan.testWave,
        refreshWave: draft.launchRefreshWave ?? base.launchPlan.refreshWave,
        amplificationWave: draft.launchAmpWave ?? base.launchPlan.amplificationWave,
        fboWave: draft.launchFboWave ?? base.launchPlan.fboWave,
        holdStopCondition: draft.launchHoldStop ?? base.launchPlan.holdStopCondition,
      }
    : base.launchPlan;

  return {
    ...base,
    name: draft.name ?? base.name,
    concept: draft.concept ?? base.concept,
    targetBuyer: draft.targetBuyer ?? base.targetBuyer,
    skuClusters,
    visualDirection,
    seoPlan,
    launchPlan,
    stopConditions,
  };
}
