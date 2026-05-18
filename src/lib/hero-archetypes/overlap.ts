import type { ArchetypeShare, MarketplaceHeroArchetype } from "./types";

function lab(t: (key: string, vars?: Record<string, string>) => string, a: MarketplaceHeroArchetype): string {
  return t(`ha.arch.${a}`);
}

export function buildOverlapSummary(
  shares: readonly ArchetypeShare[],
  ourTop: MarketplaceHeroArchetype | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const d1 = shares[0];
  const d2 = shares[1];
  if (!d1) return t("ha.overlap.empty");
  if (d2 && d1.sharePct >= 24 && d2.sharePct >= 20) {
    return t("ha.overlap.dual_pressure", {
      a: lab(t, d1.archetype),
      ap: String(d1.sharePct),
      b: lab(t, d2.archetype),
      bp: String(d2.sharePct),
    });
  }
  if (ourTop && ourTop === d1.archetype && d1.sharePct >= 22) {
    return t("ha.overlap.our_matches_mass", { arch: lab(t, ourTop), pct: String(d1.sharePct) });
  }
  return t("ha.overlap.standard", { arch: lab(t, d1.archetype), pct: String(d1.sharePct) });
}

export function buildOverlapRiskLine(
  shares: readonly ArchetypeShare[],
  ourTop: MarketplaceHeroArchetype | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  if (!ourTop) return t("ha.overlap_risk.no_our");
  const match = shares.find((s) => s.archetype === ourTop);
  if (match && match.sharePct >= 26) return t("ha.overlap_risk.high", { arch: lab(t, ourTop), pct: String(match.sharePct) });
  if (match && match.sharePct >= 14) return t("ha.overlap_risk.mid", { arch: lab(t, ourTop), pct: String(match.sharePct) });
  return t("ha.overlap_risk.low", { arch: lab(t, ourTop) });
}
