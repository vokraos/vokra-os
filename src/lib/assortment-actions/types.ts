import type { NavId } from "../../types";

export const ASSORTMENT_ACTIONS_EVENT = "vokra-assortment-actions" as const;

export const ASSORTMENT_ACTIONS_MEMORY_SCHEMA = "vokra.assortmentActionsMemory.v1" as const;

export const ASSORTMENT_ACTION_STATUS_STORAGE_KEY = "vokra.assortmentActions.statuses.v1" as const;

export const ASSORTMENT_CHECKLIST_STORAGE_KEY = "vokra.assortmentChecklist.v1" as const;

/** Lightweight local learning from execution patterns (no ML, no backend). */
export const ASSORTMENT_EXECUTION_LEARNING_STORAGE_KEY = "vokra.assortmentExecutionLearning.v1" as const;

export const ASSORTMENT_HYDRATE_SESSION_KEY = "vokra.assortmentActions.hydrate.v1" as const;

export type AssortmentActionType =
  | "fix_data"
  | "assign_corridor"
  | "improve_seo"
  | "refresh_visual"
  | "prepare_fbo"
  | "create_collection"
  | "launch_wave"
  | "archive_weak_sku"
  | "promote_hero_candidate"
  | "split_marketplace_group"
  | "hero_workflow_step"
  | "collection_workflow_step"
  | "launch_workflow_step";

export type AssortmentLearningSignalType =
  | "repeated_blocker"
  | "fast_completion"
  | "repeated_deferral"
  | "stale_carry"
  | "overplanned_section"
  | "low_confidence_action"
  | "cleanup_bottleneck"
  | "high_effort_drag";

export type AssortmentExecutionLearningSignal = {
  id: string;
  sourceSnapshotId: string;
  actionType: AssortmentActionType;
  signalType: AssortmentLearningSignalType;
  /** i18n key for short headline. */
  title: string;
  /** i18n key for one-line explanation. */
  reason: string;
  recurrenceCount: number;
  affectedActionIds: string[];
  /** i18n key — suggested bias for future plans. */
  recommendedAdjustment: string;
  /** 0–100 heuristic confidence (not statistical). */
  confidence: number;
  createdAt: number;
  /** Optional vars for `title` / `reason` templates. */
  titleVars?: Record<string, string>;
  reasonVars?: Record<string, string>;
};

export type AssortmentActionStatus = "new" | "accepted" | "in_progress" | "done" | "deferred" | "rejected";

export type AssortmentActionCategory = "fix" | "growth" | "risk" | "visual" | "fbo" | "collection";

export type AssortmentActionPriority = "critical" | "high" | "medium" | "low";

export type AssortmentImpactLevel = "low" | "medium" | "high";

/** Structural / operational signal — not revenue. */
export type UrgencyBand = "low" | "medium" | "elevated" | "critical";

export type AssortmentExpectedOutcome =
  | "structural_clarity"
  | "seo_surface"
  | "operational_efficiency"
  | "growth_option"
  | "risk_containment"
  | "visual_readiness";

export type ExecutiveQueueId =
  | "quick_wins"
  | "high_leverage"
  | "safe_scaling"
  | "requires_cleanup"
  | "risky_expansion"
  | "archive_candidates";

