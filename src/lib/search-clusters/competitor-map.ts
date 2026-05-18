import type { EntitySnapshot } from "../entity-snapshot/types";
import type { CompetitorCorridorEntity } from "./types";
import { heroPatternsFromTitles } from "./cluster-derive";

function ccId(parts: readonly string[]): string {
  const s = parts.join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `cc_${(h >>> 0).toString(36)}`;
}

function dominantMarketplace(rows: { marketplace: string }[]): string {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const m = (r.marketplace || "unknown").trim() || "unknown";
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  let top = "unknown";
  let n = 0;
  for (const [k, v] of counts) {
    if (v > n) {
      n = v;
      top = k;
    }
  }
  return top;
}

function inferVisualStyle(titles: string[]): string {
  const blob = titles.join(" ").toLowerCase();
  if (/anime|manga/i.test(blob)) return "anime_flat";
  if (/luxury|quiet|linen|minimal/i.test(blob)) return "quiet_luxury";
  if (/street|urban|graffiti/i.test(blob)) return "street_graphic";
  if (/gift|подар/i.test(blob)) return "gift_ready";
  return "mixed_marketplace";
}

function inferHeroApproach(patterns: string[]): string {
  if (patterns.includes("anime_hero")) return "character_hero_first";
  if (patterns.includes("dark_typography")) return "type_forward_hero";
  if (patterns.includes("lifestyle_model")) return "studio_lifestyle";
  return "balanced_split";
}

/** Competitor corridor map — manual-import topology, future-ready for richer inputs. */
export function deriveCompetitorCorridors(snapshot: EntitySnapshot): CompetitorCorridorEntity[] {
  const out: CompetitorCorridorEntity[] = [];
  for (const corridor of snapshot.corridors) {
    const skus = snapshot.skuEntities.filter((s) => (s.corridor || "").trim() === corridor.trim());
    const cards = snapshot.cardEntities.filter((c) => (c.corridor || "").trim() === corridor.trim());
    if (skus.length === 0 && cards.length === 0) continue;

    const titles = [...skus.map((s) => s.title), ...cards.map((c) => c.cardTitle)];
    const patterns = heroPatternsFromTitles(titles);
    const marketplace = dominantMarketplace([...skus.map((s) => ({ marketplace: s.marketplace })), ...cards.map((c) => ({ marketplace: c.marketplace }))]);

    const mass = skus.length + cards.length;
    const saturationRisk = Math.min(100, Math.round(Math.log1p(mass) * 20 + patterns.length * 10));
    const overlapRisk = Math.min(100, Math.round(saturationRisk * 0.55 + (patterns.includes("anime_hero") ? 14 : 0)));
    const pressureLevel = Math.min(100, Math.round(saturationRisk * 0.45 + overlapRisk * 0.45));

    let gap = "cmap.gap.refresh_visual_language";
    if (saturationRisk < 40) gap = "cmap.gap.weak_visual_competition";
    if (patterns.includes("dark_typography") && saturationRisk > 60) gap = "cmap.gap.hero_style_refresh";

    out.push({
      id: ccId(["cc", snapshot.id, corridor, marketplace]),
      corridor,
      marketplace,
      visualStyle: inferVisualStyle(titles),
      heroApproach: inferHeroApproach(patterns),
      saturationRisk,
      overlapRisk,
      pressureLevel,
      dominantPatterns: patterns,
      differentiationGap: gap,
      relatedClusters: [],
    });
  }
  return out.sort((a, b) => b.pressureLevel - a.pressureLevel);
}

export function getSampleCompetitorCorridors(): CompetitorCorridorEntity[] {
  return [
    {
      id: ccId(["sample", "cc1"]),
      corridor: "Graphic tees",
      marketplace: "wildberries",
      visualStyle: "street_graphic",
      heroApproach: "type_forward_hero",
      saturationRisk: 76,
      overlapRisk: 52,
      pressureLevel: 68,
      dominantPatterns: ["dark_typography", "graphic_print_forward"],
      differentiationGap: "cmap.gap.hero_style_refresh",
      relatedClusters: [],
    },
    {
      id: ccId(["sample", "cc2"]),
      corridor: "Premium knits",
      marketplace: "ozon",
      visualStyle: "quiet_luxury",
      heroApproach: "studio_lifestyle",
      saturationRisk: 36,
      overlapRisk: 24,
      pressureLevel: 32,
      dominantPatterns: ["quiet_luxury_flat"],
      differentiationGap: "cmap.gap.weak_visual_competition",
      relatedClusters: [],
    },
  ];
}
