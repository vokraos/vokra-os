/**
 * Phase 16–17 — Visual production planning + selection/review (no image APIs).
 */

export const VISUAL_PRODUCTION_QUEUE_SCHEMA_V1 = "vokra.visualProductionQueue.v1" as const;
export const VISUAL_PRODUCTION_QUEUE_SCHEMA = "vokra.visualProductionQueue.v2" as const;

export type VisualProductionJobType =
  | "hero_visual"
  | "hero_test_variant"
  | "readability_test"
  | "premium_test"
  | "framing_test"
  | "refresh_test"
  | "support_visual"
  | "detail_shot"
  | "reels_concept"
  | "campaign_visual"
  | "exhibition_visual"
  | "corporate_merch_visual"
  | "size_grid_visual";

/** Pipeline / execution status (Phase 16). */
export type VisualProductionJobStatus =
  | "queued"
  | "copied"
  | "generated_externally"
  | "selected"
  | "needs_revision"
  | "rejected"
  | "approved";

export type VisualProductionTargetTool =
  | "grok"
  | "midjourney"
  | "nano_banana"
  | "flux"
  | "ideogram"
  | "kling_veo"
  | "other";

/** Phase 17 — review / decision layer (orthogonal to pipeline status). */
export type VisualReviewStatus =
  | "pending"
  | "generated"
  | "shortlisted"
  | "approved_marketplace"
  | "approved_campaign"
  | "rejected_brand_fit"
  | "rejected_marketplace_clarity"
  | "needs_prompt_rewrite";

export type VisualApprovedUsage =
  | "wb_hero"
  | "ozon_hero"
  | "rich_content"
  | "reels"
  | "exhibition"
  | "corporate_merch"
  | "campaign";

export type VisualReviewNotes = {
  selectedResultNote: string;
  whySelected: string;
  issueFound: string;
  revisionInstruction: string;
  finalUsage: string;
};

/** 1–5 score per axis; null = not rated. */
export type VisualDecisionScores = {
  brandFit: number | null;
  marketplaceClarity: number | null;
  printReadability: number | null;
  premiumPerception: number | null;
  dtfRealism: number | null;
  thumbnailStrength: number | null;
  fatigueRisk: number | null;
};

export const EMPTY_VISUAL_REVIEW_NOTES: VisualReviewNotes = {
  selectedResultNote: "",
  whySelected: "",
  issueFound: "",
  revisionInstruction: "",
  finalUsage: "",
};

export const EMPTY_VISUAL_DECISION_SCORES: VisualDecisionScores = {
  brandFit: null,
  marketplaceClarity: null,
  printReadability: null,
  premiumPerception: null,
  dtfRealism: null,
  thumbnailStrength: null,
  fatigueRisk: null,
};

export type VisualProductionJob = {
  id: string;
  promptPackId: string;
  collectionId: string;
  jobType: VisualProductionJobType;
  title: string;
  prompt: string;
  negativeConstraints: string;
  targetTool: VisualProductionTargetTool;
  marketplaceTarget: string;
  status: VisualProductionJobStatus;
  priority: number;
  visualRole: string;
  expectedOutput: string;
  qualityCriteria: readonly string[];
  riskFlags: readonly string[];
  createdAt: number;
  updatedAt: number;
  /** Phase 17 */
  visualReviewNotes: VisualReviewNotes;
  reviewStatus: VisualReviewStatus;
  decisionScores: VisualDecisionScores;
  approvedUsages: readonly VisualApprovedUsage[];
  promptRewriteSuggested: string;
};

export type VisualProductionQueueEnvelope = {
  schema: typeof VISUAL_PRODUCTION_QUEUE_SCHEMA;
  sourcePromptPackId: string;
  sourceCollectionId: string;
  collectionName: string;
  jobs: VisualProductionJob[];
  updatedAt: number;
};

export const VISUAL_PRODUCTION_SESSION_KEY = "vokra.visualProductionSession.v1";