export type AssortmentAction = {
  id: string;
  sourceSnapshotId: string;
  actionType: AssortmentActionType;
  category: AssortmentActionCategory;
  titleKey: string;
  reasonKey: string;
  titleVars: Record<string, string>;
  reasonVars: Record<string, string>;
  affectedSkuIds: string[];
  affectedCardIds: string[];
  corridor?: string;
  marketplace?: string;
  priority: AssortmentActionPriority;
  expectedImpact: AssortmentImpactLevel;
  difficulty: AssortmentImpactLevel;
  ownerSystem: string;
  suggestedDestination: NavId;
  status: AssortmentActionStatus;
  createdAt: number;
  /** 0–100: breadth × corridor mass × action-type leverage (heuristic). */
  leverageScore: number;
  /** 0–100: operational difficulty to execute locally. */
  effortScore: number;
  /** 0–100: ambiguity / duplication / ownership gaps. */
  operationalRisk: number;
  /** 0–100: how pressing to act (structure + risk), not sales. */
  executionPressure: number;
  /** 0–100: confidence in the signal from imported coverage. */
  confidence: number;
  expectedOutcome: AssortmentExpectedOutcome;
  urgencyBand: UrgencyBand;
  executiveQueues: ExecutiveQueueId[];
  /** i18n keys — use `formatAssortmentReasonLine` / `explainLineVars` for text. */
  priorityReasons: string[];
  leverageReasons: string[];
  riskReasons: string[];
  effortReasons: string[];
  /** i18n key for trust / limits disclaimer. */
  trustNote: string;
  /** From Hero Command → Assortment bridge (Phase 53). */
  heroDerived?: boolean;
  heroSourceStage?: string;
  heroCommandSnapshotId?: string;
  collectionDerived?: boolean;
  collectionSourceStage?: string;
  collectionId?: string;
  collectionName?: string;
  launchDerived?: boolean;
  launchPlanId?: string;
  launchSourceStage?: string;
  /** Economic guardrail: soft-hold in execution plan (not a hard block). */
  guardrailHold?: boolean;
  guardrailBadgeKey?: string;
  guardrailSeverity?: "observe" | "caution" | "elevated" | "critical";
  guardrailTypes?: string[];
  /** Scaling safety: soft-hold expansion when mode forbids scaling (not a hard block). */
  scalingSafetyHold?: boolean;
  scalingSafetyBadgeKey?: string;
  scalingSafetyMode?: string;
  /** Production pressure: soft-hold expansion when overloaded (not hard block). */
  productionPressureHold?: boolean;
  productionPressureBadgeKey?: string;
  productionPressureState?: string;
  productionShiftScenarioType?: string;
  /** FBO/FBS decision: soft-hold prepare_fbo when stop/cleanup (not hard block). */
  fboFbsDecisionHold?: boolean;
  fboFbsBadgeKey?: string;
  fboFbsMode?: string;
  corridorStrategyHold?: boolean;
  corridorStrategyBadgeKey?: string;
  corridorStrategyKey?: string;
  marketTimingHold?: boolean;
  marketTimingBadgeKey?: string;
  marketTimingState?: string;
};

export type AssortmentPriorityDigest = {
  queueCounts: Record<ExecutiveQueueId, number>;
  urgencyCounts: Record<UrgencyBand, number>;
  topRecommendedActionId: string | null;
  safestLaunchCorridor: string | null;
  highestLeverageCorridor: string | null;
  highestDragCorridor: string | null;
};

/** Execution buckets derived from prioritized assortment actions (not a task system). */
export type AssortmentExecutionPlan = {
  id: string;
  sourceSnapshotId: string;
  createdAt: number;
  todayActions: AssortmentAction[];
  weekActions: AssortmentAction[];
  laterActions: AssortmentAction[];
  holdActions: AssortmentAction[];
  /** i18n key — dominant “focus” inferred from today’s mix. */
  estimatedFocus: string;
  /** i18n key — structural bottleneck signal. */
  bottleneck: string;
  /** i18n key — overall plan outcome framing (import-driven). */
  expectedOutcome: string;
  /** i18n keys — plan-level cautions. */
  warnings: string[];
  /** Action ids moved by carry-forward rules from checklist (blocked / deferred / stale). */
  carriedForwardActionIds: string[];
  /** Blocked again vs last plan’s blocked set — surfaced for visibility. */
  repeatedBlockers: string[];
  /** Completion rate (0–100) from the previous plan build; null on first run. */
  previousCompletionRate: number | null;
  /** i18n keys — continuity / carry friction (separate from structural plan warnings). */
  continuityWarnings: string[];
  /** i18n key — dominant carry strategy label. */
  carryStrategy: string;
};

export type AssortmentPlanChecklistSection = "today" | "week" | "later" | "hold";

