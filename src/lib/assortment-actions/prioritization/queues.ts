import type {
  AssortmentAction,
  AssortmentActionCategory,
  AssortmentActionPriority,
  AssortmentActionType,
  AssortmentExpectedOutcome,
  ExecutiveQueueId,
  UrgencyBand,
} from "../types";

export const EXECUTIVE_QUEUE_ORDER: ExecutiveQueueId[] = [
  "quick_wins",
  "high_leverage",
  "safe_scaling",
  "requires_cleanup",
  "risky_expansion",
  "archive_candidates",
];

function priorityPressure(p: AssortmentActionPriority): number {
  if (p === "critical") return 82;
  if (p === "high") return 64;
  if (p === "medium") return 44;
  return 24;
}

function urgencyFromPressure(p: number): UrgencyBand {
  if (p >= 74) return "critical";
  if (p >= 56) return "elevated";
  if (p >= 38) return "medium";
  return "low";
}

function outcomeFor(actionType: AssortmentActionType, category: AssortmentActionCategory): AssortmentExpectedOutcome {
  if (actionType === "improve_seo") return "seo_surface";
  if (
    actionType === "refresh_visual" ||
    actionType === "hero_workflow_step" ||
    actionType === "collection_workflow_step" ||
    actionType === "launch_workflow_step"
  ) {
    if (actionType === "collection_workflow_step" || actionType === "launch_workflow_step") {
      return "growth_option";
    }
    return "visual_readiness";
  }
  if (actionType === "prepare_fbo") return "operational_efficiency";
  if (actionType === "launch_wave" || actionType === "create_collection" || actionType === "promote_hero_candidate") {
    return "growth_option";
  }
  if (actionType === "archive_weak_sku" || category === "risk") return "risk_containment";
  return "structural_clarity";
}

function assignQueues(a: AssortmentAction): ExecutiveQueueId[] {
  const out: ExecutiveQueueId[] = [];
  const t = a.actionType;
  const cat = a.category;

  if (t === "archive_weak_sku") out.push("archive_candidates");

  const cleanupish =
    cat === "fix" ||
    t === "assign_corridor" ||
    t === "fix_data" ||
    (t === "improve_seo" && (a.priority === "high" || a.priority === "critical"));
  if (cleanupish) out.push("requires_cleanup");

  const riskyExpansion =
    (t === "launch_wave" || t === "create_collection" || t === "split_marketplace_group") &&
    (a.operationalRisk >= 50 || t === "split_marketplace_group");
  if (riskyExpansion) out.push("risky_expansion");

  if (
    a.leverageScore >= 68 ||
    t === "hero_workflow_step" ||
    t === "collection_workflow_step" ||
    t === "launch_workflow_step"
  ) {
    out.push("high_leverage");
  }

  if (a.effortScore <= 40 && a.leverageScore >= 38 && a.operationalRisk <= 48) {
    out.push("quick_wins");
  }

  const growthish =
    cat === "growth" ||
    cat === "fbo" ||
    cat === "collection" ||
    t === "promote_hero_candidate" ||
    t === "launch_wave" ||
    t === "create_collection" ||
    t === "prepare_fbo";
  if (
    growthish &&
    a.leverageScore >= 46 &&
    a.operationalRisk <= 44 &&
    a.effortScore <= 60 &&
    !(cat === "fix" && a.priority === "critical")
  ) {
    out.push("safe_scaling");
  }

  const seen = new Set<ExecutiveQueueId>();
  const ordered: ExecutiveQueueId[] = [];
  for (const id of EXECUTIVE_QUEUE_ORDER) {
    if (out.includes(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  return ordered;
}

export function scoreSingleAction(
  a: Omit<
    AssortmentAction,
    | "leverageScore"
    | "effortScore"
    | "operationalRisk"
    | "executionPressure"
    | "confidence"
    | "expectedOutcome"
    | "urgencyBand"
    | "executiveQueues"
    | "priorityReasons"
    | "leverageReasons"
    | "riskReasons"
    | "effortReasons"
    | "trustNote"
  >,
  ctx: {
    leverageScore: number;
    effortScore: number;
    operationalRisk: number;
    maxTouch: number;
  },
): Pick<
  AssortmentAction,
  | "leverageScore"
  | "effortScore"
  | "operationalRisk"
  | "executionPressure"
  | "confidence"
  | "expectedOutcome"
  | "urgencyBand"
  | "executiveQueues"
> {
  const touched = a.affectedSkuIds.length + a.affectedCardIds.length;
  const { leverageScore, effortScore, operationalRisk } = ctx;

  const confidence = Math.round(
    Math.min(100, Math.max(18, 22 + Math.min(touched * 2.2, 38) + (a.corridor ? 14 : 0) + (a.expectedImpact === "high" ? 12 : 0))),
  );

  const executionPressure = Math.round(
    Math.min(
      100,
      priorityPressure(a.priority) * 0.58 + operationalRisk * 0.28 + (a.category === "risk" ? 12 : 0) + (touched < 2 ? -6 : 0),
    ),
  );

  const urgencyBand = urgencyFromPressure(executionPressure);
  const expectedOutcome = outcomeFor(a.actionType, a.category);

  const draft = {
    ...a,
    leverageScore,
    effortScore,
    operationalRisk,
    executionPressure,
    confidence,
    expectedOutcome,
    urgencyBand,
    executiveQueues: [] as ExecutiveQueueId[],
    priorityReasons: [] as string[],
    leverageReasons: [] as string[],
    riskReasons: [] as string[],
    effortReasons: [] as string[],
    trustNote: "aa.trust.noSalesData",
  } as AssortmentAction;

  draft.executiveQueues = assignQueues(draft);

  return {
    leverageScore,
    effortScore,
    operationalRisk,
    executionPressure,
    confidence,
    expectedOutcome,
    urgencyBand,
    executiveQueues: draft.executiveQueues,
  };
}
