import type { SnapshotIntelligence } from "../../entity-snapshot/intelligence";
import type { AssortmentActionType, AssortmentImpactLevel } from "../types";

function difficultyEffort(d: AssortmentImpactLevel): number {
  if (d === "high") return 78;
  if (d === "medium") return 48;
  return 28;
}

function typeEffortSeed(actionType: AssortmentActionType): number {
  const m: Record<AssortmentActionType, number> = {
    split_marketplace_group: 86,
    prepare_fbo: 72,
    launch_wave: 68,
    create_collection: 66,
    archive_weak_sku: 58,
    fix_data: 62,
    assign_corridor: 54,
    improve_seo: 44,
    refresh_visual: 56,
    promote_hero_candidate: 50,
    hero_workflow_step: 42,
    collection_workflow_step: 44,
    launch_workflow_step: 46,
  };
  return m[actionType] ?? 52;
}

export function corridorIsMixedFbo(intel: SnapshotIntelligence, corridor?: string): boolean {
  if (!corridor) return false;
  return intel.fboExposureSummary.mixedCorridors.some(
    (m) => m.corridor === corridor && m.hasFbo && m.hasFbs,
  );
}

export function computeEffortScore(args: {
  actionType: AssortmentActionType;
  difficulty: AssortmentImpactLevel;
  touched: number;
  maxTouch: number;
  mixedFboCorridor: boolean;
}): number {
  const { actionType, difficulty, touched, maxTouch, mixedFboCorridor } = args;
  const base = typeEffortSeed(actionType) * 0.55 + difficultyEffort(difficulty) * 0.45;
  const breadth = Math.min(100, (touched / Math.max(1, maxTouch)) * 90);
  const mixedBump = mixedFboCorridor ? 14 : 0;
  const raw = base * 0.62 + breadth * 0.38 + mixedBump;
  return Math.round(Math.min(100, Math.max(10, raw)));
}
