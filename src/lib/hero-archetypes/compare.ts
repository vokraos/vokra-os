import type { OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import { premiumScoreFromLabel } from "../competitor-serp/analyze";
import { classifyOurCard, dominantArchetypes } from "./classify";
import type { ArchetypeShare, MarketplaceHeroArchetype } from "./types";
import { HERO_ARCHETYPE_CATALOG } from "./archetypes";

function topOurArchetype(shares: ArchetypeShare[]): MarketplaceHeroArchetype | null {
  return shares[0]?.archetype ?? null;
}

export function compareOurVsSerp(
  our: OurCardCompetitiveSnapshot | null,
  serpDominant: readonly ArchetypeShare[],
  t: (key: string, vars?: Record<string, string>) => string,
): {
  ourArchetypes: ArchetypeShare[];
  ourArchetypeLines: string[];
  differentiationOpportunityLine: string;
  premiumMismatchLine: string;
  emotionalMismatchLine: string;
  marketplaceFitLine: string;
} {
  if (!our) {
    return {
      ourArchetypes: [],
      ourArchetypeLines: [t("ha.our.empty")],
      differentiationOpportunityLine: t("ha.diff.no_our"),
      premiumMismatchLine: t("ha.prem.no_our"),
      emotionalMismatchLine: t("ha.em.no_our"),
      marketplaceFitLine: t("ha.mp.no_our"),
    };
  }
  const ourShares = classifyOurCard(our);
  const dom = dominantArchetypes(serpDominant, 5);
  const ourTop = topOurArchetype(ourShares);
  const fieldTop = dom[0]?.archetype ?? null;
  const ourPrem = premiumScoreFromLabel(our.perceivedPremiumLevel) ?? 50;

  const ourArchetypeLines = ourShares.slice(0, 4).map((s) => t("ha.our.line", { arch: t(`ha.arch.${s.archetype}`), pct: String(s.sharePct) }));

  let differentiationOpportunityLine: string;
  if (!ourTop || !fieldTop) differentiationOpportunityLine = t("ha.diff.unknown");
  else if (ourTop === fieldTop) differentiationOpportunityLine = t("ha.diff.same_lane", { arch: t(`ha.arch.${ourTop}`) });
  else if (ourShares.some((s) => s.archetype !== fieldTop && s.sharePct >= 18)) {
    differentiationOpportunityLine = t("ha.diff.alt_lane", { our: t(`ha.arch.${ourTop}`), field: t(`ha.arch.${fieldTop}`) });
  } else {
    differentiationOpportunityLine = t("ha.diff.soft", { our: t(`ha.arch.${ourTop}`), field: t(`ha.arch.${fieldTop}`) });
  }

  const fieldEntity = fieldTop ? HERO_ARCHETYPE_CATALOG.find((e) => e.archetype === fieldTop) : null;
  const fieldPrem =
    fieldEntity?.premiumSignal === "high" ? 72 : fieldEntity?.premiumSignal === "mid" ? 52 : 34;
  let premiumMismatchLine: string;
  if (ourPrem + 8 < fieldPrem) premiumMismatchLine = t("ha.prem.behind_field", { ours: String(ourPrem), field: String(fieldPrem) });
  else if (ourPrem > fieldPrem + 10) premiumMismatchLine = t("ha.prem.ahead_field", { ours: String(ourPrem), field: String(fieldPrem) });
  else premiumMismatchLine = t("ha.prem.neutral", { ours: String(ourPrem), field: String(fieldPrem) });

  const ourEntity = ourTop ? HERO_ARCHETYPE_CATALOG.find((e) => e.archetype === ourTop) : null;
  const fieldTone = fieldEntity?.emotionalTone ?? "—";
  const ourTone = ourEntity?.emotionalTone ?? "—";
  const emotionalMismatchLine =
    ourTop && fieldTop && ourTop !== fieldTop ? t("ha.em.shift", { our: ourTone, field: fieldTone }) : t("ha.em.align", { tone: ourTone });

  const marketplaceFitLine =
    ourTop === "mass_market_bright" || ourTop === "hyper_commercial"
      ? t("ha.mp.loud_hero")
      : ourTop && ["premium_cinematic", "luxury_minimal"].includes(ourTop)
        ? t("ha.mp.premium_ok")
        : t("ha.mp.mid", { arch: ourTop ? t(`ha.arch.${ourTop}`) : "—" });

  return {
    ourArchetypes: ourShares,
    ourArchetypeLines,
    differentiationOpportunityLine,
    premiumMismatchLine,
    emotionalMismatchLine,
    marketplaceFitLine,
  };
}
