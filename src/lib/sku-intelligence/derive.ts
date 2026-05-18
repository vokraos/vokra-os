import type { CardProductionBoardEnvelope, CardProductionPlan } from "../card-production/types";
import { refreshPlanDerivedFields } from "../card-production/planFromAsset";
import {
  computeUploadReadinessChecks,
  deriveComplianceWarnings,
  uploadReadinessPercent,
} from "../card-production/uploadBrief";
import { buildMarketplaceEntitySnapshot, heroHierarchySpotlight } from "../entity-core";
import { deriveMarketplaceOperationalSnapshot, stableWaveId } from "../marketplace-operations";
import type { VisualAssetEntity } from "../visual-assets/types";
import type {
  SkuHeroStatus,
  SkuIntelligenceEntity,
  SkuIntelligenceSnapshot,
  SkuIntelEvent,
  SkuIntelRole,
  SkuLifecycleStage,
} from "./types";
import { SKU_INTEL_MEMORY_SCHEMA } from "./types";

function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

function tokenSet(s: string): Set<string> {
  return new Set(normTitle(s).split(" ").filter((w) => w.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
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
  return Math.round((100 * bits.filter(Boolean).length) / bits.length);
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

function uploadPct(plan: CardProductionPlan, byId: Map<string, VisualAssetEntity>): number {
  const comp = deriveComplianceWarnings(plan, byId);
  return uploadReadinessPercent(computeUploadReadinessChecks(plan, byId, comp));
}

function planScore(plan: CardProductionPlan, byId: Map<string, VisualAssetEntity>): number {
  const readyBonus =
    plan.cardStatus === "ready_wb" || plan.cardStatus === "ready_ozon" || plan.cardStatus === "ready_both" ? 18 : 0;
  return Math.round(uploadPct(plan, byId) * 0.38 + visualPct(plan) * 0.32 + seoPct(plan) * 0.3 + readyBonus);
}

function fatigueFromPlan(plan: CardProductionPlan, byId: Map<string, VisualAssetEntity>): number {
  let acc = 42;
  const hid = plan.heroVisualId;
  if (hid) {
    const h = byId.get(hid);
    if (h) {
      if (h.printReadabilityScore !== null) acc += Math.max(0, 5 - h.printReadabilityScore) * 10;
      if (h.marketplaceClarityScore !== null && h.marketplaceClarityScore < 3) acc += 22;
      if (h.brandFitScore !== null && h.brandFitScore < 3) acc += 14;
    }
  } else {
    acc += 28;
  }
  return Math.min(100, Math.round(acc));
}

function wavePressureForPlan(plan: CardProductionPlan, mops: ReturnType<typeof deriveMarketplaceOperationalSnapshot>): number {
  const w = mops.waves.find((x) => x.cardPlanIds.includes(plan.id));
  return w?.operationalPressure ?? Math.round(35 + mops.stats.globalReadyPlans * 2.2);
}

function pickRole(rank: number, corridorSize: number, score: number, saturation: number): SkuIntelRole {
  if (score < 22) return corridorSize > 8 ? "test" : "disposable";
  if (rank === 0 && score >= 58 && saturation < 82) return "hero";
  if (rank <= 2 && score >= 44) return "support";
  if (rank <= 5 && score >= 32) return "amplifier";
  if (saturation >= 88 && rank > 0) return "disposable";
  if (score >= 36 && saturation < 55 && rank <= 4) return "expansion";
  if (score < 40 && rank > 3) return "recovery";
  if (score < 28) return "archive";
  return "support";
}

function pickLifecycle(
  plan: CardProductionPlan,
  role: SkuIntelRole,
  saturation: number,
  overlap: number,
  refreshNeed: number,
): SkuLifecycleStage {
  if (plan.cardStatus === "archived") return "archived";
  if (role === "archive" || role === "disposable") return "cooling";
  if (role === "recovery") return "recovering";
  if (role === "hero" && saturation >= 78) return "overheating";
  if (role === "hero" && overlap < 35 && saturation < 55) return "dominant";
  if (role === "expansion" || (role === "amplifier" && saturation < 60)) return "scaling";
  if (refreshNeed >= 72) return "cooling";
  if (role === "hero" && overlap >= 55) return "overheating";
  return "emerging";
}

function pickHeroStatus(role: SkuIntelRole, saturation: number, overlap: number, seo: number, lifecycle: SkuLifecycleStage): SkuHeroStatus {
  if (lifecycle === "recovering" || role === "recovery") return "recovery_window";
  if (role === "hero" && (saturation >= 75 || overlap >= 55)) return "overheating";
  if (role === "hero" && seo >= 82) return "traffic_leader";
  if (role === "hero") return "corridor_anchor";
  if (role === "amplifier" && overlap < 40 && saturation < 62) return "expansion_amplifier";
  if (role === "amplifier" && overlap >= 48) return "amplifier_stress";
  if (role === "support" && overlap >= 42) return "losing_gravity";
  return "stable";
}

function skuCodeForPlan(plan: CardProductionPlan): string {
  const fromSku = plan.skuIds.map((s) => s.trim()).find(Boolean);
  if (fromSku) return fromSku;
  const fam = plan.targetSkuFamily.trim();
  if (fam) return `${fam}::${plan.id.slice(0, 10)}`;
  return plan.cardTitle.trim().slice(0, 40).replace(/\s+/g, "-") || plan.id;
}

function linkedAssetsForPlan(plan: CardProductionPlan): string[] {
  const ids: string[] = [];
  if (plan.heroVisualId) ids.push(plan.heroVisualId);
  plan.supportVisualIds.forEach((x) => ids.push(x));
  plan.detailVisualIds.forEach((x) => ids.push(x));
  plan.richContentVisualIds.forEach((x) => ids.push(x));
  if (plan.sizeGridVisualId) ids.push(plan.sizeGridVisualId);
  plan.reelsVisualIds.forEach((x) => ids.push(x));
  return [...new Set(ids)];
}

function productionComplexity(plan: CardProductionPlan): number {
  const rich = plan.richContentBlocks.length * 9;
  const notes = Math.min(40, Math.round(plan.productionNotes.trim().length / 4));
  return Math.min(100, rich + notes + (plan.materialBlock.length > 80 ? 18 : 0));
}

function deriveCommands(entities: SkuIntelligenceEntity[], events: SkuIntelEvent[]): string[] {
  const cmds = new Set<string>();
  if (entities.some((e) => e.heroStatus === "overheating" || e.lifecycleStage === "overheating")) cmds.add("rotate_hero_visuals");
  if (entities.some((e) => e.saturationRisk >= 72)) cmds.add("pause_corridor_expansion");
  if (entities.filter((e) => e.role === "hero").length >= 4) cmds.add("reduce_launch_density");
  if (entities.some((e) => e.heroStatus === "losing_gravity")) cmds.add("promote_support_sku");
  if (entities.some((e) => e.role === "amplifier" && e.overlapRisk >= 58)) cmds.add("archive_weak_amplifiers");
  if (entities.some((e) => e.role === "recovery" || e.heroStatus === "recovery_window")) cmds.add("launch_recovery_wave");
  if (entities.some((e) => e.refreshNeed >= 62)) cmds.add("corridor_visual_refresh");
  if (entities.some((e) => e.seoPressure >= 65)) cmds.add("seo_refresh_pass");
  if (entities.some((e) => e.role === "hero" && e.visualFatigue >= 62)) cmds.add("hero_rotation_window");
  for (const ev of events) {
    if (ev.kind === "overlap") cmds.add("dedupe_corridor_messaging");
    if (ev.kind === "saturation") cmds.add("stagger_launch_windows");
  }
  return [...cmds];
}

function buildEvents(entities: SkuIntelligenceEntity[], corridorGroups: Map<string, CardProductionPlan[]>): SkuIntelEvent[] {
  const out: SkuIntelEvent[] = [];
  for (const [key, plans] of corridorGroups) {
    const corridor = plans[0]?.targetSkuFamily.trim() || key;
    if (plans.length >= 5) {
      out.push({
        kind: "saturation",
        code: "corridor_density",
        corridor,
        skuCode: "—",
        detail: `${plans.length} SKU anchors in one corridor`,
      });
    }
    const heroIds = new Map<string, number>();
    for (const p of plans) {
      if (p.heroVisualId) heroIds.set(p.heroVisualId, (heroIds.get(p.heroVisualId) ?? 0) + 1);
    }
    for (const [hid, n] of heroIds) {
      if (n >= 2) {
        out.push({
          kind: "overlap",
          code: "hero_visual_reuse",
          corridor,
          skuCode: hid,
          detail: `${n} plans share the same hero visual`,
        });
      }
    }
  }
  for (const e of entities) {
    if (e.refreshNeed >= 68) {
      out.push({
        kind: "refresh",
        code: "refresh_window",
        corridor: e.corridor,
        skuCode: e.skuCode,
        detail: "Refresh index crossed operational threshold",
      });
    }
    if (e.role === "archive" || e.lifecycleStage === "archived") {
      out.push({
        kind: "archive",
        code: "archive_candidate",
        corridor: e.corridor,
        skuCode: e.skuCode,
        detail: "Archive / cool-down candidate",
      });
    }
  }
  return out.slice(0, 48);
}

export function deriveSkuIntelligenceSnapshot(
  envelope: CardProductionBoardEnvelope | null,
  assets: VisualAssetEntity[],
): SkuIntelligenceSnapshot {
  const byId = new Map(assets.map((a) => [a.id, a] as const));
  const plansRaw = envelope?.plans ?? [];
  const plans = plansRaw.map((p) => refreshPlanDerivedFields(p, assets));
  const mops = deriveMarketplaceOperationalSnapshot(envelope, assets);

  const corridorGroups = new Map<string, CardProductionPlan[]>();
  for (const p of plans) {
    const corridor = p.targetSkuFamily.trim() || p.cardTitle.trim() || "default";
    const key = `${p.collectionId}::${corridor}::${p.marketplace}`;
    const arr = corridorGroups.get(key) ?? [];
    arr.push(p);
    corridorGroups.set(key, arr);
  }

  for (const [, arr] of corridorGroups) {
    arr.sort((a, b) => planScore(b, byId) - planScore(a, byId));
  }

  const entities: SkuIntelligenceEntity[] = [];

  for (const [, arr] of corridorGroups) {
    const corridor = arr[0]!.targetSkuFamily.trim() || arr[0]!.cardTitle.trim() || "default";
    const saturationBase = Math.min(100, Math.round(18 + arr.length * 14 + mops.stats.globalReadyPlans * 1.8));

    const titleTokens = arr.map((p) => ({ plan: p, tok: tokenSet(p.cardTitle) }));
    const heroShare = new Map<string, number>();
    for (const p of arr) {
      if (p.heroVisualId) heroShare.set(p.heroVisualId, (heroShare.get(p.heroVisualId) ?? 0) + 1);
    }

    arr.forEach((plan, rank) => {
      const waveId = stableWaveId(plan.collectionId, corridor, plan.marketplace);
      const score = planScore(plan, byId);
      const saturation = Math.min(100, saturationBase + (rank === 0 ? 0 : 6));
      let overlap = 0;
      for (const o of titleTokens) {
        if (o.plan.id === plan.id) continue;
        const j = jaccard(o.tok, tokenSet(plan.cardTitle));
        overlap = Math.max(overlap, Math.round(j * 100));
      }
      const heroReuse = plan.heroVisualId ? (heroShare.get(plan.heroVisualId) ?? 0) : 0;
      if (heroReuse >= 2) overlap = Math.min(100, overlap + 32);

      const vf = fatigueFromPlan(plan, byId);
      const seo = seoPct(plan);
      const seoPressure = Math.min(100, Math.round(100 - seo + (overlap > 40 ? 12 : 0)));
      const refreshNeed = Math.min(100, Math.round(vf * 0.45 + seoPressure * 0.35 + saturation * 0.2));
      const role = pickRole(rank, arr.length, score, saturation);
      const lifecycle = pickLifecycle(plan, role, saturation, overlap, refreshNeed);
      const heroStatus = pickHeroStatus(role, saturation, overlap, seo, lifecycle);
      const waveP = wavePressureForPlan(plan, mops);
      const marketplacePriority = Math.max(0, Math.min(100, Math.round(92 - waveP * 0.55 + (score > 70 ? 14 : 0))));
      const launchReadiness = uploadPct(plan, byId);
      const prodCx = productionComplexity(plan);

      const notes = [
        `${role.toUpperCase()} · ${lifecycle}`,
        saturation >= 70 ? "Saturation watch" : null,
        overlap >= 50 ? "Overlap / cannibalization" : null,
        refreshNeed >= 60 ? "Refresh soon" : null,
      ]
        .filter(Boolean)
        .join(" · ");

      entities.push({
        id: `si-${plan.id}`,
        skuCode: skuCodeForPlan(plan),
        corridor,
        collectionId: plan.collectionId,
        role,
        launchWaveId: waveId,
        heroStatus,
        saturationRisk: saturation,
        overlapRisk: overlap,
        refreshNeed,
        visualFatigue: vf,
        seoPressure: seoPressure,
        marketplacePriority,
        productionComplexity: prodCx,
        launchReadiness,
        linkedAssets: linkedAssetsForPlan(plan),
        linkedCardPlans: [plan.id],
        lifecycleStage: lifecycle,
        operationalNotes: notes || "Topology nominal",
      });
    });
  }

  entities.sort((a, b) => b.marketplacePriority - a.marketplacePriority);

  const events = buildEvents(entities, corridorGroups);
  const commands = deriveCommands(entities, events);

  let entityCoreEcho: SkuIntelligenceSnapshot["entityCoreEcho"] = null;
  try {
    const seed = Math.max(1, entities.length * 31 + plans.length * 7);
    const tension = Math.min(1, mops.stats.globalReadyPlans / 14 + 0.18);
    const pressure = Math.min(1, mops.waves.reduce((m, w) => Math.max(m, w.operationalPressure), 0) / 110);
    const es = buildMarketplaceEntitySnapshot(seed, tension, pressure);
    const spotlight = heroHierarchySpotlight(es, seed);
    entityCoreEcho = spotlight
      ? { spotlightKey: spotlight.key, spotlightVars: spotlight.vars }
      : { spotlightKey: null, spotlightVars: {} };
  } catch {
    entityCoreEcho = null;
  }

  return {
    schema: SKU_INTEL_MEMORY_SCHEMA,
    derivedAt: Date.now(),
    entities,
    events,
    commands,
    entityCoreEcho,
  };
}

export function filterEntitiesBySection(
  entities: SkuIntelligenceEntity[],
  section:
    | "hero"
    | "support_corridors"
    | "overheating"
    | "saturation"
    | "expansion"
    | "recovery"
    | "refresh"
    | "archive",
): SkuIntelligenceEntity[] {
  switch (section) {
    case "hero":
      return entities.filter((e) => e.role === "hero");
    case "support_corridors":
      return entities.filter((e) => e.role === "support");
    case "overheating":
      return entities.filter((e) => e.lifecycleStage === "overheating" || e.heroStatus === "overheating");
    case "saturation":
      return entities.filter((e) => e.saturationRisk >= 52);
    case "expansion":
      return entities.filter((e) => e.role === "expansion" || (e.lifecycleStage === "emerging" && e.overlapRisk < 42));
    case "recovery":
      return entities.filter((e) => e.role === "recovery" || e.lifecycleStage === "recovering" || e.heroStatus === "recovery_window");
    case "refresh":
      return entities.filter((e) => e.refreshNeed >= 48);
    case "archive":
      return entities.filter((e) => e.role === "archive" || e.lifecycleStage === "archived");
    default:
      return entities;
  }
}
