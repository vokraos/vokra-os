import {
  EMPTY_VISUAL_DECISION_SCORES,
  EMPTY_VISUAL_REVIEW_NOTES,
  VISUAL_PRODUCTION_QUEUE_SCHEMA,
  VISUAL_PRODUCTION_QUEUE_SCHEMA_V1,
  type VisualApprovedUsage,
  type VisualDecisionScores,
  type VisualProductionJob,
  type VisualProductionJobStatus,
  type VisualProductionJobType,
  type VisualProductionQueueEnvelope,
  type VisualProductionTargetTool,
  type VisualReviewNotes,
  type VisualReviewStatus,
} from "./types";

const SCHEMAS: ReadonlySet<string> = new Set([VISUAL_PRODUCTION_QUEUE_SCHEMA_V1, VISUAL_PRODUCTION_QUEUE_SCHEMA]);

const JOB_TYPES: ReadonlySet<string> = new Set<VisualProductionJobType>([
  "hero_visual",
  "hero_test_variant",
  "readability_test",
  "premium_test",
  "framing_test",
  "refresh_test",
  "support_visual",
  "detail_shot",
  "reels_concept",
  "campaign_visual",
  "exhibition_visual",
  "corporate_merch_visual",
  "size_grid_visual",
]);

const STATUSES: ReadonlySet<string> = new Set<VisualProductionJobStatus>([
  "queued",
  "copied",
  "generated_externally",
  "selected",
  "needs_revision",
  "rejected",
  "approved",
]);

const TOOLS: ReadonlySet<string> = new Set<VisualProductionTargetTool>([
  "grok",
  "midjourney",
  "nano_banana",
  "flux",
  "ideogram",
  "kling_veo",
  "other",
]);

const REVIEW_STATUSES: ReadonlySet<string> = new Set<VisualReviewStatus>([
  "pending",
  "generated",
  "shortlisted",
  "approved_marketplace",
  "approved_campaign",
  "rejected_brand_fit",
  "rejected_marketplace_clarity",
  "needs_prompt_rewrite",
]);

const APPROVED_USAGE: ReadonlySet<string> = new Set<VisualApprovedUsage>([
  "wb_hero",
  "ozon_hero",
  "rich_content",
  "reels",
  "exhibition",
  "corporate_merch",
  "campaign",
]);

function coerceScore(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const r = Math.round(v);
  if (r < 1 || r > 5) return null;
  return r;
}

function parseDecisionScores(o: unknown): VisualDecisionScores {
  if (typeof o !== "object" || o === null) return { ...EMPTY_VISUAL_DECISION_SCORES };
  const r = o as Record<string, unknown>;
  return {
    brandFit: coerceScore(r.brandFit),
    marketplaceClarity: coerceScore(r.marketplaceClarity),
    printReadability: coerceScore(r.printReadability),
    premiumPerception: coerceScore(r.premiumPerception),
    dtfRealism: coerceScore(r.dtfRealism),
    thumbnailStrength: coerceScore(r.thumbnailStrength),
    fatigueRisk: coerceScore(r.fatigueRisk),
  };
}

function parseReviewNotes(o: unknown): VisualReviewNotes {
  if (typeof o !== "object" || o === null) return { ...EMPTY_VISUAL_REVIEW_NOTES };
  const r = o as Record<string, unknown>;
  const s = (key: string) => (typeof r[key] === "string" ? (r[key] as string) : "");
  return {
    selectedResultNote: s("selectedResultNote"),
    whySelected: s("whySelected"),
    issueFound: s("issueFound"),
    revisionInstruction: s("revisionInstruction"),
    finalUsage: s("finalUsage"),
  };
}

function parseReviewStatus(v: unknown): VisualReviewStatus {
  if (typeof v !== "string" || !REVIEW_STATUSES.has(v)) return "pending";
  return v as VisualReviewStatus;
}

function parseApprovedUsages(v: unknown): VisualApprovedUsage[] {
  if (!Array.isArray(v)) return [];
  const out: VisualApprovedUsage[] = [];
  for (const x of v) {
    if (typeof x === "string" && APPROVED_USAGE.has(x)) out.push(x as VisualApprovedUsage);
  }
  return out;
}

