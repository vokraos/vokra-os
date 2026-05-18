import type { HeroLaunchPackage } from "./types";

export function heroLaunchPackageToPlainText(pkg: HeroLaunchPackage): string {
  const lines = [
    `Hero Launch Package · ${pkg.query} · ${pkg.marketplace}`,
    `Created: ${new Date(pkg.createdAt).toISOString()}`,
    `Readiness: ${pkg.readiness}`,
    "",
    "## Winner",
    pkg.heroDirection,
    "",
    "## Why selected",
    pkg.whyWinner,
    "",
    "## Target usage",
    pkg.targetUsage,
    "",
    "## Source prompt / reasoning",
    pkg.sourcePrompt,
    "",
    `Visual asset: ${pkg.visualAssetId ?? "—"}`,
    `Card plan: ${pkg.cardPlanId ?? "—"}`,
    "",
    "## Card update checklist",
    ...pkg.cardUpdateChecklist.map((x, i) => `${i + 1}. [ ] ${x}`),
    "",
    "## SEO notes",
    ...pkg.seoNotes.map((x) => `- ${x}`),
    "",
    "## Title notes",
    ...pkg.titleNotes.map((x) => `- ${x}`),
    "",
    "## Rich content notes",
    ...pkg.richContentNotes.map((x) => `- ${x}`),
    "",
    "## Marketplace warnings",
    ...pkg.marketplaceWarnings.map((x) => `- ${x}`),
    "",
    "## Post-launch monitoring",
    ...pkg.postLaunchMonitoring.map((x, i) => `${i + 1}. [ ] ${x}`),
  ];
  if (pkg.missingItems.length) {
    lines.push("", "## Missing before launch", ...pkg.missingItems.map((x) => `- ${x}`));
  }
  lines.push("", "_Manual launch discipline only — no WB/Ozon upload, no CTR claims._");
  return lines.join("\n");
}

export function heroLaunchPackageToMarkdown(pkg: HeroLaunchPackage): string {
  const esc = (s: string) => s.replace(/\|/g, "\\|");
  const md = [
    `# Hero Launch Package`,
    ``,
    `**Query:** ${esc(pkg.query)}  `,
    `**Marketplace:** ${esc(pkg.marketplace)}  `,
    `**Readiness:** ${pkg.readiness}  `,
    `**Winner variant:** \`${pkg.winningVariantId}\`  `,
    `**Visual asset:** ${pkg.visualAssetId ? `\`${pkg.visualAssetId}\`` : "—"}  `,
    `**Card plan:** ${pkg.cardPlanId ? `\`${pkg.cardPlanId}\`` : "—"}  `,
    ``,
    `## Winning hero direction`,
    pkg.heroDirection,
    ``,
    `## Why winner`,
    pkg.whyWinner,
    ``,
    `## Target usage`,
    pkg.targetUsage,
    ``,
    `## Source prompt / reasoning`,
    "```",
    pkg.sourcePrompt,
    "```",
    ``,
    `## Card update checklist`,
    ...pkg.cardUpdateChecklist.map((x) => `- [ ] ${x}`),
    ``,
    `## SEO notes`,
    ...pkg.seoNotes.map((x) => `- ${x}`),
    ``,
    `## Title notes`,
    ...pkg.titleNotes.map((x) => `- ${x}`),
    ``,
    `## Rich content notes`,
    ...pkg.richContentNotes.map((x) => `- ${x}`),
    ``,
    `## Marketplace warnings`,
    ...pkg.marketplaceWarnings.map((x) => `- ${x}`),
    ``,
    `## Post-launch monitoring (manual)`,
    ...pkg.postLaunchMonitoring.map((x) => `- [ ] ${x}`),
  ];
  if (pkg.missingItems.length) {
    md.push(``, `## Missing items`, ...pkg.missingItems.map((x) => `- ${x}`));
  }
  md.push(``, `---`, `_Human-ready package — no API upload, no automation, no CTR claims._`);
  return md.join("\n");
}
