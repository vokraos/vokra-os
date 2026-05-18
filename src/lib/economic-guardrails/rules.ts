import type { UnitEconomicsProfileRow } from "../unit-economics/types";
import { profileLabel } from "../unit-economics/match";
import { newEconomicGuardrailId } from "./ids";
import type { EconomicGuardrail, GuardrailBuildContext, GuardrailSeverity, GuardrailType } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function baseVars(row: UnitEconomicsProfileRow): Record<string, string> {
  const { profile, calculated } = row;
  return {
    label: profileLabel(profile),
    corridor: profile.corridor || "—",
    mode: profile.stockMode || "—",
    margin: String(calculated.estimatedMarginPercent),
    maxAd: String(Math.round(calculated.maxAdCostBeforeTargetBreak)),
    ad: String(Math.round(profile.adCostEstimate)),
    breakEven: String(calculated.breakEvenPrice),
    sale: String(profile.salePrice),
  };
}

function push(
  out: EconomicGuardrail[],
  row: UnitEconomicsProfileRow,
  type: GuardrailType,
  severity: GuardrailSeverity,
  systems: EconomicGuardrail["affectedSystems"],
  keys: {
    titleKey: string;
    reasonKey: string;
    recommendedActionKey: string;
  },
  extraVars: Record<string, string> = {},
): void {
  const { profile } = row;
  const vars = { ...baseVars(row), ...extraVars };
  const g: EconomicGuardrail = {
    id: newEconomicGuardrailId(profile.id, type),
    sourceProfileId: profile.id,
    corridor: profile.corridor,
    productFamily: profile.productFamily,
    marketplace: profile.marketplace,
    stockMode: profile.stockMode,
    guardrailType: type,
    severity,
    titleKey: keys.titleKey,
    titleVars: vars,
    reasonKey: keys.reasonKey,
    reasonVars: vars,
    recommendedActionKey: keys.recommendedActionKey,
    recommendedActionVars: vars,
    affectedSystems: systems,
    confidenceNoteKey: "egr.confidence.manual",
    createdAt: Date.now(),
  };
  if (!out.some((x) => x.id === g.id)) out.push(g);
}

function isFboContext(row: UnitEconomicsProfileRow): boolean {
  const mode = (row.profile.stockMode ?? "").toLowerCase();
  return mode.includes("fbo") || row.profile.fboCost > 0;
}

function breakEvenTight(row: UnitEconomicsProfileRow): boolean {
  const sale = row.profile.salePrice;
  if (sale <= 0) return false;
  return row.calculated.breakEvenPrice >= sale * 0.92;
}

function adsOverMax(row: UnitEconomicsProfileRow): boolean {
  return row.profile.adCostEstimate > row.calculated.maxAdCostBeforeTargetBreak + 0.01;
}

const ALL_SYSTEMS: EconomicGuardrail["affectedSystems"] = [
  "launch_operations",
  "assortment_actions",
  "collection_builder",
  "founder_brief",
  "daily_operating",
  "economic_pressure",
];

