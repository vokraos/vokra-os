import { loadVisualProductionQueueFromSession, saveVisualProductionQueueToSession } from "../visual-production/sessionStorage";
import {
  EMPTY_VISUAL_DECISION_SCORES,
  EMPTY_VISUAL_REVIEW_NOTES,
  VISUAL_PRODUCTION_QUEUE_SCHEMA,
  type VisualProductionJob,
  type VisualProductionQueueEnvelope,
} from "../visual-production/types";
import type { HeroFatigueIntelligenceReport } from "./types";

function newJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `vpj-${crypto.randomUUID()}`;
  return `vpj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildJob(report: HeroFatigueIntelligenceReport, corridor: string): VisualProductionJob {
  const now = Date.now();
  const mp = report.marketplace === "ozon" || report.marketplace.toLowerCase().includes("ozon") ? "ozon" : "wb";
  const coll = corridor.trim() || "hero_fatigue";
  const prompt = [
    report.lifecycleStageLine,
    report.refreshUrgencyLine,
    ...report.practicalRecommendations.slice(0, 8),
  ]
    .join("\n")
    .slice(0, 4000);
  return {
    id: newJobId(),
    promptPackId: "hero_fatigue_intelligence",
    collectionId: coll.slice(0, 64),
    jobType: "hero_visual",
    title: `Fatigue · ${report.query}`.slice(0, 120),
    prompt,
    negativeConstraints: report.visualBlindnessRiskLine.slice(0, 1200),
    targetTool: "other",
    marketplaceTarget: mp,
    status: "queued",
    priority: 1,
    visualRole: "Hero · fatigue / refresh",
    expectedOutput: report.refreshOpportunitySummary.slice(0, 500),
    qualityCriteria: ["Lifecycle differentiation", "No CTR decay claims", "Manual SERP cues only"],
    riskFlags: [report.visualBlindnessRiskLine.slice(0, 200)],
    createdAt: now,
    updatedAt: now,
    visualReviewNotes: { ...EMPTY_VISUAL_REVIEW_NOTES },
    reviewStatus: "pending",
    decisionScores: { ...EMPTY_VISUAL_DECISION_SCORES },
    approvedUsages: mp === "ozon" ? ["ozon_hero"] : ["wb_hero"],
    promptRewriteSuggested: "",
  };
}

export function appendFatigueIntelligenceVisualJob(report: HeroFatigueIntelligenceReport, corridor: string): void {
  const job = buildJob(report, corridor);
  const existing = loadVisualProductionQueueFromSession();
  const coll = corridor.trim() || "hero_fatigue";
  const now = Date.now();
  if (!existing || !existing.jobs?.length) {
    const env: VisualProductionQueueEnvelope = {
      schema: VISUAL_PRODUCTION_QUEUE_SCHEMA,
      sourcePromptPackId: "hero_fatigue_intelligence",
      sourceCollectionId: coll.slice(0, 64),
      collectionName: "Hero fatigue (manual SERP)",
      jobs: [job],
      updatedAt: now,
    };
    saveVisualProductionQueueToSession(env);
    return;
  }
  saveVisualProductionQueueToSession({ ...existing, jobs: [job, ...existing.jobs], updatedAt: now });
}
