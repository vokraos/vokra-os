/**
 * Public surface for Project Memory V1.
 * UI and generators import from here — not from persist/migrate internals.
 */
export type {
  GenerationModule,
  GenerationRecord,
  MemoryAssetFilter,
  MemorySnapshot,
  ProjectRecord,
  SkuRecord,
  TimelineEntry,
  VisualAnalysisRecord,
  VisualAssetMeta,
} from "./types";
export { MEMORY_SCHEMA_VERSION, ALL_GENERATION_MODULES } from "./types";
export { MEMORY_STORAGE_KEY, ACTIVE_PROJECT_STORAGE_KEY } from "./keys";
export {
  getActiveProjectId,
  setActiveProjectId,
  createProject,
  deleteProject,
  updateProject,
  renameProject,
  listProjectSummaries,
  getProject,
  recordGeneration,
  recordVisualAnalysis,
  createSku,
  listSkusForProject,
  deleteSku,
  duplicateGeneration,
  deleteGeneration,
  deleteVisualAnalysis,
  getGeneration,
  getVisualAnalysis,
  getProjectTimeline,
  searchProjects,
  moduleNavTarget,
  scheduleRerunFromGeneration,
  scheduleRerunFromVisual,
} from "./service";
export type { ProjectSummary } from "./service";
export {
  exportGenerationMarkdown,
  exportGenerationPlain,
  exportGenerationJsonRecord,
  exportVisualAnalysisJson,
  exportVisualAnalysisParsed,
} from "./export";
export { useMemorySnapshot } from "./hooks";
export { MEMORY_CHANGED_EVENT } from "./events";
