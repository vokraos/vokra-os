import type { NavId } from "../../types";
import { ASSORTMENT_ECON_PLACEHOLDER, enrichAssortmentActions } from "../assortment-actions/prioritization";
import type { AssortmentAction, AssortmentActionStatus } from "../assortment-actions/types";
import type { EntitySnapshot } from "../entity-snapshot/types";
import type { HeroExecutionAction, HeroExecutionActionStatus } from "./types";

/** Synthetic touch target so hero rows participate in assortment scoring. */
export const HERO_WORKFLOW_TOUCH_ID = "__hero_workflow__" as const;

function mapHeroStatus(s: HeroExecutionActionStatus): AssortmentActionStatus {
  if (s === "blocked") return "deferred";
  if (s === "accepted") return "accepted";
  return s;
}

function heroToAssortmentCore(
  snapshotId: string,
  hero: HeroExecutionAction,
): Omit<
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
> {
  const titleKey = "hab.assortment.title";
  const reasonKey = "hab.assortment.reason";
  return {
    id: hero.id,
    sourceSnapshotId: snapshotId,
    actionType: "hero_workflow_step",
    category: "visual",
    titleKey,
    reasonKey,
    titleVars: { title: hero.title, query: hero.linkedQuery || "—" },
    reasonVars: { reason: hero.reason, marketplace: hero.marketplace || "—" },
    affectedSkuIds: [HERO_WORKFLOW_TOUCH_ID],
    affectedCardIds: [],
    corridor: hero.linkedQuery || undefined,
    marketplace: hero.marketplace || undefined,
    priority: hero.priority,
    expectedImpact: "high",
    difficulty: "medium",
    ownerSystem: hero.targetSystem,
    suggestedDestination: hero.suggestedDestination as NavId,
    status: mapHeroStatus(hero.status),
    createdAt: hero.createdAt,
    heroDerived: true,
    heroSourceStage: hero.sourceStage,
    heroCommandSnapshotId: hero.sourceHeroCommandSnapshotId,
  };
}

export function heroExecutionActionsToAssortmentActions(
  snapshot: EntitySnapshot,
  heroes: HeroExecutionAction[],
): AssortmentAction[] {
  if (heroes.length === 0) return [];
  const partial = heroes.map((h) => ({
    ...heroToAssortmentCore(snapshot.id, h),
    ...ASSORTMENT_ECON_PLACEHOLDER,
  })) as AssortmentAction[];
  return enrichAssortmentActions(snapshot, partial);
}

export function mergeHeroExecutionIntoAssortmentActions(
  snapshot: EntitySnapshot,
  base: AssortmentAction[],
  heroes: HeroExecutionAction[],
): AssortmentAction[] {
  const heroRows = heroExecutionActionsToAssortmentActions(snapshot, heroes);
  const heroIds = new Set(heroRows.map((h) => h.id));
  const rest = base.filter((a) => !heroIds.has(a.id) && !a.heroDerived);
  return [...heroRows, ...rest];
}
