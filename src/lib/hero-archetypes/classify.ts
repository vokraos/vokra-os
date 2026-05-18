import type { CompetitorSerpItem } from "../competitor-serp/types";
import type { OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import { HERO_ARCHETYPE_CATALOG } from "./archetypes";
import type { ArchetypeShare, MarketplaceHeroArchetype } from "./types";

function rowBlob(it: CompetitorSerpItem): string {
  return [
    it.heroImageNote,
    it.visualPattern,
    it.colorDominance,
    it.modelPresence,
    it.printReadability,
    it.perceivedPremiumLevel,
    it.differentiationNote,
    it.title,
  ]
    .join(" ")
    .toLowerCase();
}

export function ourBlob(o: OurCardCompetitiveSnapshot): string {
  return [
    o.heroImageNote,
    o.visualPattern,
    o.colorDominance,
    o.modelPresence,
    o.printReadability,
    o.perceivedPremiumLevel,
    o.differentiationNote,
    o.cardTitle,
  ]
    .join(" ")
    .toLowerCase();
}

/** Per-row scores (non-negative). */
export function scoreRowArchetypes(it: CompetitorSerpItem): Record<MarketplaceHeroArchetype, number> {
  const blob = rowBlob(it);
  const scores = {} as Record<MarketplaceHeroArchetype, number>;
  for (const def of HERO_ARCHETYPE_CATALOG) {
    let s = 0;
    for (const kw of def.dominantPatterns) {
      if (blob.includes(kw.toLowerCase())) s += 2.2;
    }
    for (const kw of def.dominantColors) {
      if (blob.includes(kw.toLowerCase())) s += 1.4;
    }
    scores[def.archetype] = s;
  }
  return scores;
}

export function aggregateSerpArchetypes(items: readonly CompetitorSerpItem[]): ArchetypeShare[] {
  if (!items.length) return [];
  const totals: Record<MarketplaceHeroArchetype, number> = {} as Record<MarketplaceHeroArchetype, number>;
  for (const def of HERO_ARCHETYPE_CATALOG) totals[def.archetype] = 0;
  for (const it of items) {
    const row = scoreRowArchetypes(it);
    for (const k of Object.keys(row) as MarketplaceHeroArchetype[]) {
      totals[k] += row[k] ?? 0;
    }
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const n = HERO_ARCHETYPE_CATALOG.length;
    return HERO_ARCHETYPE_CATALOG.map((d) => ({ archetype: d.archetype, sharePct: Math.round(100 / n) }));
  }
  return (Object.keys(totals) as MarketplaceHeroArchetype[])
    .map((archetype) => ({ archetype, sharePct: Math.round((100 * totals[archetype]!) / sum) }))
    .sort((a, b) => b.sharePct - a.sharePct);
}

export function classifyOurCard(o: OurCardCompetitiveSnapshot): ArchetypeShare[] {
  const fake: CompetitorSerpItem = {
    id: "our-card",
    position: 0,
    title: o.cardTitle,
    brand: "",
    price: o.price,
    rating: null,
    reviewCount: null,
    heroImageNote: o.heroImageNote,
    visualPattern: o.visualPattern,
    colorDominance: o.colorDominance,
    modelPresence: o.modelPresence,
    printReadability: o.printReadability,
    perceivedPremiumLevel: o.perceivedPremiumLevel,
    differentiationNote: o.differentiationNote,
  };
  const row = scoreRowArchetypes(fake);
  const sum = Object.values(row).reduce((a, b) => a + b, 0) || 1;
  return (Object.keys(row) as MarketplaceHeroArchetype[])
    .map((archetype) => ({ archetype, sharePct: Math.round((100 * row[archetype]!) / sum) }))
    .sort((a, b) => b.sharePct - a.sharePct)
    .filter((x) => x.sharePct > 0);
}

export function dominantArchetypes(shares: readonly ArchetypeShare[], minPct = 6): ArchetypeShare[] {
  return shares.filter((s) => s.sharePct >= minPct).slice(0, 5);
}

/** Heuristic: blob match strength for messaging. */
export function archetypeEvidenceStrength(blob: string, archetype: MarketplaceHeroArchetype): number {
  const def = HERO_ARCHETYPE_CATALOG.find((d) => d.archetype === archetype);
  if (!def) return 0;
  let n = 0;
  for (const kw of def.dominantPatterns) if (blob.includes(kw.toLowerCase())) n += 1;
  for (const kw of def.dominantColors) if (blob.includes(kw.toLowerCase())) n += 0.6;
  return n;
}
