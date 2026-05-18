import { lsDel, lsGet, lsSet } from "../storage";
import { MEMORY_SCHEMA_VERSION, type GenerationModule, type GenerationRecord, type MemorySnapshot, type ProjectRecord, type VisualAnalysisRecord } from "./types";
import { newMemoryId } from "./ids";
import { MEMORY_STORAGE_KEY } from "./keys";

const LEGACY_PROJECTS_KEY = "vokra.projects.v1";

type LegacyItem = {
  id: string;
  kind: string;
  title: string;
  createdAt: number;
  content: string;
};

type LegacyProject = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  items: LegacyItem[];
};

function toModule(kind: string): GenerationModule {
  if (kind === "seo") return "seo";
  if (kind === "rich") return "rich";
  if (kind === "prompts") return "prompt_pack";
  if (kind === "reels") return "reels";
  if (kind === "campaign") return "campaign";
  return "rich";
}

function excerpt(s: string, max: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * One-time import from `vokra.projects.v1` into normalized memory.
 * Safe to call repeatedly — no-op if memory already exists.
 */
export function migrateLegacyIfNeeded() {
  const memKey = MEMORY_STORAGE_KEY;
  if (lsGet(memKey)) return;

  const raw = lsGet(LEGACY_PROJECTS_KEY);
  if (!raw) return;

  let legacy: LegacyProject[] = [];
  try {
    const v = JSON.parse(raw) as LegacyProject[];
    legacy = Array.isArray(v) ? v : [];
  } catch {
    return;
  }
  if (legacy.length === 0) return;

  const snap: MemorySnapshot = {
    schemaVersion: MEMORY_SCHEMA_VERSION,
    projects: {},
    skus: {},
    generations: {},
    visualAnalyses: {},
  };

  for (const lp of legacy) {
    const proj: ProjectRecord = {
      id: lp.id,
      title: lp.name || "Project",
      description: "",
      tags: [],
      thumbnailDataUrl: null,
      skuIds: [],
      generationIds: [],
      visualAnalysisIds: [],
      createdAt: lp.createdAt,
      updatedAt: lp.updatedAt,
    };

    const items = Array.isArray(lp.items) ? lp.items : [];
    for (const it of items) {
      if (it.kind === "visual") {
        const vid = newMemoryId("vis");
        let schemaVersion: 1 | 2 = 1;
        try {
          const parsed = JSON.parse(it.content) as { schemaVersion?: number };
          if (parsed?.schemaVersion === 2) schemaVersion = 2;
        } catch {
          /* keep 1 */
        }
        const vis: VisualAnalysisRecord = {
          id: vid,
          projectId: proj.id,
          skuId: null,
          title: it.title || "Visual analysis",
          analysisJson: it.content,
          schemaVersion,
          previewText: excerpt(it.content, 240),
          previewImageDataUrl: null,
          uploadedAssetsMeta: [],
          tags: [],
          createdAt: it.createdAt,
          updatedAt: it.createdAt,
        };
        snap.visualAnalyses[vid] = vis;
        proj.visualAnalysisIds.push(vid);
      } else {
        const gid = newMemoryId("gen");
        const gen: GenerationRecord = {
          id: gid,
          projectId: proj.id,
          skuId: null,
          module: toModule(it.kind),
          title: it.title || "Generation",
          content: it.content,
          mime: "text/markdown",
          previewText: excerpt(it.content, 240),
          previewImageDataUrl: null,
          tags: [],
          createdAt: it.createdAt,
          updatedAt: it.createdAt,
        };
        snap.generations[gid] = gen;
        proj.generationIds.push(gid);
      }
    }

    snap.projects[proj.id] = proj;
  }

  lsSet(memKey, JSON.stringify(snap));
  lsDel(LEGACY_PROJECTS_KEY);
}
