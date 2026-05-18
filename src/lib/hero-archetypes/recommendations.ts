import type { CompetitiveGapAnalysis } from "../competitive-gap/types";
import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import type { ArchetypeShare, MarketplaceHeroArchetype } from "./types";

const VOKRA_PRIMARY = ["premium_cinematic", "luxury_minimal", "dark_brutal"] as const;

export function vokraPrimaryDirectionLine(t: (key: string, vars?: Record<string, string>) => string): string {
  return t("ha.vokra.primary");
}

export function vokraFitLines(
  shares: readonly ArchetypeShare[],
  ourTop: MarketplaceHeroArchetype | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const lines = [
    t("ha.vokra.rule.readable"),
    t("ha.vokra.rule.premium_tone"),
    t("ha.vokra.rule.print_hierarchy"),
    t("ha.vokra.rule.texture"),
    t("ha.vokra.rule.no_editorial_excess"),
    t("ha.vokra.rule.avoid_mass_bright"),
  ];
  const topField = shares[0]?.archetype;
  if (topField === "mass_market_bright" || topField === "hyper_commercial") {
    lines.push(t("ha.vokra.fit.vs_loud_field"));
  }
  if (ourTop && VOKRA_PRIMARY.includes(ourTop as (typeof VOKRA_PRIMARY)[number])) {
    lines.push(t("ha.vokra.fit.our_aligned", { arch: t(`ha.arch.${ourTop}`) }));
  } else if (ourTop) {
    lines.push(t("ha.vokra.fit.our_shift", { arch: t(`ha.arch.${ourTop}`) }));
  }
  return lines;
}

export function recommendedDirectionLine(
  shares: readonly ArchetypeShare[],
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const top = shares[0]?.archetype;
  const pcShare = shares.find((s) => s.archetype === "premium_cinematic")?.sharePct ?? 0;
  const lmShare = shares.find((s) => s.archetype === "luxury_minimal")?.sharePct ?? 0;
  const dbShare = shares.find((s) => s.archetype === "dark_brutal")?.sharePct ?? 0;
  if (pcShare < 14 && (top === "clean_marketplace" || top === "mass_market_bright")) {
    return t("ha.rec.premium_cinematic_window");
  }
  if (lmShare < 12 && top === "clean_marketplace") {
    return t("ha.rec.luxury_minimal_window");
  }
  if (dbShare < 10 && (top === "clean_marketplace" || top === "mass_market_bright")) {
    return t("ha.rec.controlled_dark_accent");
  }
  return t("ha.rec.default_vokra_stack");
}

export function practicalRecommendations(
  shares: readonly ArchetypeShare[],
  ourTop: MarketplaceHeroArchetype | null,
  overlapRisk: string,
  gap: CompetitiveGapAnalysis | null,
  heroPlan: CompetitiveHeroImprovementPlan | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const out: string[] = [];
  const db = shares.find((s) => s.archetype === "dark_brutal");
  if (db && db.sharePct >= 30) out.push(t("ha.pr.avoid_saturated_dark_brutal"));
  const pc = shares.find((s) => s.archetype === "premium_cinematic");
  if (pc && pc.sharePct < 14) out.push(t("ha.pr.premium_cinematic_opp"));
  const lm = shares.find((s) => s.archetype === "luxury_minimal");
  if (lm && lm.sharePct < 12) out.push(t("ha.pr.luxury_minimal_under"));
  if (ourTop && shares[0]?.archetype === ourTop && shares[0]!.sharePct >= 22) {
    out.push(t("ha.pr.overlap_dominant"));
  }
  if (gap?.advantagePoints.some((x) => /print|печат/i.test(x))) {
    out.push(t("ha.pr.print_advantage"));
  }
  if (gap?.weaknessPoints.some((x) => /price|цен/i.test(x))) {
    out.push(t("ha.pr.premium_proof_price"));
  }
  if (heroPlan?.visualWeaknesses.some((w) => /read|читаем/i.test(w))) {
    out.push(t("ha.pr.field_weak_print"));
  }
  if (overlapRisk.length > 80) out.push(t("ha.pr.review_overlap_line"));
  if (out.length < 4 && heroPlan) {
    out.push(t("ha.pr.align_with_plan"));
  }
  return [...new Set(out)].slice(0, 8);
}

export function archetypePressureSummary(
  shares: readonly ArchetypeShare[],
  satSignal: number,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const top = shares[0];
  if (!top) return t("ha.pressure.none");
  return t("ha.pressure.line", { arch: t(`ha.arch.${top.archetype}`), pct: String(top.sharePct), sat: String(satSignal) });
}
