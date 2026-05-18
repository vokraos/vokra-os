import { loadVisualProductionQueueFromSession, saveVisualProductionQueueToSession } from "../visual-production/sessionStorage";
import {
  EMPTY_VISUAL_DECISION_SCORES,
  EMPTY_VISUAL_REVIEW_NOTES,
  VISUAL_PRODUCTION_QUEUE_SCHEMA,
  type VisualProductionJob,
  type VisualProductionQueueEnvelope,
} from "../visual-production/types";
import type { HeroBattlePlan } from "./types";

function newJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `vpj-${crypto.randomUUID()}`;
  return `vpj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildJob(plan: HeroBattlePlan, corridor: string): VisualProductionJob {
  const now = Date.now();
  const mp = plan.marketplace === "ozon" || plan.marketplace.toLowerCase().includes("ozon") ? "ozon" : "wb";
  const coll = corridor.trim() || "hero_battle_plan";
  const prompt = [plan.refreshStrategy, plan.promptDirection, ...plan.nextActions.slice(0, 6)].join("\n").slice(0, 4000);
  return {
    id: newJobId(),
    promptPackId: "hero_battle_plan",
    collectionId: coll.slice(0, 64),
    jobType: "hero_visual",
    title: `Battle plan · ${plan.query}`.slice(0, 120),
    prompt,
    negativeConstraints: plan.negativeConstraints.slice(0, 1200),
    targetTool: "other",
    marketplaceTarget: mp,
    status: "queued",
    priority: 1,
    visualRole: "Hero · battle plan",
    expectedOutput: plan.biggestWeakness.slice(0, 500),
    qualityCriteria: ["Follow battle plan", "Manual SERP cues only", "No CTR claims"],
    riskFlags: plan.riskFlags.slice(0, 6),
    createdAt: now,
    updatedAt: now,
    visualReviewNotes: { ...EMPTY_VISUAL_REVIEW_NOTES },
    reviewStatus: "pending",
    decisionScores: { ...EMPTY_VISUAL_DECISION_SCORES },
    approvedUsages: mp === "ozon" ? ["ozon_hero"] : ["wb_hero"],
    promptRewriteSuggested: "",
  };
}

export function appendBattlePlanVisualJob(plan: HeroBattlePlan, corridor: string): void {
  const job = buildJob(plan, corridor);
  const existing = loadVisualProductionQueueFromSession();
  const coll = corridor.trim() || "hero_battle_plan";
  const now = Date.now();
  if (!existing || !existing.jobs?.length) {
    const env: VisualProductionQueueEnvelope = {
      schema: VISUAL_PRODUCTION_QUEUE_SCHEMA,
      sourcePromptPackId: "hero_battle_plan",
      sourceCollectionId: coll.slice(0, 64),
      collectionName: "Hero battle plan",
      jobs: [job],
      updatedAt: now,
    };
    saveVisualProductionQueueToSession(env);
    return;
  }
  saveVisualProductionQueueToSession({ ...existing, jobs: [job, ...existing.jobs], updatedAt: now });
}