export type AssortmentChecklistItemStatus = "todo" | "started" | "done" | "deferred" | "blocked";

/** Checklist row derived from a plan action; persisted locally by sourceActionId. */
export type AssortmentChecklistItem = {
  id: string;
  sourceActionId: string;
  sourceSnapshotId: string;
  title: string;
  section: AssortmentPlanChecklistSection;
  status: AssortmentChecklistItemStatus;
  reason: string;
  expectedOutcome: AssortmentExpectedOutcome;
  ownerHint: string;
  createdAt: number;
  updatedAt: number;
  /** Source action left the current execution plan buckets. */
  stale?: boolean;
};

/** Post-checklist discipline summary — not analytics. */
export type AssortmentExecutionReview = {
  sourceSnapshotId: string;
  createdAt: number;
  doneItems: AssortmentChecklistItem[];
  blockedItems: AssortmentChecklistItem[];
  deferredItems: AssortmentChecklistItem[];
  staleItems: AssortmentChecklistItem[];
  /** 0–100: share of current plan rows marked done in checklist. */
  completionRate: number;
  /** i18n key for one-line blocker / carry readout. */
  blockerSummaryKey: string;
  blockerSummaryVars: Record<string, string>;
  /** i18n keys — next plan suggestions. */
  nextPlanSuggestions: string[];
  /** i18n keys — discipline notes. */
  learningNotes: string[];
  /** i18n key — same family as `AssortmentExecutionPlan.estimatedFocus`. */
  nextSuggestedFocusKey: string;
};

/** Top actions called out on the executive report (not full plan export). */
export type AssortmentExecutiveReportTopAction = {
  id: string;
  title: string;
  bucket: AssortmentPlanChecklistSection | "other";
};

/** Compact execution report for operators / founders (no analytics backend). */
export type AssortmentExecutiveReport = {
  id: string;
  sourceSnapshotId: string;
  createdAt: number;
  /** Snapshot scope — row counts, no sales claims. */
  snapshotSummary: string;
  /** What the plan proposed (counts + focus). */
  planSummary: string;
  /** Checklist outcomes when checklist exists. */
  executionSummary: string;
  /** Blockers / friction line. */
  blockerSummary: string;
  /** Carry-forward and continuity. */
  carryForwardSummary: string;
  /** Condensed learning signal headlines. */
  learningSummary: string;
  /** Suggested next focus (import-driven). */
  nextFocus: string;
  topActions: AssortmentExecutiveReportTopAction[];
  /** Resolved plan + continuity warnings. */
  warnings: string[];
  /** Trust / limits — not revenue. */
  confidenceNote: string;
};

export type AssortmentActionsMemoryPayload = {
  schema: typeof ASSORTMENT_ACTIONS_MEMORY_SCHEMA;
  sourceSnapshotId: string;
  actions: AssortmentAction[];
  statuses: Record<string, AssortmentActionStatus>;
  summary: {
    total: number;
    newCount: number;
    criticalNew: number;
    quickWinNew?: number;
  };
  priorityDigest?: AssortmentPriorityDigest | null;
  /** Snapshot of plan at save time (UI always rebuilds from live actions). */
  executionPlan?: AssortmentExecutionPlan | null;
  /** Checklist rows and statuses at save time (restored with reopen). */
  checklistItems?: AssortmentChecklistItem[];
  /** Snapshot of execution review at save (UI rebuilds from live checklist + plan). */
  executionReview?: AssortmentExecutionReview | null;
  /** Top learning signals at save (merged in local store on reopen). */
  learningSignals?: AssortmentExecutionLearningSignal[];
  /** One-page executive report at save (human-readable, current locale). */
  executiveReport?: AssortmentExecutiveReport | null;
  /** Hero Command execution bridge rows at save time. */
  heroExecutionActions?: import("../hero-assortment-bridge/types").HeroExecutionAction[];
  collectionExecutionActions?: import("../collection-assortment-bridge/types").CollectionExecutionAction[];
  launchExecutionActions?: import("../launch-ops/types").LaunchExecutionAction[];
  savedAt: number;
};