export function deriveGuardrailsForProfile(
  row: UnitEconomicsProfileRow,
  ctx: GuardrailBuildContext,
): EconomicGuardrail[] {
  const out: EconomicGuardrail[] = [];
  const { calculated } = row;
  const level = calculated.marginPressureLevel;

  if (level === "negative") {
    push(out, row, "hold_expansion", "critical", ALL_SYSTEMS, {
      titleKey: "egr.title.holdExpansion",
      reasonKey: "egr.reason.negativeMargin",
      recommendedActionKey: "egr.action.holdExpansion",
    });
    push(out, row, "require_cost_review", "critical", ["unit_economics", "assortment_actions", "founder_brief"], {
      titleKey: "egr.title.requireCostReview",
      reasonKey: "egr.reason.negativeMargin",
      recommendedActionKey: "egr.action.reviewCosts",
    });
    push(out, row, "limit_launch_wave", "critical", ["launch_operations", "collection_builder"], {
      titleKey: "egr.title.limitLaunch",
      reasonKey: "egr.reason.negativeMargin",
      recommendedActionKey: "egr.action.refreshOnly",
    });
    push(out, row, "allow_only_refresh", "critical", ["collection_builder", "launch_operations"], {
      titleKey: "egr.title.refreshOnly",
      reasonKey: "egr.reason.negativeMargin",
      recommendedActionKey: "egr.action.refreshOnly",
    });
  }

  if (level === "dangerous") {
    push(out, row, "hold_expansion", "elevated", ALL_SYSTEMS, {
      titleKey: "egr.title.holdExpansion",
      reasonKey: "egr.reason.dangerousMargin",
      recommendedActionKey: "egr.action.holdExpansion",
    });
    if (isFboContext(row)) {
      push(out, row, "avoid_fbo_scaling", "elevated", ["launch_operations", "assortment_actions"], {
        titleKey: "egr.title.avoidFbo",
        reasonKey: "egr.reason.dangerousFbo",
        recommendedActionKey: "egr.action.pauseFbo",
      });
    }
    push(out, row, "limit_launch_wave", "elevated", ["launch_operations", "collection_builder"], {
      titleKey: "egr.title.limitLaunch",
      reasonKey: "egr.reason.dangerousMargin",
      recommendedActionKey: "egr.action.reduceLaunch",
    });
  }

  if (level === "tight") {
    push(out, row, "hold_expansion", "caution", ["launch_operations", "assortment_actions", "collection_builder"], {
      titleKey: "egr.title.holdExpansion",
      reasonKey: "egr.reason.tightMargin",
      recommendedActionKey: "egr.action.cautiousExpansion",
    });
    if (breakEvenTight(row)) {
      push(out, row, "require_price_review", "caution", ["unit_economics", "assortment_actions", "founder_brief"], {
        titleKey: "egr.title.requirePriceReview",
        reasonKey: "egr.reason.breakEvenTight",
        recommendedActionKey: "egr.action.reviewPrice",
      });
    }
  }

  if (adsOverMax(row)) {
    const sev: GuardrailSeverity =
      level === "negative" || level === "dangerous" ? "elevated" : level === "tight" ? "caution" : "observe";
    push(out, row, "reduce_ads", sev, ["launch_operations", "assortment_actions", "daily_operating"], {
      titleKey: "egr.title.reduceAds",
      reasonKey: "egr.reason.adsOverMax",
      recommendedActionKey: "egr.action.reduceAds",
    });
  }

  if (breakEvenTight(row) && level !== "tight" && level !== "negative" && level !== "dangerous") {
    push(out, row, "require_price_review", "observe", ["unit_economics", "founder_brief"], {
      titleKey: "egr.title.requirePriceReview",
      reasonKey: "egr.reason.breakEvenTight",
      recommendedActionKey: "egr.action.reviewPrice",
    });
  }

  if (level === "healthy" && !ctx.expansionPressureElevated) {
    push(out, row, "safe_to_scale", "observe", ["launch_operations", "assortment_actions", "founder_brief"], {
      titleKey: "egr.title.safeToScale",
      reasonKey: "egr.reason.healthyMargin",
      recommendedActionKey: "egr.action.scaleWhenReady",
    });
  }

  return out;
}

export function buildEconomicGuardrails(
  rows: UnitEconomicsProfileRow[],
  ctx: GuardrailBuildContext = {},
): EconomicGuardrail[] {
  const all: EconomicGuardrail[] = [];
  for (const row of rows) {
    all.push(...deriveGuardrailsForProfile(row, ctx));
  }
  return sortGuardrails(all);
}

export function sortGuardrails(guardrails: EconomicGuardrail[]): EconomicGuardrail[] {
  const rank: Record<GuardrailSeverity, number> = {
    critical: 4,
    elevated: 3,
    caution: 2,
    observe: 1,
  };
  return [...guardrails].sort((a, b) => rank[b.severity] - rank[a.severity]);
}

export function resolveGuardrail(g: EconomicGuardrail, t: TFn): import("./types").ResolvedEconomicGuardrail {
  return {
    ...g,
    title: t(g.titleKey, g.titleVars),
    reason: t(g.reasonKey, g.reasonVars),
    recommendedAction: t(g.recommendedActionKey, g.recommendedActionVars),
    confidenceNote: t(g.confidenceNoteKey),
  };
}

export function resolveGuardrails(guardrails: EconomicGuardrail[], t: TFn): import("./types").ResolvedEconomicGuardrail[] {
  return guardrails.map((g) => resolveGuardrail(g, t));
}

export function guardrailSummaryLines(guardrails: EconomicGuardrail[], t: TFn, max = 6): string[] {
  return resolveGuardrails(sortGuardrails(guardrails), t)
    .slice(0, max)
    .map((g) => t("egr.summary.line", { title: g.title, severity: t(`egr.severity.${g.severity}`) }));
}
