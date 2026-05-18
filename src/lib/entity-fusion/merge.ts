import type { ImportedRowSummary, MatchedEntityRef, MergeIntent, MergeIntentKind } from "./types";

function intentLabelKey(kind: MergeIntentKind): string {
  switch (kind) {
    case "attach_import_to_sku":
      return "fusion.merge.attach_import_to_sku";
    case "link_offer_to_plan":
      return "fusion.merge.link_offer_to_plan";
    case "bind_hero_visual":
      return "fusion.merge.bind_hero_visual";
    default:
      return "fusion.merge.patch_wave_readiness";
  }
}

/** Structural merge queue — no writes to session or APIs. */
export function buildMergeIntents(
  rows: readonly ImportedRowSummary[],
  matched: readonly MatchedEntityRef[],
): MergeIntent[] {
  const intents: MergeIntent[] = [];
  let n = 0;
  for (const m of matched) {
    const rowKey = m.matchedFromRowKeys[0] ?? rows[0]?.rowKey ?? "row:unknown";
    let kind: MergeIntentKind = "attach_import_to_sku";
    if (m.kind === "card_production_plan") kind = rows.find((r) => r.source === "ozon") ? "link_offer_to_plan" : "attach_import_to_sku";
    if (m.kind === "visual_asset") kind = "bind_hero_visual";
    if (m.kind === "launch_wave") kind = "patch_wave_readiness";
    n += 1;
    intents.push({
      id: `intent_${n}`,
      kind,
      labelKey: intentLabelKey(kind),
      sourceRowKey: rowKey,
      targetEntityId: m.id,
      proposedConfidence: m.confidence,
    });
  }
  return intents.slice(0, 12);
}
