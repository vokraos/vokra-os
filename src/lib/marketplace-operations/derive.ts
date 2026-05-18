import type { CardProductionBoardEnvelope, CardProductionPlan } from "../card-production/types";
import { refreshPlanDerivedFields } from "../card-production/planFromAsset";
import {
  computeUploadReadinessChecks,
  deriveComplianceWarnings,
  uploadReadinessPercent,
} from "../card-production/uploadBrief";
import type { VisualAssetEntity } from "../visual-assets/types";
import type {
  LaunchWaveOperationalEntity,
  LaunchWaveStatus,
  MarketplaceOperationalSnapshot,
  MopsExecutiveScenarioId,
  OperationalReadinessAggregate,
  OpsRiskLevel,
  WavePatch,
} from "./types";

function slug(s: string): string {
  const x = s.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 64);
  return x || "default";
}

export function stableWaveId(collectionId: string, corridor: string, marketplace: string): string {
  return `lw-${slug(collectionId)}-${slug(corridor)}-${marketplace}`;
}

function riskFromPct(pct: number): OpsRiskLevel {
  if (pct >= 72) return "low";
  if (pct >= 48) return "medium";
  return "high";
}

function visualPct(plan: CardProductionPlan): number {
  const c = plan.readinessChecks;
  const bits = [
    c.heroVisualReady,
    c.supportVisualsReady,
    c.detailShotsReady,
    c.seoReady,
    c.sizeGridReady,
    c.marketplaceClarityReady,
    c.brandFitReady,
  ];
  const ok = bits.filter(Boolean).length;
  return Math.round((100 * ok) / bits.length);
}

function seoPct(plan: CardProductionPlan): number {
  const c = plan.readinessChecks;
  const cc = plan.contentReadinessChecks;
  let n = 0;
  if (c.seoReady) n += 50;
  if (cc.seoContentReady) n += 35;
  const cluster = plan.seoCluster.trim().length;
  if (cluster >= 120) n += 15;
  else if (cluster >= 40) n += 8;
  return Math.min(100, n);
}

function uploadPctForPlan(plan: CardProductionPlan, byId: Map<string, VisualAssetEntity>): number {
  const comp = deriveComplianceWarnings(plan, byId);
  const checks = computeUploadReadinessChecks(plan, byId, comp);
  return uploadReadinessPercent(checks);
}

function productionPct(plan: CardProductionPlan): number {
  const cc = plan.contentReadinessChecks;
  const bits = [
    cc.descriptionContentReady,
    cc.richContentStructureReady,
    cc.materialBlockReady,
    cc.sizeBlockReady,
    cc.marketplaceCopyReady,
    plan.productionNotes.trim().length >= 12,
  ];
  return Math.round((100 * bits.filter(Boolean).length) / bits.length);
}

function packagingPct(plan: CardProductionPlan): number {
  const pq = plan.printQualityBlock.trim().length;
  const care = plan.careInstructions.trim().length;
  const mat = plan.materialBlock.trim().length;
  let s = 0;
  if (pq >= 24) s += 30;
  else if (pq >= 8) s += 15;
  if (care >= 20) s += 35;
  else if (care >= 8) s += 18;
  if (mat >= 60) s += 35;
  else if (mat >= 30) s += 20;
  return Math.min(100, s);
}

function fboPct(plan: CardProductionPlan, globalPressure: number): number {
  const notes = `${plan.marketplaceNotes} ${plan.productionNotes}`.toLowerCase();
  let base = 78;
  if (/fbo|фбо|fulfill|логист|склад/.test(notes)) base -= 12;
  base -= Math.min(40, Math.round(globalPressure * 0.35));
  return Math.max(15, Math.min(100, base));
}

function computeLaunchPctScore(a: OperationalReadinessAggregate): number {
  const vals = [
    a.visualPct,
    a.seoPct,
    a.uploadPct,
    a.productionPct,
    a.packagingPct,
    a.fboPct,
  ];
  const avg = vals.reduce((x, y) => x + y, 0) / vals.length;
  return Math.round(0.55 * avg + 0.45 * Math.min(...vals));
}

