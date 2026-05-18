/** Demo SKU / corridor snippets for cognitive depth UI — presentation only, no catalog engine. */

const CORRIDORS = [
  "archive luxury",
  "quiet streetwear",
  "dark anime",
  "brutal typography",
  "washed vintage",
  "monochrome giftwear",
  "corporate cleanwear",
  "premium basics",
] as const;

const PRINT_FAMILIES = [
  "Черный oversize",
  "Off-white база",
  "Navy minimal",
  "Earth tone capsule",
] as const;

/** SEO / cluster labels — marketplace-native Russian phrasing (presentation only). */
const CLUSTER_LABELS_RU = [
  "чёрная футболка оверсайз принт",
  "архив люкс oversize жаккард",
  "dark anime oversize винтаж",
  "типографика brutal · база",
  "washed vintage · меланж",
  "giftwear минимал · лента",
  "корпоративный cleanwear",
  "premium basics · плотный трикотаж",
] as const;

const CARD_TITLES = [
  "Card · Archival night ink",
  "Card · Quiet street base v3",
  "Card · Anime void stack",
  "Card · Brutal type capsule",
  "Card · Washed capsule 02",
  "Card · Gift ribbon pack",
  "Card · Corporate shell",
  "Card · Premium rib crew",
] as const;

const REGIONS_RU = [
  "Южный FBO",
  "Центральный FBO-2",
  "Северо-Запад FBO",
  "Московский склад-press",
  "Казанский fulfillment",
  "Дальний Восток FBO-lite",
] as const;

const PRODUCTION_LANES = [
  "DTF-α corridor",
  "DTF-β overnight",
  "Press-lane 1",
  "Packaging-K",
  "Visual refresh lane",
  "FBO prep stream",
] as const;

const SEMANTIC_TERRITORIES = [
  "dark anime lattice",
  "archive luxury ridge",
  "quiet streetwear basin",
  "premium basics plain",
  "brutal typography edge",
  "washed vintage drift",
] as const;

export function demoSkuId(seed: number): string {
  const n = 77000000 + (Math.abs(seed) % 899999);
  return `WB-${n}`;
}

export function demoCorridor(seed: number): string {
  return CORRIDORS[Math.abs(seed) % CORRIDORS.length]!;
}

export function demoPrintFamily(seed: number): string {
  return PRINT_FAMILIES[Math.abs(seed) % PRINT_FAMILIES.length]!;
}

export function demoClusterLabelRu(seed: number): string {
  return CLUSTER_LABELS_RU[Math.abs(seed) % CLUSTER_LABELS_RU.length]!;
}

export function demoCardTitle(seed: number): string {
  return CARD_TITLES[Math.abs(seed) % CARD_TITLES.length]!;
}

export function demoRegionLabel(seed: number): string {
  return REGIONS_RU[Math.abs(seed) % REGIONS_RU.length]!;
}

export function demoProductionLane(seed: number): string {
  return PRODUCTION_LANES[Math.abs(seed) % PRODUCTION_LANES.length]!;
}

export function demoSemanticTerritory(seed: number): string {
  return SEMANTIC_TERRITORIES[Math.abs(seed) % SEMANTIC_TERRITORIES.length]!;
}

/** Launch wave index 1–5 as zero-padded string. */
export function demoLaunchWaveLabel(seed: number): string {
  const w = 1 + (Math.abs(seed) % 5);
  return String(w).padStart(2, "0");
}

export function demoLaunchFrontCount(seed: number): number {
  return 8 + (Math.abs(seed) % 11);
}

/** Appends hero SKU + corridor to a one-line action (RU-first UI). */
export function withHeroSkuLine(base: string, seed: number, maxLen = 200): string {
  const id = demoSkuId(seed);
  const corridor = demoCorridor(seed);
  const fam = demoPrintFamily(seed);
  const tail = `${id} / ${fam} / ${corridor}`;
  const out = `${base}: ${tail}`;
  return out.length <= maxLen ? out : `${base.slice(0, Math.max(24, maxLen - tail.length - 2))}… · ${tail}`;
}

/** SEO cluster demo line for queue / analysis copy — numeric only; label from i18n. */
export function demoSeoClusterCardCount(seed: number, baseCards: number): number {
  return baseCards + (Math.abs(seed) % 7);
}
