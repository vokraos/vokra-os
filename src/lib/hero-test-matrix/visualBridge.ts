import { loadVisualProductionQueueFromSession, saveVisualProductionQueueToSession } from "../visual-production/sessionStorage";
import {
  EMPTY_VISUAL_DECISION_SCORES,
  EMPTY_VISUAL_REVIEW_NOTES,
  VISUAL_PRODUCTION_QUEUE_SCHEMA,
  type VisualProductionJob,
  type VisualProductionJobType,
  type VisualProductionQueueEnvelope,
} from "../visual-production/types";
import type { HeroTestMatrix, HeroTestVariant } from "./types";

function newJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `vpj-${crypto.randomUUID()}`;
  return `vpj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const JOB_TYPE_BY_KIND: Record<HeroTestVariant["visualJobKind"], VisualProductionJobType> = {
  hero_test_variant: "hero_test_variant",
  readability_test: "readability_test",
  premium_test: "premium_test",
  framing_test: "framing_test",
  refresh_test: "refresh_test",
};

function buildVariantJob(matrix: HeroTestMatrix, variant: HeroTestVariant, corridor: string): VisualProductionJob {
  const now = Date.now();
  const mp = matrix.marketplace === "ozon" || matrix.marketplace.toLowerCase().includes("ozon") ? "ozon" : "wb";
  const coll = corridor.trim() || "hero_test_matrix";
  const prompt = [
    `Hero test · ${variant.variantName}`,
    `Hypothesis: ${variant.hypothesis}`,
    `Changed variable(s): ${variant.changedVariable}`,
    `Visual: ${variant.visualDirection}`,
    `Readability goal: ${variant.readabilityGoal}`,
    `Archetype: ${variant.archetypeDirection}`,
    `Baseline: ${matrix.baselineHeroDirection}`,
  ]
    .join("\n")
    .slice(0, 4000);

  return {
    id: newJobId(),
    promptPackId: variant.visualJobKind,
    collectionId: coll.slice(0, 64),
    jobType: JOB_TYPE_BY_KIND[variant.visualJobKind],
    title: `${variant.variantName} · ${matrix.query}`.slice(0, 120),
    prompt,
    negativeConstraints: [...variant.dangerZones, ...matrix.riskNotes].join(" · ").slice(0, 1200),
    targetTool: "other",
    marketplaceTarget: mp,
    status: "queued",
    priority: 1,
    visualRole: `Hero test · ${variant.changedVariable}`,
    expectedOutput: variant.hypothesis.slice(0, 500),
    qualityCriteria: [
      "Controlled variable test only",
      "Manual SERP + matrix plan",
      "No CTR or A/B claims",
      variant.readabilityGoal.slice(0, 120),
    ],
    riskFlags: variant.dangerZones.slice(0, 6),
    createdAt: now,
    updatedAt: now,
    visualReviewNotes: { ...EMPTY_VISUAL_REVIEW_NOTES },
    reviewStatus: "pending",
    decisionScores: { ...EMPTY_VISUAL_DECISION_SCORES },
    approvedUsages: mp === "ozon" ? ["ozon_hero"] : ["wb_hero"],
    promptRewriteSuggested: "",
  };
}

function appendJob(job: VisualProductionJob, coll: string): void {
  const existing = loadVisualProductionQueueFromSession();
  const now = Date.now();
  if (!existing?.jobs?.length) {
    const env: VisualProductionQueueEnvelope = {
      schema: VISUAL_PRODUCTION_QUEUE_SCHEMA,
      sourcePromptPackId: job.promptPackId,
      sourceCollectionId: coll.slice(0, 64),
      collectionName: "Hero test matrix",
      jobs: [job],
      updatedAt: now,
    };
    saveVisualProductionQueueToSession(env);
    return;
  }
  saveVisualProductionQueueToSession({ ...existing, jobs: [job, ...existing.jobs], updatedAt: now });
}

export function appendTestMatrixVariantVisualJob(matrix: HeroTestMatrix, variant: HeroTestVariant, corridor: string): void {
  const coll = corridor.trim() || "hero_test_matrix";
  appendJob(buildVariantJob(matrix, variant, corridor), coll);
}

export function appendTestMatrixAllVisualJobs(matrix: HeroTestMatrix, corridor: string): number {
  let n = 0;
  for (const v of matrix.testVariants) {
    appendTestMatrixVariantVisualJob(matrix, v, corridor);
    n += 1;
  }
  return n;
}