function aggregateForPlans(
  plans: CardProductionPlan[],
  byId: Map<string, VisualAssetEntity>,
  globalPressure: number,
): OperationalReadinessAggregate {
  if (plans.length === 0) {
    return {
      visualPct: 0,
      seoPct: 0,
      uploadPct: 0,
      productionPct: 0,
      packagingPct: 0,
      fboPct: 0,
      launchPct: 0,
    };
  }
  const sum = plans.reduce(
    (acc, p) => {
      const v = visualPct(p);
      const s = seoPct(p);
      const u = uploadPctForPlan(p, byId);
      const pr = productionPct(p);
      const pk = packagingPct(p);
      const f = fboPct(p, globalPressure);
      acc.visualPct += v;
      acc.seoPct += s;
      acc.uploadPct += u;
      acc.productionPct += pr;
      acc.packagingPct += pk;
      acc.fboPct += f;
      return acc;
    },
    { visualPct: 0, seoPct: 0, uploadPct: 0, productionPct: 0, packagingPct: 0, fboPct: 0 },
  );
  const nPlans = plans.length;
  const visAvg = Math.round(sum.visualPct / nPlans);
  const seoAvg = Math.round(sum.seoPct / nPlans);
  const uploadAvg = Math.round(sum.uploadPct / nPlans);
  const prodAvg = Math.round(sum.productionPct / nPlans);
  const packAvg = Math.round(sum.packagingPct / nPlans);
  const fboAvg = Math.round(sum.fboPct / nPlans);
  const partial: OperationalReadinessAggregate = {
    visualPct: visAvg,
    seoPct: seoAvg,
    uploadPct: uploadAvg,
    productionPct: prodAvg,
    packagingPct: packAvg,
    fboPct: fboAvg,
    launchPct: 0,
  };
  partial.launchPct = computeLaunchPctScore(partial);
  return partial;
}

function deriveLaunchStatus(plans: CardProductionPlan[], agg: OperationalReadinessAggregate): LaunchWaveStatus {
  if (plans.every((p) => p.cardStatus === "archived")) return "archived";
  if (plans.some((p) => p.cardStatus === "blocked")) return "blocked";
  if (agg.launchPct >= 86 && plans.every((p) => p.cardStatus === "ready_wb" || p.cardStatus === "ready_ozon" || p.cardStatus === "ready_both"))
    return "ready";
  if (plans.some((p) => p.cardStatus === "assembling")) return "assembling";
  if (agg.launchPct >= 72 && !plans.some((p) => p.cardStatus === "blocked")) return "assembling";
  return "planning";
}

function waveBlockers(plans: CardProductionPlan[]): string[] {
  const out = new Set<string>();
  for (const p of plans) {
    for (const b of p.blockers) out.add(b);
    const c = p.readinessChecks;
    if (!c.heroVisualReady) out.add("missing_hero_visual");
    if (!c.sizeGridReady) out.add("missing_size_grid");
    if (!c.seoReady) out.add("weak_seo_cluster");
    if (!p.contentReadinessChecks.richContentStructureReady) out.add("rich_content_incomplete");
  }
  return [...out];
}

function waveBottlenecks(
  plans: CardProductionPlan[],
  agg: OperationalReadinessAggregate,
  waveSize: number,
  globalAssemblingWaves: number,
  globalReadyPlans: number,
): string[] {
  const b = new Set<string>();
  if (plans.some((p) => !p.readinessChecks.heroVisualReady)) b.add("missing_hero");
  if (plans.some((p) => !p.readinessChecks.sizeGridReady)) b.add("missing_size_grid");
  if (agg.seoPct < 58) b.add("weak_seo");
  if (plans.some((p) => !p.contentReadinessChecks.richContentStructureReady)) b.add("rich_content_incomplete");
  if (waveSize > 6) b.add("overloaded_launch_wave");
  if (globalAssemblingWaves >= 4) b.add("production_congestion");
  if (globalReadyPlans >= 9) b.add("simultaneous_launches");
  if (agg.packagingPct < 52) b.add("packaging_instability");
  if (agg.fboPct < 48) b.add("fbo_risk");
  return [...b];
}

function waveCommands(bottlenecks: string[], agg: OperationalReadinessAggregate): string[] {
  const cmds = new Set<string>();
  if (bottlenecks.includes("missing_hero")) cmds.add("finish_hero_visuals");
  if (bottlenecks.includes("missing_size_grid")) cmds.add("generate_size_grid_assets");
  if (bottlenecks.includes("weak_seo")) cmds.add("strengthen_seo_cluster");
  if (bottlenecks.includes("rich_content_incomplete")) cmds.add("complete_rich_content");
  if (agg.uploadPct < 88) cmds.add("approve_upload_briefs");
  if (bottlenecks.includes("fbo_risk")) cmds.add("pause_fbo_scaling");
  if (bottlenecks.includes("simultaneous_launches")) cmds.add("reduce_launch_density");
  if (bottlenecks.includes("overloaded_launch_wave")) cmds.add("split_wave_or_stagger");
  if (bottlenecks.includes("missing_hero")) cmds.add("refresh_hero_corridor");
  return [...cmds];
}

