import { loadVisualProductionQueueFromSession, saveVisualProductionQueueToSession } from "../visual-production/sessionStorage";
import {
  EMPTY_VISUAL_DECISION_SCORES,
  EMPTY_VISUAL_REVIEW_NOTES,
  VISUAL_PRODUCTION_QUEUE_SCHEMA,
  type VisualProductionJob,
  type VisualProductionQueueEnvelope,
} from "../visual-production/types";
import type { HeroReadabilityIntelligenceReport } from "./types";

function newJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `vpj-${crypto.randomUUID()}`;
  return `vpj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildJob(report: HeroReadabilityIntelligenceReport, corridor: string): VisualProductionJob {
  const now = Date.now();
  const mp = report.marketplace === "ozon" || report.marketplace.toLowerCase().includes("ozon") ? "ozon" : "wb";
  const coll = corridor.trim() || "hero_readability";
  const prompt = [
    report.dominantFieldQualityLine,
    report.readabilityPressureSummary,
    ...report.practicalRecommendations.slice(0, 7),
  ]
    .join("\n")
    .slice(0, 4000);
  return {
    id: newJobId(),
    promptPackId: "hero_readability_intelligence",
    collectionId: coll.slice(0, 64),
    jobType: "hero_visual",
    title: `Readability · ${report.query}`.slice(0, 120),
    prompt,
    negativeConstraints: report.readabilityRiskLine.slice(0, 1200),
    targetTool: "other",
    marketplaceTarget: mp,
    status: "queued",
    priority: 1,
    visualRole: "Hero · readability intelligence",
    expectedOutput: report.mobileClarityLine.slice(0, 500),
    qualityCriteria: ["Thumbnail legibility", "Print hierarchy", "No CTR claims in brief"],
    riskFlags: [report.readabilityRiskLine.slice(0, 200)],
    createdAt: now,
    updatedAt: now,
    visualReviewNotes: { ...EMPTY_VISUAL_REVIEW_NOTES },
    reviewStatus: "pending",
    decisionScores: { ...EMPTY_VISUAL_DECISION_SCORES },
    approvedUsages: mp === "ozon" ? ["ozon_hero"] : ["wb_hero"],
    promptRewriteSuggested: "",
  };
}

export function appendReadabilityIntelligenceVisualJob(report: HeroReadabilityIntelligenceReport, corridor: string): void {
  const job = buildJob(report, corridor);
  const existing = loadVisualProductionQueueFromSession();
  const coll = corridor.trim() || "hero_readability";
  const now = Date.now();
  if (!existing || !existing.jobs?.length) {
    const env: VisualProductionQueueEnvelope = {
      schema: VISUAL_PRODUCTION_QUEUE_SCHEMA,
      sourcePromptPackId: "hero_readability_intelligence",
      sourceCollectionId: coll.slice(0, 64),
      collectionName: "Hero readability (manual SERP)",
      jobs: [job],
      updatedAt: now,
    };
    saveVisualProductionQueueToSession(env);
    return;
  }
  saveVisualProductionQueueToSession({ ...existing, jobs: [job, ...existing.jobs], updatedAt: now });
}
