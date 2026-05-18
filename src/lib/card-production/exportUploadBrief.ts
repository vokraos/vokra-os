import type { CardProductionPlan, MarketplaceUploadBrief } from "./types";

export function uploadBriefToMarkdown(brief: MarketplaceUploadBrief, plan: CardProductionPlan): string {
  const lines: string[] = [
    `# Marketplace upload brief`,
    "",
    `**Plan:** ${plan.cardTitle} · **Brief id:** ${brief.id}`,
    `**Marketplace:** ${brief.marketplace} · **SKU family:** ${brief.targetSkuFamily}`,
    "",
    "## WB title",
    brief.wbTitle || "—",
    "",
    "## Ozon title",
    brief.ozonTitle || "—",
    "",
    "## Short description",
    brief.shortDescription || "—",
    "",
    "## Full description",
    brief.fullDescription || "—",
    "",
    "## Keywords",
    brief.keywords.length ? brief.keywords.map((k) => `- ${k}`).join("\n") : "—",
    "",
    "## Rich content order",
    brief.richContentOrder.length ? brief.richContentOrder.map((x, i) => `${i + 1}. ${x}`).join("\n") : "—",
    "",
    "## Image order (manual upload sequence)",
    ...brief.imageOrder.map((row) => `${row.step}. **${row.slot}** → \`${row.assetId ?? "—"}\``),
    "",
    "## Hero / support / detail / grid ids",
    `- hero: ${brief.heroImageAssetId ?? "—"}`,
    `- support: ${brief.supportImageAssetIds.join(", ") || "—"}`,
    `- detail: ${brief.detailImageAssetIds.join(", ") || "—"}`,
    `- size grid: ${brief.sizeGridAssetId ?? "—"}`,
    "",
    "## Price positioning",
    brief.pricePositioningNote || "—",
    "",
    "## Category note",
    brief.categoryNote || "—",
    "",
    "## Attributes checklist (operator)",
    brief.attributesChecklist.map((id) => `- [ ] ${id}`).join("\n"),
    "",
    "## Compliance warnings",
    brief.complianceWarnings.length ? brief.complianceWarnings.map((x) => `- ${x}`).join("\n") : "—",
    "",
    "## Missing items",
    brief.missingItems.length ? brief.missingItems.map((x) => `- ${x}`).join("\n") : "—",
    "",
    "## Upload readiness",
    brief.uploadReadiness,
  ];
  return lines.join("\n");
}

export function uploadBriefToJson(brief: MarketplaceUploadBrief, plan: CardProductionPlan): string {
  return JSON.stringify({ brief, planId: plan.id, cardTitle: plan.cardTitle }, null, 2);
}

export function uploadBriefPlainCopy(brief: MarketplaceUploadBrief): string {
  return [
    "=== WB TITLE ===",
    brief.wbTitle,
    "",
    "=== OZON TITLE ===",
    brief.ozonTitle,
    "",
    "=== DESCRIPTION (full) ===",
    brief.fullDescription,
    "",
    "=== KEYWORDS ===",
    brief.keywords.join(", "),
  ].join("\n");
}