function operationalPressure(agg: OperationalReadinessAggregate, waveCardCount: number, globalReadyPlans: number): number {
  const stress = 100 - agg.launchPct + waveCardCount * 4 + Math.max(0, globalReadyPlans - 5) * 3;
  return Math.max(8, Math.min(100, Math.round(stress)));
}

function pickExecutiveScenario(
  corridor: string,
  status: LaunchWaveStatus,
  agg: OperationalReadinessAggregate,
  pressure: number,
  fulfillmentRisk: OpsRiskLevel,
): MopsExecutiveScenarioId {
  const c = corridor.toLowerCase();
  if (pressure >= 82 || agg.launchPct < 42) return "congested";
  if (fulfillmentRisk === "high") return "fbo_fragile";
  if (/lux|люкс|premium|преми/i.test(c) && status === "ready" && agg.packagingPct >= 68) return "lux_ready_expand";
  if (/street|стрит|urban/i.test(c) && (status === "blocked" || agg.visualPct < 52)) return "street_visual_fatigue";
  if (/corp|корп|b2b|мерч/i.test(c)) return "corporate_safe";
  if (status === "assembling") return "assembling_focus";
  if (status === "blocked") return "blocked_generic";
  if (status === "ready") return "ready_neutral";
  return "ready_neutral";
}

function mergeAggregates(a: OperationalReadinessAggregate, b: OperationalReadinessAggregate): OperationalReadinessAggregate {
  return {
    visualPct: Math.round((a.visualPct + b.visualPct) / 2),
    seoPct: Math.round((a.seoPct + b.seoPct) / 2),
    uploadPct: Math.round((a.uploadPct + b.uploadPct) / 2),
    productionPct: Math.round((a.productionPct + b.productionPct) / 2),
    packagingPct: Math.round((a.packagingPct + b.packagingPct) / 2),
    fboPct: Math.round((a.fboPct + b.fboPct) / 2),
    launchPct: Math.round((a.launchPct + b.launchPct) / 2),
  };
}

function corridorRollup(waves: LaunchWaveOperationalEntity[]): Record<string, OperationalReadinessAggregate> {
  const map = new Map<string, OperationalReadinessAggregate[]>();
  for (const w of waves) {
    const key = w.corridor.trim() || "—";
    const arr = map.get(key) ?? [];
    arr.push(w.readinessAggregate);
    map.set(key, arr);
  }
  const out: Record<string, OperationalReadinessAggregate> = {};
  for (const [k, list] of map) {
    out[k] = list.reduce((acc, cur) => (acc ? mergeAggregates(acc, cur) : cur), null as OperationalReadinessAggregate | null)!;
  }
  return out;
}

