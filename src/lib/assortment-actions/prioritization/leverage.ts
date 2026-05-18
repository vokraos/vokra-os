import type { SnapshotIntelligence } from "../../entity-snapshot/intelligence";
import type { AssortmentActionType } from "../types";

export function corridorTotalFor(intel: SnapshotIntelligence, corridor?: string): number {
  if (!corridor) return 0;
  const row = intel.corridorSummary.find((r) => r.corridor === corridor);
  return row?.total ?? 0;
}

/** Intrinsic “structural upside” of the action type (0–100 scale seed). */
export function typeLeverageSeed(actionType: AssortmentActionType): number {
  const m: Record<AssortmentActionType, number> = {
    create_collection: 88,
    launch_wave: 86,
    prepare_fbo: 82,
    promote_hero_candidate: 78,
    split_marketplace_group: 74,
    improve_seo: 70,
    assign_corridor: 64,
    fix_data: 52,
    refresh_visual: 48,
    archive_weak_sku: 40,
    hero_workflow_step: 76,
    collection_workflow_step: 74,
    launch_workflow_step: 72,
  };
  return m[actionType] ?? 50;
}

export function computeLeverageScore(
  intel: SnapshotIntelligence,
  args: {
    actionType: AssortmentActionType;
    corridor?: string;
    touched: number;
    maxTouch: number;
  },
): number {
  const { actionType, corridor, touched, maxTouch } = args;
  const seed = typeLeverageSeed(actionType);
  const maxCor = Math.max(1, intel.corridorSummary[0]?.total ?? 1);
  const corTot = corridorTotalFor(intel, corridor);
  const corridorFactor = Math.min(100, (corTot / maxCor) * 100);
  const touchFactor = Math.min(100, (touched / maxTouch) * 100);
  const raw = seed * 0.48 + corridorFactor * 0.32 + touchFactor * 0.2;
  return Math.round(Math.min(100, Math.max(8, raw)));
}
