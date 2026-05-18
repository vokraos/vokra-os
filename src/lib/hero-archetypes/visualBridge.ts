import { loadVisualProductionQueueFromSession, saveVisualProductionQueueToSession } from "../visual-production/sessionStorage";
import {
  EMPTY_VISUAL_DECISION_SCORES,
  EMPTY_VISUAL_REVIEW_NOTES,
  VISUAL_PRODUCTION_QUEUE_SCHEMA,
  type VisualProductionJob,
  type VisualProductionQueueEnvelope,
} from "../visual-production/types";
import type { HeroArchetypeIntelligenceReport } from "./types";

function newJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `vpj-${crypto.randomUUID()}`;
  return `vpj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildJob(report: HeroArchetypeIntelligenceReport, corridor: string): VisualProductionJob {
  const now = Date.now();
  const mp = report.marketplace === "ozon" || report.marketplace.toLowerCase().includes("ozon") ? "ozon" : "wb";
  const coll = corridor.trim() || "hero_archetype";
  const prompt = [
    report.vokraPrimaryDirectionLine,
    report.recommendedDirectionLine,
    ...report.practicalRecommendations.slice(0, 6),
  ].join("\n").slice(0, 4000);
  return {
    id: newJobId(),
    promptPackId: "hero_archetype_intelligence",
    collectionId: coll.slice(0, 64),
    jobType: "hero_visual",
    title: `Archetype · ${report.query}`.slice(0, 120),
    prompt,
    negativeConstraints: report.overlapRiskLine.slice(0, 1200),
    targetTool: "other",
    marketplaceTarget: mp,
    status: "queued",
    priority: 1,
    visualRole: "Hero · archetype intelligence",
    expectedOutput: report.saturationSummary.slice(0, 500),
    qualityCriteria: ["VOKRA premium cinematic readability", "Print hierarchy", "No CTR claims in brief"],
    riskFlags: [report.overlapRiskLine.slice(0, 200)],
    createdAt: now,
    updatedAt: now,
    visualReviewNotes: { ...EMPTY_VISUAL_REVIEW_NOTES },
    reviewStatus: "pending",
    decisionScores: { ...EMPTY_VISUAL_DECISION_SCORES },
    approvedUsages: mp === "ozon" ? ["ozon_hero"] : ["wb_hero"],
    promptRewriteSuggested: "",
  };
}

export function appendArchetypeIntelligenceVisualJob(report: HeroArchetypeIntelligenceReport, corridor: string): void {
  const job = buildJob(report, corridor);
  const existing = loadVisualProductionQueueFromSession();
  const coll = corridor.trim() || "hero_archetype";
  const now = Date.now();
  if (!existing || !existing.jobs?.length) {
    const env: VisualProductionQueueEnvelope = {
      schema: VISUAL_PRODUCTION_QUEUE_SCHEMA,
      sourcePromptPackId: "hero_archetype_intelligence",
      sourceCollectionId: coll.slice(0, 64),
      collectionName: "Hero archetypes (manual SERP)",
      jobs: [job],
      updatedAt: now,
    };
    saveVisualProductionQueueToSession(env);
    return;
  }
  saveVisualProductionQueueToSession({ ...existing, jobs: [job, ...existing.jobs], updatedAt: now });
}
