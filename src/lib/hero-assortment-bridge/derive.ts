import type { NavId } from "../../types";
import { buildHeroCommandSnapshot, gatherHeroWorkflowArtifacts } from "../hero-command";
import type { HeroCommandSnapshot, HeroWorkflowStageId } from "../hero-command/types";
import { stableActionId } from "../assortment-actions/hash";
import type { HeroExecutionAction } from "./types";

type BridgeSpec = {
  stage: HeroWorkflowStageId;
  titleKey: string;
  reasonKey: string;
  priority: HeroExecutionAction["priority"];
  urgency: HeroExecutionAction["urgency"];
  targetSystem: string;
  destination: NavId;
};

const NEXT_TO_SPEC: Record<string, BridgeSpec> = {
  "hc.next.serp": {
    stage: "serp",
    titleKey: "hab.action.serp.title",
    reasonKey: "hab.action.serp.reason",
    priority: "high",
    urgency: "elevated",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
  "hc.next.gap": {
    stage: "gap",
    titleKey: "hab.action.gap.title",
    reasonKey: "hab.action.gap.reason",
    priority: "high",
    urgency: "elevated",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
  "hc.next.archetype": {
    stage: "archetype",
    titleKey: "hab.action.archetype.title",
    reasonKey: "hab.action.archetype.reason",
    priority: "medium",
    urgency: "medium",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
  "hc.next.readability": {
    stage: "readability",
    titleKey: "hab.action.readability.title",
    reasonKey: "hab.action.readability.reason",
    priority: "medium",
    urgency: "medium",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
  "hc.next.fatigue": {
    stage: "fatigue",
    titleKey: "hab.action.fatigue.title",
    reasonKey: "hab.action.fatigue.reason",
    priority: "medium",
    urgency: "medium",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
  "hc.next.battlePlan": {
    stage: "battlePlan",
    titleKey: "hab.action.battlePlan.title",
    reasonKey: "hab.action.battlePlan.reason",
    priority: "high",
    urgency: "elevated",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
  "hc.next.testMatrix": {
    stage: "testMatrix",
    titleKey: "hab.action.testMatrix.title",
    reasonKey: "hab.action.testMatrix.reason",
    priority: "high",
    urgency: "elevated",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
  "hc.next.results": {
    stage: "results",
    titleKey: "hab.action.results.title",
    reasonKey: "hab.action.results.reason",
    priority: "critical",
    urgency: "critical",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
  "hc.next.launchPackage": {
    stage: "launchPackage",
    titleKey: "hab.action.launchPackage.title",
    reasonKey: "hab.action.launchPackage.reason",
    priority: "high",
    urgency: "elevated",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
  "hc.next.observation": {
    stage: "observation",
    titleKey: "hab.action.observation.title",
    reasonKey: "hab.action.observation.reason",
    priority: "medium",
    urgency: "medium",
    targetSystem: "competitive_map",
    destination: "competitiveMap",
  },
};

export function deriveHeroExecutionActionFromCommand(
  snapshot: HeroCommandSnapshot,
  t: (key: string, vars?: Record<string, string>) => string,
): HeroExecutionAction | null {
  if (snapshot.nextStepKey === "hc.next.complete") return null;
  const spec = NEXT_TO_SPEC[snapshot.nextStepKey];
  if (!spec) return null;

  const vars = {
    query: snapshot.query || "—",
    marketplace: snapshot.marketplace || "—",
  };

  const now = Date.now();
  return {
    id: stableActionId(["hero-exec", snapshot.id, spec.stage]),
    sourceHeroCommandSnapshotId: snapshot.id,
    sourceStage: spec.stage,
    title: t(spec.titleKey, vars),
    reason: t(spec.reasonKey, vars),
    priority: spec.priority,
    urgency: spec.urgency,
    targetSystem: spec.targetSystem,
    suggestedDestination: spec.destination,
    linkedQuery: snapshot.query,
    marketplace: snapshot.marketplace,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
}

export function deriveHeroExecutionActionFromWorkflow(
  t: (key: string, vars?: Record<string, string>) => string,
): HeroExecutionAction | null {
  const artifacts = gatherHeroWorkflowArtifacts();
  const snap = buildHeroCommandSnapshot(artifacts);
  return deriveHeroExecutionActionFromCommand(snap, t);
}

export function deriveHeroExecutionActionTitleForDaily(
  action: HeroExecutionAction,
): string {
  return action.title;
}
