import type { NavId } from "../../types";
import { lsDel, lsGet, lsSet } from "../storage";
import { newMemoryId } from "./ids";
import { ACTIVE_PROJECT_STORAGE_KEY } from "./keys";
import { loadSnapshot, saveSnapshot } from "./persist";
import type {
  GenerationModule,
  GenerationRecord,
  MemoryAssetFilter,
  MemorySnapshot,
  ProjectRecord,
  SkuRecord,
  TimelineEntry,
  VisualAnalysisRecord,
} from "./types";

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

function excerpt(s: string, max: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function getActiveProjectId(): string | null {
  const v = (lsGet(ACTIVE_PROJECT_STORAGE_KEY) ?? "").trim();
  return v || null;
}

export function setActiveProjectId(id: string | null) {
  if (id) lsSet(ACTIVE_PROJECT_STORAGE_KEY, id);
  else lsDel(ACTIVE_PROJECT_STORAGE_KEY);
}

function ensureActiveProject(snap: MemorySnapshot): ProjectRecord {
  let id = getActiveProjectId();
  if (id && snap.projects[id]) return snap.projects[id];

  const ids = Object.keys(snap.projects);
  if (ids.length > 0) {
    const sorted = ids.map((i) => snap.projects[i]!).sort((a, b) => b.updatedAt - a.updatedAt);
    const pick = sorted[0]!;
    setActiveProjectId(pick.id);
    return pick;
  }

  return createProjectInternal(snap, "Workspace");
}

function createProjectInternal(snap: MemorySnapshot, title: string): ProjectRecord {
  const now = Date.now();
  const id = newMemoryId("proj");
  const p: ProjectRecord = {
    id,
    title: title.trim() || "Project",
    description: "",
    tags: [],
    thumbnailDataUrl: null,
    skuIds: [],
    generationIds: [],
    visualAnalysisIds: [],
    createdAt: now,
    updatedAt: now,
  };
  snap.projects[id] = p;
  setActiveProjectId(id);
  return p;
}

export function createProject(title: string): ProjectRecord {
  const snap = deepClone(loadSnapshot());
  const p = createProjectInternal(snap, title);
  saveSnapshot(snap);
  return p;
}

export function deleteProject(projectId: string) {
  const snap = deepClone(loadSnapshot());
  if (!snap.projects[projectId]) return;

  const p = snap.projects[projectId]!;
  for (const gid of p.generationIds) delete snap.generations[gid];
  for (const vid of p.visualAnalysisIds) delete snap.visualAnalyses[vid];
  for (const sid of p.skuIds) delete snap.skus[sid];
  delete snap.projects[projectId];

  if (getActiveProjectId() === projectId) {
    const rest = Object.keys(snap.projects).sort(
      (a, b) => snap.projects[b]!.updatedAt - snap.projects[a]!.updatedAt,
    );
    setActiveProjectId(rest[0] ?? null);
  }
  saveSnapshot(snap);
}

export function updateProject(
  projectId: string,
  patch: Partial<Pick<ProjectRecord, "title" | "description" | "tags" | "thumbnailDataUrl">>,
) {
  const snap = deepClone(loadSnapshot());
  const p = snap.projects[projectId];
  if (!p) return;
  const now = Date.now();
  if (patch.title != null) p.title = patch.title.trim() || p.title;
  if (patch.description != null) p.description = patch.description;
  if (patch.tags != null) p.tags = patch.tags;
  if (patch.thumbnailDataUrl !== undefined) p.thumbnailDataUrl = patch.thumbnailDataUrl;
  p.updatedAt = now;
  saveSnapshot(snap);
}

export function renameProject(projectId: string, title: string) {
  updateProject(projectId, { title });
}

export type ProjectSummary = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailDataUrl: string | null;
  updatedAt: number;
  createdAt: number;
  generationCount: number;
  visualCount: number;
  skuCount: number;
};