function isCoreJob(x: unknown): x is Record<string, unknown> {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim()) return false;
  if (typeof o.promptPackId !== "string") return false;
  if (typeof o.collectionId !== "string") return false;
  if (typeof o.jobType !== "string" || !JOB_TYPES.has(o.jobType)) return false;
  if (typeof o.title !== "string" || !o.title.trim()) return false;
  if (typeof o.prompt !== "string") return false;
  if (typeof o.negativeConstraints !== "string") return false;
  if (typeof o.targetTool !== "string" || !TOOLS.has(o.targetTool)) return false;
  if (typeof o.marketplaceTarget !== "string") return false;
  if (typeof o.status !== "string" || !STATUSES.has(o.status)) return false;
  if (typeof o.priority !== "number" || !Number.isFinite(o.priority)) return false;
  if (typeof o.visualRole !== "string") return false;
  if (typeof o.expectedOutput !== "string") return false;
  if (!Array.isArray(o.qualityCriteria) || !o.qualityCriteria.every((q) => typeof q === "string")) return false;
  if (!Array.isArray(o.riskFlags) || !o.riskFlags.every((q) => typeof q === "string")) return false;
  if (typeof o.createdAt !== "number" || typeof o.updatedAt !== "number") return false;
  return true;
}

function jobFromRecord(o: Record<string, unknown>): VisualProductionJob {
  const scoresIn = parseDecisionScores(o.decisionScores);
  return {
    id: o.id as string,
    promptPackId: o.promptPackId as string,
    collectionId: o.collectionId as string,
    jobType: o.jobType as VisualProductionJobType,
    title: o.title as string,
    prompt: o.prompt as string,
    negativeConstraints: o.negativeConstraints as string,
    targetTool: o.targetTool as VisualProductionTargetTool,
    marketplaceTarget: o.marketplaceTarget as string,
    status: o.status as VisualProductionJobStatus,
    priority: o.priority as number,
    visualRole: o.visualRole as string,
    expectedOutput: o.expectedOutput as string,
    qualityCriteria: o.qualityCriteria as string[],
    riskFlags: o.riskFlags as string[],
    createdAt: o.createdAt as number,
    updatedAt: o.updatedAt as number,
    visualReviewNotes: { ...EMPTY_VISUAL_REVIEW_NOTES, ...parseReviewNotes(o.visualReviewNotes) },
    reviewStatus: parseReviewStatus(o.reviewStatus),
    decisionScores: { ...EMPTY_VISUAL_DECISION_SCORES, ...scoresIn },
    approvedUsages: parseApprovedUsages(o.approvedUsages),
    promptRewriteSuggested: typeof o.promptRewriteSuggested === "string" ? o.promptRewriteSuggested : "",
  };
}

export function parseVisualProductionQueueEnvelope(payload: unknown): VisualProductionQueueEnvelope | null {
  if (payload == null) return null;
  let root: unknown = payload;
  if (typeof payload === "string") {
    try {
      root = JSON.parse(payload) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof root !== "object" || root === null) return null;
  const o = root as Record<string, unknown>;
  if (typeof o.schema !== "string" || !SCHEMAS.has(o.schema)) return null;
  if (typeof o.sourcePromptPackId !== "string" || typeof o.sourceCollectionId !== "string") return null;
  if (typeof o.collectionName !== "string") return null;
  if (!Array.isArray(o.jobs) || o.jobs.length === 0) return null;
  const jobs: VisualProductionJob[] = [];
  for (const j of o.jobs) {
    if (!isCoreJob(j)) return null;
    jobs.push(jobFromRecord(j as Record<string, unknown>));
  }
  return {
    schema: VISUAL_PRODUCTION_QUEUE_SCHEMA,
    sourcePromptPackId: o.sourcePromptPackId,
    sourceCollectionId: o.sourceCollectionId,
    collectionName: o.collectionName,
    jobs,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : Date.now(),
  };
}
