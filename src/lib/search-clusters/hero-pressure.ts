import type { CompetitorCorridorEntity, HeroPressureSignal, SearchClusterEntity } from "./types";

function hid(parts: readonly string[]): string {
  const s = parts.join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `hp_${(h >>> 0).toString(36)}`;
}

/** Hero similarity, repetition, fatigue — narrative keys for i18n (no CTR). */
export function computeHeroPressure(
  clusters: readonly SearchClusterEntity[],
  corridors: readonly CompetitorCorridorEntity[],
): HeroPressureSignal[] {
  const out: HeroPressureSignal[] = [];

  const patternCounts = new Map<string, number>();
  for (const c of clusters) {
    for (const p of c.heroPatterns) {
      patternCounts.set(p, (patternCounts.get(p) ?? 0) + 1);
    }
  }

  for (const [pattern, count] of patternCounts) {
    if (count >= 2 && (pattern === "dark_typography" || pattern === "anime_hero")) {
      out.push({
        id: hid(["pattern", pattern]),
        messageKey:
          pattern === "dark_typography" ? "cmap.pressure.darkTypographySaturated" : "cmap.pressure.animeHeroOverlap",
        vars: { pattern, n: String(count) },
        severity: Math.min(95, 52 + count * 14),
      });
    }
  }

  const quiet = corridors.find((c) => /luxury|quiet|premium/i.test(c.visualStyle));
  if (quiet && quiet.saturationRisk < 45) {
    out.push({
      id: hid(["quiet", quiet.id]),
      messageKey: "cmap.pressure.quietLuxuryRepetition",
      vars: { corridor: quiet.corridor },
      severity: 44,
    });
  }

  const giftCluster = clusters.find((c) => c.clusterType === "gift");
  if (giftCluster && giftCluster.estimatedCompetition < 42) {
    out.push({
      id: hid(["gift", giftCluster.id]),
      messageKey: "cmap.pressure.giftClusterCalm",
      vars: { corridor: giftCluster.corridor },
      severity: 28,
    });
  }

  const noisy = clusters.filter((c) => c.heroPatterns.length >= 3 && c.estimatedCompetition >= 68);
  if (noisy.length) {
    out.push({
      id: hid(["noise", noisy[0]!.id]),
      messageKey: "cmap.pressure.clusterNoise",
      vars: { corridor: noisy[0]!.corridor },
      severity: 58,
    });
  }

  return out.sort((a, b) => b.severity - a.severity).slice(0, 8);
}