export function deriveMarketplaceOperationalSnapshot(
  envelope: CardProductionBoardEnvelope | null,
  assets: VisualAssetEntity[],
): MarketplaceOperationalSnapshot {
  const byId = new Map(assets.map((a) => [a.id, a] as const));
  const plansRaw = envelope?.plans ?? [];
  const plans = plansRaw.map((p) => refreshPlanDerivedFields(p, assets));

  const globalReadyPlans = plans.filter((p) => p.cardStatus === "ready_wb" || p.cardStatus === "ready_ozon" || p.cardStatus === "ready_both").length;

  const groups = new Map<string, CardProductionPlan[]>();
  for (const p of plans) {
    const corridor = p.targetSkuFamily.trim() || p.cardTitle.trim() || "default";
    const key = `${p.collectionId}\t${corridor}\t${p.marketplace}`;
    const arr = groups.get(key) ?? [];
    arr.push(p);
    groups.set(key, arr);
  }

  const globalAssemblingWaves = [...groups.values()].filter((list) => {
    const agg0 = aggregateForPlans(list, byId, 40);
    return deriveLaunchStatus(list, agg0) === "assembling";
  }).length;

  const waves: LaunchWaveOperationalEntity[] = [];

  for (const [, list] of groups) {
    const waveSize = list.length;
    const first = list[0]!;
    const collectionId = first.collectionId;
    const corridor = first.targetSkuFamily.trim() || first.cardTitle.trim() || "default";
    const marketplace = first.marketplace;
    const id = stableWaveId(collectionId, corridor, marketplace);

    const pressureSeed = operationalPressure(
      aggregateForPlans(list, byId, 40 + Math.min(30, globalReadyPlans * 2)),
      waveSize,
      globalReadyPlans,
    );
    const agg = aggregateForPlans(list, byId, pressureSeed);
    const blockers = waveBlockers(list);
    const bottlenecks = waveBottlenecks(list, agg, waveSize, globalAssemblingWaves, globalReadyPlans);
    const commandCodes = waveCommands(bottlenecks, agg);
    const pressure = operationalPressure(agg, waveSize, globalReadyPlans);
    const productionRisk = riskFromPct(agg.productionPct);
    const packagingRisk = riskFromPct(agg.packagingPct);
    const fulfillmentRisk = riskFromPct(agg.fboPct);
    let launchStatus = deriveLaunchStatus(list, agg);
    const executiveScenarioId = pickExecutiveScenario(corridor, launchStatus, agg, pressure, fulfillmentRisk);

    const readiness = `Launch ${agg.launchPct}% · visual ${agg.visualPct}% · SEO ${agg.seoPct}% · upload ${agg.uploadPct}% · prod ${agg.productionPct}% · pack ${agg.packagingPct}% · FBO ${agg.fboPct}%`;

    waves.push({
      id,
      collectionId,
      corridor,
      marketplace,
      cardPlanIds: list.map((p) => p.id),
      readiness,
      blockers,
      launchPriority: Math.max(1, Math.min(5, 6 - Math.round(agg.launchPct / 22))),
      operationalPressure: pressure,
      productionRisk,
      packagingRisk,
      fulfillmentRisk,
      launchStatus,
      readinessAggregate: agg,
      bottlenecks,
      commandCodes,
      executiveScenarioId,
    });
  }

  waves.sort((a, b) => b.operationalPressure - a.operationalPressure);

  const globalBottlenecks = [...new Set(waves.flatMap((w) => w.bottlenecks))];
  const globalCommandCodes = [...new Set(waves.flatMap((w) => w.commandCodes))];

  const corridorReadiness = corridorRollup(waves);

  const blockedWaves = waves.filter((w) => w.launchStatus === "blocked").length;
  const readyWaves = waves.filter((w) => w.launchStatus === "ready").length;
  const assemblingWaves = waves.filter((w) => w.launchStatus === "assembling").length;

  return {
    waves,
    corridorReadiness,
    globalBottlenecks,
    globalCommandCodes,
    stats: {
      planCount: plans.length,
      waveCount: waves.length,
      blockedWaves,
      readyWaves,
      assemblingWaves,
      globalReadyPlans,
    },
  };
}

export function applyWavePatches(
  snapshot: MarketplaceOperationalSnapshot,
  patches: Record<string, WavePatch>,
): LaunchWaveOperationalEntity[] {
  return snapshot.waves.map((w) => {
    const p = patches[w.id];
    if (!p) return w;
    return {
      ...w,
      launchStatus: p.launchStatus ?? w.launchStatus,
      launchPriority: p.launchPriority !== undefined ? p.launchPriority : w.launchPriority,
    };
  });
}

export type MopsWaveFilterId =
  | "all"
  | "ready_wb"
  | "wait_hero"
  | "wait_seo"
  | "rich_incomplete"
  | "packaging_risk"
  | "fbo_risk";

export function filterWavesByLane(
  waves: LaunchWaveOperationalEntity[],
  filter: MopsWaveFilterId,
  planById: Map<string, CardProductionPlan>,
): LaunchWaveOperationalEntity[] {
  if (filter === "all") return waves;
  return waves.filter((w) => {
    const plans = w.cardPlanIds.map((id) => planById.get(id)).filter(Boolean) as CardProductionPlan[];
    if (filter === "ready_wb") {
      return (
        (w.marketplace === "wb" || w.marketplace === "both") &&
        w.launchStatus === "ready" &&
        w.readinessAggregate.visualPct >= 70
      );
    }
    if (filter === "wait_hero") {
      return plans.some((p) => !p.readinessChecks.heroVisualReady);
    }
    if (filter === "wait_seo") {
      return w.readinessAggregate.seoPct < 62 || plans.some((p) => !p.readinessChecks.seoReady);
    }
    if (filter === "rich_incomplete") {
      return plans.some((p) => !p.contentReadinessChecks.richContentStructureReady);
    }
    if (filter === "packaging_risk") {
      return w.packagingRisk !== "low" || w.bottlenecks.includes("packaging_instability");
    }
    if (filter === "fbo_risk") {
      return w.fulfillmentRisk !== "low" || w.bottlenecks.includes("fbo_risk");
    }
    return true;
  });
}
