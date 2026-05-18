import type { HeroTestMatrix } from "../hero-test-matrix/types";
import type { HeroTestResultsBundle } from "./types";

export function heroTestResultsToPlainText(matrix: HeroTestMatrix, bundle: HeroTestResultsBundle): string {
  const lines = [
    `Hero Test Results · ${bundle.query} · ${bundle.marketplace}`,
    `Matrix: ${bundle.sourceMatrixId}`,
    `Updated: ${new Date(bundle.updatedAt).toISOString()}`,
    "",
    "## Baseline",
    matrix.baselineHeroDirection,
    "",
    "## Variant results",
  ];

  for (const r of bundle.results) {
    const v = matrix.testVariants.find((x) => x.id === r.sourceVariantId);
    lines.push(
      "",
      `### ${v?.variantName ?? r.sourceVariantId}`,
      `Status: ${r.resultStatus}`,
      `Changed: ${v?.changedVariable ?? "—"}`,
      `Final use: ${r.finalUse}`,
      `Selected note: ${r.selectedVisualNote || "—"}`,
      `Why selected: ${r.whySelected || "—"}`,
      `Why rejected: ${r.whyRejected || "—"}`,
      `Issue: ${r.issueFound || "—"}`,
      `Revision: ${r.revisionInstruction || "—"}`,
      `Confidence: ${r.decisionConfidence || "—"}`,
      `Scores: readability ${r.qualityScores.readability ?? "—"}, premium ${r.qualityScores.premiumPerception ?? "—"}, print ${r.qualityScores.printVisibility ?? "—"}, clarity ${r.qualityScores.marketplaceClarity ?? "—"}, brand ${r.qualityScores.brandFit ?? "—"}, fatigue resist ${r.qualityScores.fatigueResistance ?? "—"}`,
    );
  }

  if (bundle.winnerVariantId) {
    lines.push("", "## Winner summary", bundle.winnerSummary);
    lines.push("", "## Recommended next actions", ...bundle.recommendedNextActions.map((a, i) => `${i + 1}. ${a}`));
  }

  lines.push("", "_Manual visual review only — no CTR claims, no image storage._");
  return lines.join("\n");
}

export function heroTestResultsToMarkdown(matrix: HeroTestMatrix, bundle: HeroTestResultsBundle): string {
  const esc = (s: string) => s.replace(/\|/g, "\\|");
  const md = [
    `# Hero Test Results`,
    ``,
    `**Query:** ${esc(bundle.query)}  `,
    `**Marketplace:** ${esc(bundle.marketplace)}  `,
    `**Matrix ID:** \`${bundle.sourceMatrixId}\`  `,
    ``,
    `## Baseline direction`,
    matrix.baselineHeroDirection,
    ``,
    `## Variant decisions`,
  ];

  for (const r of bundle.results) {
    const v = matrix.testVariants.find((x) => x.id === r.sourceVariantId);
    md.push(
      ``,
      `### ${v?.variantName ?? r.sourceVariantId}`,
      ``,
      `| Field | Value |`,
      `| --- | --- |`,
      `| Status | ${r.resultStatus} |`,
      `| Changed variable | ${v?.changedVariable ?? "—"} |`,
      `| Final use | ${r.finalUse} |`,
      `| Selected visual note | ${esc(r.selectedVisualNote || "—")} |`,
      `| Why selected | ${esc(r.whySelected || "—")} |`,
      `| Why rejected | ${esc(r.whyRejected || "—")} |`,
      `| Issue found | ${esc(r.issueFound || "—")} |`,
      `| Revision instruction | ${esc(r.revisionInstruction || "—")} |`,
      `| Decision confidence | ${esc(r.decisionConfidence || "—")} |`,
      ``,
      `**Quality scores (1–5):** readability ${r.qualityScores.readability ?? "—"}, premium ${r.qualityScores.premiumPerception ?? "—"}, print visibility ${r.qualityScores.printVisibility ?? "—"}, marketplace clarity ${r.qualityScores.marketplaceClarity ?? "—"}, brand fit ${r.qualityScores.brandFit ?? "—"}, fatigue resistance ${r.qualityScores.fatigueResistance ?? "—"}`,
    );
  }

  if (bundle.winnerVariantId) {
    md.push(``, `## Winner summary`, bundle.winnerSummary, ``, `## Recommended next actions`, ...bundle.recommendedNextActions.map((a) => `- ${a}`));
  }

  md.push(``, `---`, `_Manual test review — no scraping, no image AI, no CTR/A/B claims._`);
  return md.join("\n");
}
