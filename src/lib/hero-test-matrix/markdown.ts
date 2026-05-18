import type { HeroTestMatrix, HeroTestVariant } from "./types";

function variantBlock(v: HeroTestVariant, index: number): string[] {
  return [
    `### ${index + 1}. ${v.variantName}`,
    ``,
    `**Changed variable(s):** ${v.changedVariable}  `,
    `**Hypothesis:** ${v.hypothesis}  `,
    `**Visual direction:** ${v.visualDirection}  `,
    `**Readability goal:** ${v.readabilityGoal}  `,
    `**Archetype direction:** ${v.archetypeDirection}  `,
    `**Fatigue goal:** ${v.fatigueGoal}  `,
    `**Premium goal:** ${v.premiumGoal}  `,
    `**Hold constant:** ${v.unchangedVariables.slice(0, 6).join(", ")}${v.unchangedVariables.length > 6 ? "…" : ""}  `,
    ``,
    `**Danger zones:**`,
    ...v.dangerZones.map((d) => `- ${d}`),
    ``,
  ];
}

export function heroTestMatrixToPlainText(matrix: HeroTestMatrix): string {
  const lines = [
    `Hero Test Matrix · ${matrix.query} · ${matrix.marketplace}`,
    `Battle plan source: ${matrix.sourceBattlePlanId}`,
    `Created: ${new Date(matrix.createdAt).toISOString()}`,
    "",
    "## Baseline direction",
    matrix.baselineHeroDirection,
    "",
    "## Testing focus",
    matrix.testingFocus,
    "",
    "## Variants",
    ...matrix.testVariants.flatMap((v, i) => variantBlock(v, i)),
    "## Rollout order",
    ...matrix.rolloutRecommendation.map((r, i) => `${i + 1}. ${r}`),
    "",
    "## Marketplace constraints",
    ...matrix.marketplaceConstraints.map((c) => `- ${c}`),
    "",
    "## Risks",
    ...matrix.riskNotes.map((r) => `- ${r}`),
    "",
    "## Confidence",
    matrix.confidenceNote,
  ];
  return lines.join("\n");
}

export function heroTestMatrixToMarkdown(matrix: HeroTestMatrix): string {
  const esc = (s: string) => s.replace(/\|/g, "\\|");
  const md = [
    `# Hero Test Matrix`,
    ``,
    `**Query:** ${esc(matrix.query)}  `,
    `**Marketplace:** ${esc(matrix.marketplace)}  `,
    `**Source battle plan:** \`${matrix.sourceBattlePlanId}\`  `,
    ``,
    `## Baseline hero direction`,
    matrix.baselineHeroDirection,
    ``,
    `## Testing focus`,
    matrix.testingFocus,
    ``,
    `## Test variants`,
    ...matrix.testVariants.flatMap((v, i) => variantBlock(v, i)),
    `## Recommended rollout order`,
    ...matrix.rolloutRecommendation.map((x) => `- ${x}`),
    ``,
    `## Marketplace safety`,
    ...matrix.marketplaceConstraints.map((x) => `- ${x}`),
    ``,
    `## Risk notes`,
    ...matrix.riskNotes.map((x) => `- ${x}`),
    ``,
    `## Confidence`,
    matrix.confidenceNote,
    ``,
    `---`,
    `_Structured visual experimentation plan only — no scraping, no image AI, no fake A/B or CTR claims._`,
  ];
  return md.join("\n");
}
