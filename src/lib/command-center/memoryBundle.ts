import {
  getActiveProjectId,
  getGeneration,
  getProject,
  getProjectTimeline,
  getVisualAnalysis,
  listSkusForProject,
} from "../memory";

import { clip } from "../math";

const MAX_TOTAL = 14_000;
const PER_GEN = 900;
const PER_VIS = 700;

const RELEVANT_MODULES = new Set(["trend_radar", "competitor_analysis", "strategic_command"]);

/**
 * Aggregates Project Memory for the meta-layer prompt (excerpts only).
 * Does not duplicate full Trend Radar JSON — passes short excerpts for synthesis.
 */
export function buildCommandCenterMemoryBundle(
  projectId: string | null | undefined,
  locale: "ru" | "en",
): { text: string; projectTitle: string | null } {
  const pid = (projectId ?? getActiveProjectId())?.trim() || null;
  if (!pid) {
    return {
      text:
        locale === "ru"
          ? "## Project memory\n(Активный проект не выбран — синтез только по запросу и скриншотам.)"
          : "## Project memory\n(No active project — synthesis uses only the query, goal, and screenshots.)",
      projectTitle: null,
    };
  }

  const p = getProject(pid);
  if (!p) {
    return {
      text: locale === "ru" ? "## Project memory\n(Проект не найден.)" : "## Project memory\n(Project not found.)",
      projectTitle: null,
    };
  }

  const lines: string[] = [];
  lines.push("## Project memory capsule");
  lines.push(`- **Project:** ${p.title}`);
  if (p.description.trim()) lines.push(`- **Description:** ${clip(p.description, 400)}`);
  if (p.tags.length) lines.push(`- **Tags:** ${p.tags.join(", ")}`);

  const skus = listSkusForProject(pid);
  if (skus.length) {
    lines.push("", "### SKUs (anchors)");
    for (const s of skus.slice(0, 12)) {
      lines.push(`- **${s.name}** · ${s.marketplace} · ${s.category}`);
    }
  }

  const timeline = getProjectTimeline(pid, "all").slice(0, 35);
  const genBlocks: string[] = [];
  let used = lines.join("\n").length;

  for (const row of timeline) {
    if (used >= MAX_TOTAL) break;
    if (row.kind === "generation") {
      const g = getGeneration(row.id);
      if (!g) continue;
      if (!RELEVANT_MODULES.has(g.module)) continue;
      const body = g.mime === "application/json" ? clip(g.content, PER_GEN) : clip(g.content, PER_GEN);
      const modLabel =
        g.module === "trend_radar"
          ? "Trend Radar (excerpt)"
          : g.module === "competitor_analysis"
            ? "Competitor Intelligence (excerpt)"
            : "Prior Command Center (excerpt)";
      genBlocks.push(`#### ${modLabel} · ${g.title}\n${body}`);
      used += genBlocks[genBlocks.length - 1]!.length;
    } else if (row.kind === "visual") {
      const v = getVisualAnalysis(row.id);
      if (!v) continue;
      const ex = clip(v.previewText || v.analysisJson, PER_VIS);
      genBlocks.push(`#### Visual Intelligence · ${v.title}\n${ex}`);
      used += genBlocks[genBlocks.length - 1]!.length;
    }
  }

  if (genBlocks.length) {
    lines.push("", "### Recent module outputs (read-only context)");
    lines.push(
      locale === "ru"
        ? "_Синтезируй мета-слой: не копируй длинные списки карт и агентов Trend Radar — дай краткий executive read и конфликты/пробелы._"
        : "_Synthesize a meta read: do not duplicate long Trend Radar card lists — give executive cross-checks and gaps._",
    );
    lines.push("", ...genBlocks);
  } else {
    lines.push(
      "",
      locale === "ru"
        ? "_В проекте пока нет сохранённых отчётов Trend Radar / Competitor / Visual — опирайся на запрос и скриншоты._"
        : "_No saved Trend Radar / Competitor / Visual reports in this project yet — lean on query, goal, and screenshots._",
    );
  }

  let text = lines.join("\n");
  if (text.length > MAX_TOTAL) text = `${text.slice(0, MAX_TOTAL - 20)}… [truncated]`;

  return { text, projectTitle: p.title };
}
