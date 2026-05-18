import type { SerpDerivedAnalysis } from "../competitor-serp/types";
import type { ArchetypeShare, MarketplaceHeroArchetype } from "./types";

const VOKRA_FAVORED: readonly MarketplaceHeroArchetype[] = ["premium_cinematic", "luxury_minimal", "dark_brutal"];

export function buildSaturationSummary(
  shares: readonly ArchetypeShare[],
  analysis: SerpDerivedAnalysis,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const top = shares[0];
  const second = shares[1];
  const sat = analysis.saturationSignal;
  if (!top) return t("ha.sat.empty");
  const lines: string[] = [];
  if (top.sharePct >= 32) {
    lines.push(t("ha.sat.dominant_strong", { arch: t(`ha.arch.${top.archetype}`), pct: String(top.sharePct) }));
  }
  if (second && second.sharePct >= 22 && top.archetype !== second.archetype) {
    lines.push(t("ha.sat.dual_mass", { a: t(`ha.arch.${top.archetype}`), b: t(`ha.arch.${second.archetype}`) }));
  }
  if (VOKRA_FAVORED.includes(top.archetype) && top.sharePct >= 28) {
    lines.push(t("ha.sat.vokra_lane_crowded", { arch: t(`ha.arch.${top.archetype}`) }));
  }
  lines.push(t("ha.sat.field_signal", { sat: String(sat) }));
  return lines.join(" ");
}

export function weakArchetypeLines(
  shares: readonly ArchetypeShare[],
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const lows = shares.filter((s) => s.sharePct > 0 && s.sharePct < 8).slice(0, 4);
  if (!lows.length) return [t("ha.weak.none_clear")];
  return lows.map((s) => t("ha.weak.line", { arch: t(`ha.arch.${s.archetype}`), pct: String(s.sharePct) }));
}

export function underrepresentedLines(
  shares: readonly ArchetypeShare[],
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const shareMap = new Map(shares.map((s) => [s.archetype, s.sharePct]));
  const out: string[] = [];
  for (const arch of VOKRA_FAVORED) {
    const pct = shareMap.get(arch) ?? 0;
    if (pct < 12) out.push(t("ha.under.vokra_lane", { arch: t(`ha.arch.${arch}`), pct: String(pct) }));
  }
  const clean = shareMap.get("clean_marketplace") ?? 0;
  if (clean > 38) {
    const pc = shareMap.get("premium_cinematic") ?? 0;
    if (pc < 15) out.push(t("ha.under.premium_vs_clean", { clean: String(clean), pc: String(pc) }));
  }
  if (!out.length) out.push(t("ha.under.balanced"));
  return out.slice(0, 5);
}
