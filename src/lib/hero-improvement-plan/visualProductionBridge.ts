import { loadVisualProductionQueueFromSession, saveVisualProductionQueueToSession } from "../visual-production/sessionStorage";
import {
  EMPTY_VISUAL_DECISION_SCORES,
  EMPTY_VISUAL_REVIEW_NOTES,
  VISUAL_PRODUCTION_QUEUE_SCHEMA,
  type VisualProductionJob,
  type VisualProductionQueueEnvelope,
} from "../visual-production/types";
import type { CompetitiveHeroImprovementPlan } from "./types";

function newJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `vpj-${crypto.randomUUID()}`;
  return `vpj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildJob(plan: CompetitiveHeroImprovementPlan): VisualProductionJob {
  const now = Date.now();
  const mp = plan.marketplace === "ozon" || plan.marketplace.includes("ozon") ? "ozon" : "wb";
  const coll = plan.corridor.trim() || "hero_plan";
  return {
    id: newJobId(),
    promptPackId: "hero_improvement_plan",
    collectionId: coll.slice(0, 64),
    jobType: "hero_visual",
    title: `Hero (SERP) · ${plan.query}`.slice(0, 120),
    prompt: `${plan.promptDirection}\n\n${plan.recommendedHeroDirection}`.slice(0, 4000),
    negativeConstraints: plan.negativeConstraints.slice(0, 1200),
    targetTool: "other",
    marketplaceTarget: mp,
    status: "queued",
    priority: 1,
    visualRole: "Hero · manual SERP plan",
    expectedOutput: plan.expectedEffect.slice(0, 500),
    qualityCriteria: ["Thumbnail legible print", "Premium shelf signal", "Marketplace-safe contrast"],
    riskFlags: [...plan.riskFlags],
    createdAt: now,
    updatedAt: now,
    visualReviewNotes: { ...EMPTY_VISUAL_REVIEW_NOTES },
    reviewStatus: "pending",
    decisionScores: { ...EMPTY_VISUAL_DECISION_SCORES },
    approvedUsages: mp === "ozon" ? ["ozon_hero"] : ["wb_hero"],
    promptRewriteSuggested: "",
  };
}

export function appendHeroImprovementPlanVisualJob(plan: CompetitiveHeroImprovementPlan): void {
  const job = buildJob(plan);
  const existing = loadVisualProductionQueueFromSession();
  const coll = plan.corridor.trim() || "hero_plan";
  const now = Date.now();

  if (!existing || !existing.jobs?.length) {
    const env: VisualProductionQueueEnvelope = {
      schema: VISUAL_PRODUCTION_QUEUE_SCHEMA,
      sourcePromptPackId: "hero_improvement_plan",
      sourceCollectionId: coll.slice(0, 64),
      collectionName: "Hero improvement (manual SERP)",
      jobs: [job],
      updatedAt: now,
    };
    saveVisualProductionQueueToSession(env);
    return;
  }

  saveVisualProductionQueueToSession({
    ...existing,
    jobs: [job, ...existing.jobs],
    updatedAt: now,
  });
}