export function listProjectSummaries(): ProjectSummary[] {
  const snap = loadSnapshot();
  return Object.values(snap.projects)
    .map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      tags: p.tags,
      thumbnailDataUrl: p.thumbnailDataUrl,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
      generationCount: p.generationIds.length,
      visualCount: p.visualAnalysisIds.length,
      skuCount: p.skuIds.length,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(projectId: string): ProjectRecord | undefined {
  return loadSnapshot().projects[projectId];
}

export function recordGeneration(input: {
  module: GenerationModule;
  title: string;
  content: string;
  skuId?: string | null;
  previewImageDataUrl?: string | null;
  previewText?: string | null;
  tags?: string[];
  mime?: GenerationRecord["mime"];
  meta?: Record<string, unknown>;
}): GenerationRecord {
  const snap = deepClone(loadSnapshot());
  const project = ensureActiveProject(snap);
  const now = Date.now();
  const id = newMemoryId("gen");
  const gen: GenerationRecord = {
    id,
    projectId: project.id,
    skuId: input.skuId ?? null,
    module: input.module,
    title: input.title,
    content: input.content,
    mime: input.mime ?? "text/markdown",
    previewText: (input.previewText != null && input.previewText !== "" ? input.previewText : excerpt(input.content, 280)).slice(0, 400),
    previewImageDataUrl: input.previewImageDataUrl ?? null,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
    meta: input.meta,
  };
  snap.generations[id] = gen;
  project.generationIds = [id, ...project.generationIds.filter((x) => x !== id)];
  project.updatedAt = now;
  if (input.previewImageDataUrl && !project.thumbnailDataUrl) {
    project.thumbnailDataUrl = input.previewImageDataUrl;
  }
  if (gen.skuId) {
    const sku = snap.skus[gen.skuId];
    if (sku) {
      sku.linkedGenerationIds = [id, ...sku.linkedGenerationIds.filter((x) => x !== id)];
      sku.updatedAt = now;
    }
  }
  saveSnapshot(snap);
  return gen;
}

export function recordVisualAnalysis(input: {
  title: string;
  analysisJson: string;
  schemaVersion: 1 | 2;
  previewImageDataUrl?: string | null;
  uploadedAssetsMeta?: VisualAnalysisRecord["uploadedAssetsMeta"];
  scoresSummary?: string;
  tags?: string[];
  skuId?: string | null;
}): VisualAnalysisRecord {
  const snap = deepClone(loadSnapshot());
  const project = ensureActiveProject(snap);
  const now = Date.now();
  const id = newMemoryId("vis");
  const vis: VisualAnalysisRecord = {
    id,
    projectId: project.id,
    skuId: input.skuId ?? null,
    title: input.title,
    analysisJson: input.analysisJson,
    schemaVersion: input.schemaVersion,
    previewText: excerpt(input.analysisJson, 280),
    previewImageDataUrl: input.previewImageDataUrl ?? null,
    uploadedAssetsMeta: input.uploadedAssetsMeta ?? [],
    scoresSummary: input.scoresSummary,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  snap.visualAnalyses[id] = vis;
  project.visualAnalysisIds = [id, ...project.visualAnalysisIds.filter((x) => x !== id)];
  project.updatedAt = now;
  if (input.previewImageDataUrl) {
    project.thumbnailDataUrl = input.previewImageDataUrl;
  }
  if (vis.skuId) {
    const sku = snap.skus[vis.skuId];
    if (sku) {
      sku.linkedVisualAnalysisIds = [id, ...sku.linkedVisualAnalysisIds.filter((x) => x !== id)];
      sku.updatedAt = now;
    }
  }
  saveSnapshot(snap);
  return vis;
}

export function createSku(
  projectId: string,
  input: Pick<SkuRecord, "name" | "marketplace" | "category"> & { tags?: string[] },
): SkuRecord | null {
  const snap = deepClone(loadSnapshot());
  const p = snap.projects[projectId];
  if (!p) return null;
  const now = Date.now();
  const id = newMemoryId("sku");
  const sku: SkuRecord = {
    id,
    projectId,
    name: input.name.trim() || "SKU",
    marketplace: input.marketplace.trim() || "—",
    category: input.category.trim() || "—",
    linkedAssetRefs: [],
    linkedGenerationIds: [],
    linkedVisualAnalysisIds: [],
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  snap.skus[id] = sku;
  p.skuIds = [id, ...p.skuIds];
  p.updatedAt = now;
  saveSnapshot(snap);
  return sku;
}

export function listSkusForProject(projectId: string): SkuRecord[] {
  const snap = loadSnapshot();
  const p = snap.projects[projectId];
  if (!p) return [];
  return p.skuIds.map((sid) => snap.skus[sid]).filter(Boolean) as SkuRecord[];
}

export function deleteSku(skuId: string) {
  const snap = deepClone(loadSnapshot());
  const sku = snap.skus[skuId];
  if (!sku) return;
  const p = snap.projects[sku.projectId];
  if (p) p.skuIds = p.skuIds.filter((x) => x !== skuId);
  delete snap.skus[skuId];
  saveSnapshot(snap);
}

export function duplicateGeneration(generationId: string): GenerationRecord | null {
  const snap = deepClone(loadSnapshot());
  const src = snap.generations[generationId];
  if (!src) return null;
  const now = Date.now();
  const id = newMemoryId("gen");
  const copy: GenerationRecord = {
    ...src,
    id,
    title: `${src.title} · copy`,
    createdAt: now,
    updatedAt: now,
  };
  snap.generations[id] = copy;
  const p = snap.projects[src.projectId];
  if (p) {
    p.generationIds = [id, ...p.generationIds.filter((x) => x !== id)];
    p.updatedAt = now;
  }
  saveSnapshot(snap);
  return copy;
}

export function deleteGeneration(generationId: string) {
  const snap = deepClone(loadSnapshot());
  const g = snap.generations[generationId];
  if (!g) return;
  const p = snap.projects[g.projectId];
  if (p) p.generationIds = p.generationIds.filter((x) => x !== generationId);
  for (const sku of Object.values(snap.skus)) {
    sku.linkedGenerationIds = sku.linkedGenerationIds.filter((x) => x !== generationId);
  }
  delete snap.generations[generationId];
  saveSnapshot(snap);
}

export function deleteVisualAnalysis(visualId: string) {
  const snap = deepClone(loadSnapshot());
  const v = snap.visualAnalyses[visualId];
  if (!v) return;
  const p = snap.projects[v.projectId];
  if (p) p.visualAnalysisIds = p.visualAnalysisIds.filter((x) => x !== visualId);
  for (const sku of Object.values(snap.skus)) {
    sku.linkedVisualAnalysisIds = sku.linkedVisualAnalysisIds.filter((x) => x !== visualId);
  }
  delete snap.visualAnalyses[visualId];
  saveSnapshot(snap);
}

export function getGeneration(id: string): GenerationRecord | undefined {
  return loadSnapshot().generations[id];
}

export function getVisualAnalysis(id: string): VisualAnalysisRecord | undefined {
  return loadSnapshot().visualAnalyses[id];
}

export function getProjectTimeline(projectId: string, filter: MemoryAssetFilter = "all"): TimelineEntry[] {
  const snap = loadSnapshot();
  const p = snap.projects[projectId];
  if (!p) return [];

  const rows: TimelineEntry[] = [];

  if (filter === "all" || filter === "visual") {
    for (const id of p.visualAnalysisIds) {
      const v = snap.visualAnalyses[id];
      if (v) rows.push({ kind: "visual", id, createdAt: v.createdAt });
    }
  }

  if (filter === "all" || filter !== "visual") {
    for (const id of p.generationIds) {
      const g = snap.generations[id];
      if (!g) continue;
      if (filter === "all" || filter === g.module) {
        rows.push({ kind: "generation", id, createdAt: g.createdAt });
      }
    }
  }

  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

function normTokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function searchProjects(query: string): string[] {
  const snap = loadSnapshot();
  const tokens = normTokens(query);
  if (tokens.length === 0) return Object.keys(snap.projects);

  const scored: { id: string; score: number }[] = [];

  for (const p of Object.values(snap.projects)) {
    let score = 0;
    const blob = [p.title, p.description, p.tags.join(" ")].join(" ").toLowerCase();
    for (const t of tokens) {
      if (blob.includes(t)) score += 3;
    }

    for (const sid of p.skuIds) {
      const sku = snap.skus[sid];
      if (!sku) continue;
      const sh = `${sku.name} ${sku.marketplace} ${sku.category} ${sku.tags.join(" ")}`.toLowerCase();
      for (const tok of tokens) {
        if (sh.includes(tok)) score += 2;
      }
    }

    for (const gid of p.generationIds) {
      const g = snap.generations[gid];
      if (!g) continue;
      const gh = `${g.title} ${g.module} ${g.previewText}`.toLowerCase();
      for (const tok of tokens) {
        if (gh.includes(tok)) score += 1;
      }
    }

    for (const vid of p.visualAnalysisIds) {
      const v = snap.visualAnalyses[vid];
      if (!v) continue;
      const vh = `${v.title} ${v.previewText}`.toLowerCase();
      for (const tok of tokens) {
        if (vh.includes(tok)) score += 1;
      }
    }

    if (score > 0) scored.push({ id: p.id, score });
  }

  if (scored.length === 0) return [];
  return scored.sort((a, b) => b.score - a.score).map((s) => s.id);
}

export function moduleNavTarget(module: GenerationModule): NavId {
  if (module === "strategic_command") return "command";
  if (module === "temporal_strategy") return "temporalStrategy";
  if (module === "execution_planner") return "executionPlanner";
  if (module === "execution_orchestrator") return "executionOrchestrator";
  if (module === "action_command") return "executionOrchestrator";
  if (module === "feedback_loop") return "feedbackLoop";
  if (module === "brand_evolution") return "brandEvolution";
  if (module === "executive_intelligence") return "executiveIntelligence";
  if (module === "organism_model") return "organismModel";
  if (module === "strategy_evolution") return "strategyEvolution";
  if (module === "seo") return "seo";
  if (module === "rich") return "rich";
  if (module === "prompt_composer") return "promptComposer";
  if (module === "prompt_pack") return "promptPack";
  if (module === "visual_production") return "visualProduction";
  if (module === "visual_asset_registry") return "visualAssets";
  if (module === "card_production") return "cardProduction";
  if (module === "marketplace_operations") return "marketplaceOperations";
  if (module === "sku_intelligence") return "skuIntelligence";
  if (module === "market_ingestion") return "ingestionReadiness";
  if (module === "data_import") return "dataImport";
  if (module === "entity_fusion") return "entityFusion";
  if (module === "entity_snapshot") return "skuIntelligence";
  if (module === "data_cleanup") return "dataCleanup";
  if (module === "assortment_actions") return "assortmentActions";
  if (module === "competitive_map") return "competitiveMap";
  if (module === "competitor_serp") return "competitiveMap";
  if (module === "hero_improvement_plan") return "competitiveMap";
  if (module === "competitive_gap_analysis") return "competitiveMap";
  if (module === "hero_archetype_intelligence") return "competitiveMap";
  if (module === "hero_readability_intelligence") return "competitiveMap";
  if (module === "hero_fatigue_intelligence") return "competitiveMap";
  if (module === "hero_battle_plan") return "competitiveMap";
  if (module === "hero_test_matrix") return "competitiveMap";
  if (module === "hero_test_results") return "competitiveMap";
  if (module === "hero_launch_package") return "competitiveMap";
  if (module === "hero_post_launch_observation") return "competitiveMap";
  if (module === "hero_command") return "heroCommand";
  if (module === "launch_operations") return "launchOperations";
  if (module === "launch_review") return "launchOperations";
  if (module === "founder_brief") return "founderBrief";
  if (module === "economic_pressure") return "economicPressure";
  if (module === "unit_economics") return "unitEconomics";
  if (module === "advertising_pressure") return "advertisingPressure";
  if (module === "scaling_safety") return "scalingSafety";
  if (module === "production_pressure") return "productionPressure";
  if (module === "production_daily_plan") return "productionPressure";
  if (module === "production_shift_feedback") return "productionPressure";
  if (module === "daily_war_room") return "warRoom";
  if (module === "morning_flow") return "morningStart";
  if (module === "evening_close") return "eveningClose";
  if (module === "real_use_test") return "realUseTest";
  if (module === "integration_readiness") return "integrationReadiness";
  if (module === "fbo_fbs_decision") return "fboFbsDecision";
  if (module === "corridor_strategy") return "corridorStrategy";
  if (module === "market_timing") return "marketTiming";
  if (module === "control_tower") return "controlTower";
  if (module === "os_health_audit") return "osHealthAudit";
  if (module === "guided_setup") return "guidedSetup";
  if (module === "operator_brief") return "operatorMode";
  if (module === "execution_feedback") return "operatorMode";
  if (module === "runtime_smoke_test") return "systemSmokeTest";
  if (module === "release_check") return "releaseCheck";
  if (module === "daily_operations_pilot") return "dailyPilot";
  if (module === "daily_pilot_debrief") return "pilotDebrief";
  if (module === "simplification_backlog") return "osSimplification";
  if (module === "clean_day_mode") return "dashboard";
  if (module === "prompts") return "prompts";
  if (module === "reels") return "reels";
  if (module === "campaign") return "campaign";
  if (module === "collection_builder") return "collectionBuilder";
  if (module === "visual_strategy") return "visualStrategy";
  if (module === "competitor_analysis") return "competitors";
  if (module === "trend_radar") return "trends";
  return "rich";
}

export function scheduleRerunFromGeneration(generationId: string) {
  const g = getGeneration(generationId);
  if (!g) return;
  const target = moduleNavTarget(g.module);
  try {
    sessionStorage.setItem(
      "vokra.rerun",
      JSON.stringify({ module: target, sourceModule: g.module, content: g.content, title: g.title }),
    );
  } catch {
    /* ignore quota */
  }
}

export function scheduleRerunFromVisual() {
  try {
    sessionStorage.setItem("vokra.rerun", JSON.stringify({ module: "visual" }));
  } catch {
    /* ignore */
  }
}
