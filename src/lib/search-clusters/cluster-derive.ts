import type { EntitySnapshot } from "../entity-snapshot/types";
import type { SearchClusterEntity, SearchClusterType } from "./types";

function scId(parts: readonly string[]): string {
  const s = parts.join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `sc_${(h >>> 0).toString(36)}`;
}

export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9а-яё\s·.-]/gi, "")
    .trim();
}

function inferClusterType(corridor: string, family: string, titleSample: string): SearchClusterType {
  const blob = `${corridor} ${family} ${titleSample}`.toLowerCase();
  if (/подар|gift|gifting|dad|mom/i.test(blob)) return "gift";
  if (/anime|manga|kawaii|streetwear|hype/i.test(blob)) return "trend";
  if (/luxury|quiet|premium|atelier|minimal/i.test(blob)) return "brand_style";
  if (/limited|drop|collab|capsule/i.test(blob)) return "niche";
  if (/hero|main photo|главн/i.test(blob)) return "hero";
  if (family.length > 2 && family.length < 28 && !/\s{2,}/.test(family)) return "corridor";
  if (titleSample.length > 80) return "broad";
  if (/test|sample|draft|lab/i.test(blob)) return "experimental";
  return "corridor";
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

export function heroPatternsFromTitles(titles: string[]): string[] {
  const patterns = new Set<string>();
  const blob = titles.join(" ").toLowerCase();
  if (/anime|manga|character/i.test(blob)) patterns.add("anime_hero");
  if (/dark|черн|black\s+letter|gothic/i.test(blob)) patterns.add("dark_typography");
  if (/minimal|clean|mono|linen/i.test(blob)) patterns.add("quiet_luxury_flat");
  if (/dtf|print|принт|graphic/i.test(blob)) patterns.add("graphic_print_forward");
  if (/lifestyle|model|studio/i.test(blob)) patterns.add("lifestyle_model");
  if (patterns.size === 0) patterns.add("mixed_visual");
  return [...patterns];
}

/** Derive search clusters from activated entity snapshot (import-driven topology only). */
export function deriveSearchClustersFromSnapshot(snapshot: EntitySnapshot): SearchClusterEntity[] {
  const out: SearchClusterEntity[] = [];
  const seenCorridors = new Set(snapshot.corridors);

  for (const corridor of seenCorridors) {
    const skus = snapshot.skuEntities.filter((s) => (s.corridor || "").trim() === corridor.trim());
    const cards = snapshot.cardEntities.filter((c) => (c.corridor || "").trim() === corridor.trim());
    if (skus.length === 0 && cards.length === 0) continue;

    const allRows = [...skus.map((s) => ({ marketplace: s.marketplace })), ...cards.map((c) => ({ marketplace: c.marketplace }))];
    const marketplace = dominantMarketplace(allRows);

    const family = skus[0]?.productFamily?.trim() || cards[0]?.seoCluster?.trim() || corridor;
    const titleSample = [...skus.map((s) => s.title), ...cards.map((c) => c.cardTitle)].slice(0, 4).join(" · ");
    const query = `${corridor} · ${family}`;
    const normalizedQuery = normalizeQuery(query);

    const heroSku = skus.filter((s) => s.heroCandidate).length;
    const heroCard = cards.filter((c) => c.heroCandidate || !c.missingHero).length;
    const heroSignals = heroSku + heroCard;
    const denom = Math.max(1, skus.length + cards.length);
    const heroDensity = Math.min(100, Math.round((100 * heroSignals) / denom));

    const clusterType = inferClusterType(corridor, family, titleSample);
    const patterns = heroPatternsFromTitles([...skus.map((s) => s.title), ...cards.map((c) => c.cardTitle)]);

    const visualPressure = Math.min(
      100,
      Math.round(skus.filter((s) => s.refreshCandidate).length * 12 + cards.filter((c) => c.missingSeo).length * 8 + heroDensity * 0.35),
    );

    const densityScore = Math.min(100, Math.round(Math.log1p(skus.length + cards.length) * 22));
    const estimatedCompetition = Math.min(100, Math.round(densityScore * 0.55 + heroDensity * 0.35 + visualPressure * 0.1));

    const id = scId(["cluster", snapshot.id, corridor, marketplace]);

    out.push({
      id,
      query,
      normalizedQuery,
      corridor,
      marketplace,
      clusterType,
      heroDensity,
      overlapRisk: 0,
      saturationLevel: densityScore,
      visualPressure,
      estimatedCompetition,
      heroPatterns: patterns,
      competitorGroups: [`cg_${marketplace}_${normalizeQuery(corridor).slice(0, 12)}`],
      relatedSkuIds: skus.map((s) => s.id),
      relatedCardIds: cards.map((c) => c.id),
      notes: "",
    });
  }

  for (const cl of out) {
    const parts: string[] = [];
    if (cl.heroDensity >= 62) parts.push("high_hero_density");
    if (cl.saturationLevel >= 58) parts.push("dense_corridor");
    if (cl.visualPressure >= 52) parts.push("visual_churn_signal");
    cl.notes = parts.length ? parts.join(",") : "balanced_topology";
  }

  return out.sort((a, b) => b.estimatedCompetition - a.estimatedCompetition);
}

export function getSampleSearchClusters(): SearchClusterEntity[] {
  const now = "sample";
  return [
    {
      id: scId(["sample", "c1", now]),
      query: "Dark typography · oversized tee",
      normalizedQuery: normalizeQuery("Dark typography · oversized tee"),
      corridor: "Graphic tees",
      marketplace: "wildberries",
      clusterType: "broad",
      heroDensity: 72,
      overlapRisk: 48,
      saturationLevel: 78,
      visualPressure: 70,
      estimatedCompetition: 76,
      heroPatterns: ["dark_typography", "graphic_print_forward"],
      competitorGroups: ["cg_wb_graphic"],
      relatedSkuIds: [],
      relatedCardIds: [],
      notes: "sample_topology_dark_typography",
    },
    {
      id: scId(["sample", "c2", now]),
      query: "Anime hero · fan merch",
      normalizedQuery: normalizeQuery("Anime hero · fan merch"),
      corridor: "Licensed characters",
      marketplace: "wildberries",
      clusterType: "trend",
      heroDensity: 81,
      overlapRisk: 64,
      saturationLevel: 62,
      visualPressure: 58,
      estimatedCompetition: 74,
      heroPatterns: ["anime_hero", "lifestyle_model"],
      competitorGroups: ["cg_wb_anime"],
      relatedSkuIds: [],
      relatedCardIds: [],
      notes: "sample_topology_anime_overlap",
    },
    {
      id: scId(["sample", "c3", now]),
      query: "Quiet luxury · knits",
      normalizedQuery: normalizeQuery("Quiet luxury · knits"),
      corridor: "Premium knits",
      marketplace: "ozon",
      clusterType: "brand_style",
      heroDensity: 38,
      overlapRisk: 22,
      saturationLevel: 34,
      visualPressure: 40,
      estimatedCompetition: 32,
      heroPatterns: ["quiet_luxury_flat"],
      competitorGroups: ["cg_ozon_lux"],
      relatedSkuIds: [],
      relatedCardIds: [],
      notes: "sample_topology_weak_competition_pocket",
    },
  ];
}
