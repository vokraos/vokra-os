/**
 * Project Memory V1 — local-first, API-shaped for backend / Postgres / sync migration.
 * All IDs are opaque strings; relations are ID-based (no nested deep trees in persisted JSON).
 */

export const MEMORY_SCHEMA_VERSION = 1 as const;

/** Source module for a saved text/markdown generation. */
export type GenerationModule =
  | "seo"
  | "rich"
  | "prompts"
  | "prompt_composer"
  | "prompt_pack"
  | "reels"
  | "campaign"
  | "competitor_analysis"
  | "trend_radar"
  | "strategic_command"
  | "temporal_strategy"
  | "execution_planner"
  | "execution_orchestrator"
  | "action_command"
  | "feedback_loop"
  | "brand_evolution"
  | "executive_intelligence"
  | "organism_model"
  | "strategy_evolution"
  | "collection_builder"
  | "visual_strategy"
  | "visual_production"
  | "visual_asset_registry"
  | "card_production"
  | "marketplace_operations"
  | "sku_intelligence"
  | "market_ingestion"
  | "data_import"
  | "entity_fusion"
  | "entity_snapshot"
  | "data_cleanup"
  | "assortment_actions"
  | "competitive_map"
  | "competitor_serp"
  | "hero_improvement_plan"
  | "competitive_gap_analysis"
  | "hero_archetype_intelligence"
  | "hero_readability_intelligence"
  | "hero_fatigue_intelligence"
  | "hero_battle_plan"
  | "hero_test_matrix"
  | "hero_test_results"
  | "hero_launch_package"
  | "hero_post_launch_observation"
  | "hero_command"
  | "launch_operations"
  | "launch_review"
  | "founder_brief"
  | "economic_pressure"
  | "unit_economics"
  | "advertising_pressure"
  | "scaling_safety"
  | "production_pressure"
  | "production_daily_plan"
  | "production_shift_feedback"
  | "daily_war_room"
  | "morning_flow"
  | "evening_close"
  | "real_use_test"
  | "integration_readiness"
  | "fbo_fbs_decision"
  | "corridor_strategy"
  | "market_timing"
  | "control_tower"
  | "os_health_audit"
  | "guided_setup"
  | "operator_brief"
  | "execution_feedback"
  | "release_check"
  | "daily_operations_pilot"
  | "daily_pilot_debrief"
  | "simplification_backlog"
  | "clean_day_mode"
  | "runtime_smoke_test";


/** Full module list for validation / smoke tests (keep in sync with {@link GenerationModule}). */
export const ALL_GENERATION_MODULES: readonly GenerationModule[] = [
  "seo",
  "rich",
  "prompts",
  "prompt_composer",
  "prompt_pack",
  "reels",
  "campaign",
  "competitor_analysis",
  "trend_radar",
  "strategic_command",
  "temporal_strategy",
  "execution_planner",
  "execution_orchestrator",
  "action_command",
  "feedback_loop",
  "brand_evolution",
  "executive_intelligence",
  "organism_model",
  "strategy_evolution",
  "collection_builder",
  "visual_strategy",
  "visual_production",
  "visual_asset_registry",
  "card_production",
  "marketplace_operations",
  "sku_intelligence",
  "market_ingestion",
  "data_import",
  "entity_fusion",
  "entity_snapshot",
  "data_cleanup",
  "assortment_actions",
  "competitive_map",
  "competitor_serp",
  "hero_improvement_plan",
  "competitive_gap_analysis",
  "hero_archetype_intelligence",
  "hero_readability_intelligence",
  "hero_fatigue_intelligence",
  "hero_battle_plan",
  "hero_test_matrix",
  "hero_test_results",
  "hero_launch_package",
  "hero_post_launch_observation",
  "hero_command",
  "launch_operations",
  "launch_review",
  "founder_brief",
  "economic_pressure",
  "unit_economics",
  "advertising_pressure",
  "scaling_safety",
  "production_pressure",
  "production_daily_plan",
  "production_shift_feedback",
  "daily_war_room",
  "morning_flow",
  "evening_close",
  "real_use_test",
  "integration_readiness",
  "fbo_fbs_decision",
  "corridor_strategy",
  "market_timing",
  "control_tower",
  "os_health_audit",
  "guided_setup",
  "operator_brief",
  "execution_feedback",
  "release_check",
  "daily_operations_pilot",
  "daily_pilot_debrief",
  "simplification_backlog",
  "clean_day_mode",
  "runtime_smoke_test",
] as const satisfies readonly GenerationModule[];

export type MemoryMime = "text/markdown" | "text/plain" | "application/json";

/** Saved text output (SEO, Rich, Prompt Lab, Reels, Campaign, etc.). */
export type GenerationRecord = {
  id: string;
  projectId: string;
  skuId: string | null;
  module: GenerationModule;
  title: string;
  content: string;
  mime: MemoryMime;
  previewText: string;
  previewImageDataUrl: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  /** Extensible: form snapshot, model id, token usage — future API fields */
  meta?: Record<string, unknown>;
};

/** Uploaded asset fingerprint (no binary in V1 — URLs / names only; binary stays in analysis JSON if needed). */
export type VisualAssetMeta = {
  kind: string;
  fileName?: string;
  width?: number;
  height?: number;
};

/** Full Visual Intelligence analysis snapshot + UI metadata. */
export type VisualAnalysisRecord = {
  id: string;
  projectId: string;
  skuId: string | null;
  title: string;
  /** Stringified VisualAnalysisResult JSON */
  analysisJson: string;
  schemaVersion: 1 | 2;
  previewText: string;
  previewImageDataUrl: string | null;
  uploadedAssetsMeta: VisualAssetMeta[];
  scoresSummary?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

/** Lightweight SKU — marketplace row anchor for future SKU intelligence. */
export type SkuRecord = {
  id: string;
  projectId: string;
  name: string;
  marketplace: string;
  category: string;
  linkedAssetRefs: string[];
  linkedGenerationIds: string[];
  linkedVisualAnalysisIds: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

/** Workspace / brand capsule — owns ordered memory pointers (not embedded blobs). */
export type ProjectRecord = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailDataUrl: string | null;
  skuIds: string[];
  /** Newest-first generation pointers */
  generationIds: string[];
  /** Newest-first visual analysis pointers */
  visualAnalysisIds: string[];
  createdAt: number;
  updatedAt: number;
};

/**
 * Normalized root document (single localStorage value).
 * Mirrors future tables: projects, skus, generations, visual_analyses.
 */
export type MemorySnapshot = {
  schemaVersion: typeof MEMORY_SCHEMA_VERSION;
  projects: Record<string, ProjectRecord>;
  skus: Record<string, SkuRecord>;
  generations: Record<string, GenerationRecord>;
  visualAnalyses: Record<string, VisualAnalysisRecord>;
};

export type TimelineEntry =
  | { kind: "generation"; id: string; createdAt: number }
  | { kind: "visual"; id: string; createdAt: number };

/** UI filter for timeline / library */
export type MemoryAssetFilter = "all" | "visual" | GenerationModule;
