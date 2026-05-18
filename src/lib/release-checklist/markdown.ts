import { RELEASE_CHECKLIST_ITEMS } from "./items";
import type { StabilityReleaseChecklist } from "./types";

function mdEscape(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function buildReleaseChecklistMarkdown(
  c: StabilityReleaseChecklist,
  t: (k: string, v?: Record<string, string>) => string,
): string {
  const lines: string[] = [];
  lines.push(`# ${t("rel.md.title")}`);
  lines.push("");
  lines.push(`- **${t("rel.md.label")}:** ${mdEscape(c.releaseLabel.trim() || "—")}`);
  lines.push(`- **${t("rel.md.id")}:** ${c.id}`);
  lines.push(`- **${t("rel.md.created")}:** ${new Date(c.createdAt).toISOString()}`);
  lines.push(`- **${t("rel.md.verdict")}:** ${t("rel.verdict." + c.verdict)}`);
  lines.push("");
  lines.push(`## ${t("rel.md.checklist")}`);
  lines.push("");
  lines.push("| " + t("rel.md.colItem") + " | " + t("rel.md.colStatus") + " |");
  lines.push("| --- | --- |");
  for (const row of RELEASE_CHECKLIST_ITEMS) {
    const pass = c.checkedItems.includes(row.id);
    const fail = c.failedItems.includes(row.id);
    const status = fail ? t("rel.status.fail") : pass ? t("rel.status.pass") : t("rel.status.pending");
    lines.push(`| ${mdEscape(t("rel.item." + row.id))} | ${status} |`);
  }
  lines.push("");
  if (c.warnings.length) {
    lines.push(`## ${t("rel.md.warnings")}`);
    for (const w of c.warnings) lines.push(`- ${mdEscape(w)}`);
    lines.push("");
  }
  if (c.confidenceNote.trim()) {
    lines.push(`## ${t("rel.field.confidence")}`);
    lines.push("");
    lines.push(c.confidenceNote.trim());
    lines.push("");
  }
  if (c.notes.trim()) {
    lines.push(`## ${t("rel.field.notes")}`);
    lines.push("");
    lines.push(c.notes.trim());
    lines.push("");
  }
  return lines.join("\n");
}
