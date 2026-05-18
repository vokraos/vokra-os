import type { CollectionPipelineBundle, CollectionStageStatus } from "../collection-builder/pipeline-types";
import type { CollectionEntity } from "../collection-builder/types";
import type { WorkshopSkuStructure } from "../collection-builder/workshop/sku-structure";
import { stableActionId } from "../assortment-actions/hash";
import type { CollectionExecutionAction, CollectionExecutionStageId } from "./types";

export type CollectionBridgeDeriveInput = {
  collection: CollectionEntity;
  pipeline: CollectionPipelineBundle;
  skuStructure: WorkshopSkuStructure;
  promptPackInSession: boolean;
};

type TFn = (key: string, vars?: Record<string, string>) => string;

type DraftSpec = {
  stage: CollectionExecutionStageId;
  titleKey: string;
  reasonKey: string;
  priority: CollectionExecutionAction["priority"];
  urgency: CollectionExecutionAction["urgency"];
  targetSystem: string;
  destination: CollectionExecutionAction["suggestedDestination"];
  when: () => boolean;
};

function stageAt(pipeline: CollectionPipelineBundle, index: number): CollectionStageStatus | null {
  return pipeline.stages.find((s) => s.index === index)?.status ?? null;
}

function pushSpec(
  out: CollectionExecutionAction[],
  input: CollectionBridgeDeriveInput,
  spec: DraftSpec,
  t: TFn,
) {
  if (!spec.when()) return;
  const corridor = input.collection.corridorNameKey.replace("depth.topo.", "");
  const vars = {
    name: input.collection.name,
    corridor,
    marketplace: "WB/Ozon",
  };
  const now = Date.now();
  out.push({
    id: stableActionId(["col-exec", input.collection.id, spec.stage]),
    sourceCollectionId: input.collection.id,
    sourceCollectionName: input.collection.name,
    sourceStage: spec.stage,
    title: t(spec.titleKey, vars),
    reason: t(spec.reasonKey, vars),
    priority: spec.priority,
    urgency: spec.urgency,
    targetSystem: spec.targetSystem,
    suggestedDestination: spec.destination,
    linkedCorridor: corridor,
    marketplaceTarget: vars.marketplace,
    status: "new",
    createdAt: now,
    updatedAt: now,
  });
}

const PRIORITY_RANK: Record<CollectionExecutionAction["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function deriveCollectionExecutionActions(
  input: CollectionBridgeDeriveInput,
  t: TFn,
): CollectionExecutionAction[] {
  const { collection: c, pipeline: p, skuStructure: sku } = input;
  const r = p.readiness;
  const er = p.executionRoute;
  const specs: DraftSpec[] = [
    {
      stage: "hold_launch",
      titleKey: "cab.action.hold.title",
      reasonKey: "cab.action.hold.reason",
      priority: "critical",
      urgency: "critical",
      targetSystem: "collection_builder",
      destination: "collectionBuilder",
      when: () =>
        p.structuredStops.some((s) => s.active) ||
        er.stopConditions.length > 0 ||
        er.blockers.length >= 2,
    },
    {
      stage: "dna",
      titleKey: "cab.action.dna.title",
      reasonKey: "cab.action.dna.reason",
      priority: "high",
      urgency: "elevated",
      targetSystem: "brand_dna",
      destination: "dna",
      when: () =>
        r.brandReadiness < 50 ||
        stageAt(p, 0) === "blocked" ||
        (stageAt(p, 0) !== "done" && r.brandReadiness < 62),
    },
    {
      stage: "hero_sku",
      titleKey: "cab.action.heroSku.title",
      reasonKey: "cab.action.heroSku.reason",
      priority: "high",
      urgency: "elevated",
      targetSystem: "collection_builder",
      destination: "collectionBuilder",
      when: () =>
        c.heroProducts.length === 0 ||
        sku.heroes.length === 0 ||
        stageAt(p, 2) === "blocked" ||
        (stageAt(p, 2) !== "done" && sku.heroes.length < 1),
    },
    {
      stage: "support_sku",
      titleKey: "cab.action.supportSku.title",
      reasonKey: "cab.action.supportSku.reason",
      priority: "high",
      urgency: "medium",
      targetSystem: "collection_builder",
      destination: "collectionBuilder",
      when: () =>
        sku.support.length < 4 ||
        stageAt(p, 3) === "blocked" ||
        (stageAt(p, 3) !== "done" && sku.support.length < 6),
    },
    {
      stage: "visual_brief",
      titleKey: "cab.action.visualBrief.title",
      reasonKey: "cab.action.visualBrief.reason",
      priority: "high",
      urgency: "elevated",
      targetSystem: "collection_builder",
      destination: "collectionBuilder",
      when: () =>
        r.visualReadiness < 48 ||
        stageAt(p, 5) === "blocked" ||
        (stageAt(p, 5) !== "done" && r.visualReadiness < 58),
    },
    {
      stage: "prompt_pack",
      titleKey: "cab.action.promptPack.title",
      reasonKey: "cab.action.promptPack.reason",
      priority: "medium",
      urgency: "medium",
      targetSystem: "prompt_pack",
      destination: "promptPack",
      when: () => !input.promptPackInSession && stageAt(p, 5) !== "done",
    },
    {
      stage: "visual_queue",
      titleKey: "cab.action.visualQueue.title",
      reasonKey: "cab.action.visualQueue.reason",
      priority: "medium",
      urgency: "elevated",
      targetSystem: "visual_production",
      destination: "visualProduction",
      when: () => r.visualReadiness < 55 && stageAt(p, 5) === "in_progress",
    },
    {
      stage: "seo_brief",
      titleKey: "cab.action.seoBrief.title",
      reasonKey: "cab.action.seoBrief.reason",
      priority: "high",
      urgency: "elevated",
      targetSystem: "collection_builder",
      destination: "collectionBuilder",
      when: () =>
        r.seoReadiness < 48 ||
        stageAt(p, 6) === "blocked" ||
        (stageAt(p, 6) !== "done" && r.seoReadiness < 58),
    },
    {
      stage: "production_fit",
      titleKey: "cab.action.productionFit.title",
      reasonKey: "cab.action.productionFit.reason",
      priority: "high",
      urgency: "elevated",
      targetSystem: "collection_builder",
      destination: "collectionBuilder",
      when: () =>
        r.productionReadiness < 48 ||
        stageAt(p, 9) === "blocked" ||
        p.structuredStops.some((s) => s.id === "production_pressure" && s.active),
    },
    {
      stage: "launch_blockers",
      titleKey: "cab.action.launchBlockers.title",
      reasonKey: "cab.action.launchBlockers.reason",
      priority: "critical",
      urgency: "critical",
      targetSystem: "collection_builder",
      destination: "collectionBuilder",
      when: () => r.collectionLaunchReadiness < 52 && er.blockers.length > 0,
    },
  ];

  const out: CollectionExecutionAction[] = [];
  for (const spec of specs) pushSpec(out, input, spec, t);
  return out
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 8);
}
