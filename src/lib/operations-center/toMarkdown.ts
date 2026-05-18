import type { OperationsCenterSnapshot } from "./types";

function line(s: string) {
  return `${s}\n`;
}

export function operationsCenterToMarkdown(snap: OperationsCenterSnapshot, title: string): string {
  const ts = new Date(snap.computedAt).toISOString();
  let md = "";
  md += line(`# ${title}`);
  md += line("");
  md += line(`- **Schema**: v${snap.schemaVersion}`);
  md += line(`- **Computed at (export time)**: ${ts}`);
  md += line(`- **Provenance policy**: every metric is labeled in the UI as estimated / inferred / memory-derived / manual.`);
  md += line("");
  md += line("## Memory-derived signals");
  md += line(`- Project: ${snap.memory.projectTitle ?? "—"}`);
  md += line(`- SKUs: ${snap.memory.skuCount.value} (${snap.memory.skuCount.provenance})`);
  md += line(`- Generations (30d): ${snap.memory.generationCount30d.value} (${snap.memory.generationCount30d.provenance})`);
  md += line(`- Visual analyses: ${snap.memory.visualAnalysisCount.value} (${snap.memory.visualAnalysisCount.provenance})`);
  md += line(`- Categories (unique): ${snap.memory.uniqueCategories.value} (${snap.memory.uniqueCategories.provenance})`);
  md += line("");
  md += line("## Operational score");
  md += line(`- Total: **${snap.operationalScore.total.value}** (${snap.operationalScore.total.provenance})`);
  md += line(`- Memory coverage: ${snap.operationalScore.memoryCoverage.value}`);
  md += line(`- SKU discipline: ${snap.operationalScore.skuDiscipline.value}`);
  md += line(`- Content velocity: ${snap.operationalScore.contentVelocity.value}`);
  md += line(`- Manual alignment: ${snap.operationalScore.manualAlignment.value}`);
  md += line("");
  md += line("## Marketplace health (band model)");
  md += line(`- Index: **${snap.marketplaceHealth.index.value}** (${snap.marketplaceHealth.index.provenance})`);
  md += line("");
  md += line("## Alerts");
  for (const a of snap.alerts) {
    md += line(`- [${a.severity.toUpperCase()}] **${a.titleKey}** (${a.provenance}) — ${a.bodyKey}`);
  }
  md += line("");
  md += line("## AI recommendations");
  for (const r of snap.recommendations) {
    md += line(`- **${r.priority}** ${r.actionKey} — ${r.rationaleKey} (${r.provenance})`);
  }
  md += line("");
  md += line("## SKU heatmap (inferred intensity)");
  for (const c of snap.skuHeatmap) {
    md += line(`- ${c.label} · ${c.category} · tier=${c.tier} · intensity=${c.intensity.value} (${c.intensity.provenance})`);
  }
  md += line("");
  md += line("## Manual brief (stored locally)");
  md += line(`- Priority SKUs note length: ${snap.manual.prioritySkus.trim().length} chars`);
  md += line(`- Runway notes length: ${snap.manual.runwayNotes.trim().length} chars`);
  md += line(`- Production note length: ${snap.manual.productionBottleneckNote.trim().length} chars`);
  md += line("");
  return md.trimEnd() + "\n";
}

export function operationsCenterToJson(snap: OperationsCenterSnapshot): string {
  return JSON.stringify(snap, null, 2);
}
