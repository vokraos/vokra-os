import { loadVisualProductionQueueFromSession, saveVisualProductionQueueToSession } from "../visual-production/sessionStorage";
import {
  EMPTY_VISUAL_DECISION_SCORES,
  EMPTY_VISUAL_REVIEW_NOTES,
  VISUAL_PRODUCTION_QUEUE_SCHEMA,
  type VisualProductionJob,
  type VisualProductionQueueEnvelope,
} from "../visual-production/types";
import type { CompetitiveGapAnalysis } from "./types";
import type { OurCardCompetitiveSnapshot } from "./types";

function newJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `vpj-${crypto.randomUUID()}`;
  return `vpj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildJob(gap: CompetitiveGapAnalysis, our: OurCardCompetitiveSnapshot, corridor: string): VisualProductionJob {
  const now = Date.now();
  const mp = gap.marketplace === "ozon" || gap.marketplace.toLowerCase().includes("ozon") ? "ozon" : "wb";
  const coll = corridor.trim() || "gap_refresh";
  const prompt = `${gap.recommendedChanges.join("\n")}\n\n${gap.visualGap}\n${gap.readabilityGap}`.slice(0, 4000);
  return {
    id: newJobId(),
    promptPackId: "competitive_gap_analysis",
    collectionId: coll.slice(0, 64),
    jobType: "hero_visual",
    title: `Hero gap · ${gap.query}`.slice(0, 120),
    prompt,
    negativeConstraints: gap.riskFlags.join(" · ").slice(0, 1200),
    targetTool: "other",
    marketplaceTarget: mp,
    status: "queued",
    priority: 1,
    visualRole: "Hero · SERP gap refresh",
    expectedOutput: gap.nextActions.join(" · ").slice(0, 500),
    qualityCriteria: ["Thumbnail legible vs pasted field", "Differentiation vs dominant pattern", "No fake CTR copy"],
    riskFlags: [...gap.riskFlags],
    createdAt: now,
    updatedAt: now,
    visualReviewNotes: { ...EMPTY_VISUAL_REVIEW_NOTES },
    reviewStatus: "pending",
    decisionScores: { ...EMPTY_VISUAL_DECISION_SCORES },
    approvedUsages: mp === "ozon" ? ["ozon_hero"] : ["wb_hero"],
    promptRewriteSuggested: our.skuCode ? `SKU: ${our.skuCode}` : "",
  };
}

export function appendGapAnalysisVisualJob(gap: CompetitiveGapAnalysis, our: OurCardCompetitiveSnapshot, corridor: string): void {
  const job = buildJob(gap, our, corridor);
  const existing = loadVisualProductionQueueFromSession();
  const coll = corridor.trim() || "gap_refresh";
  const now = Date.now();

  if (!existing || !existing.jobs?.length) {
    const env: VisualProductionQueueEnvelope = {
      schema: VISUAL_PRODUCTION_QUEUE_SCHEMA,
      sourcePromptPackId: "competitive_gap_analysis",
      sourceCollectionId: coll.slice(0, 64),
      collectionName: "Competitive gap (manual)",
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
