import type { AssortmentAction, AssortmentActionType } from "../assortment-actions/types";
import type { EconomicPressureReport } from "../economic-pressure/types";
import type { MarketplaceLaunchPlan, LaunchReadinessLevel } from "../launch-ops/types";
import { guardrailsForContext, hasGuardrailType, worstGuardrailSeverity } from "./match";
import { resolveGuardrail, sortGuardrails } from "./rules";
import type { EconomicGuardrail, GuardrailType } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

const EXPANSION_ACTIONS: AssortmentActionType[] = [
  "launch_wave",
  "create_collection",
  "split_marketplace_group",
  "promote_hero_candidate",
  "prepare_fbo",
];

function expansionAction(a: AssortmentAction): boolean {
  return EXPANSION_ACTIONS.includes(a.actionType);
}

export function shouldGuardrailHoldAction(action: AssortmentAction, guardrails: EconomicGuardrail[]): boolean {
  const matched = guardrailsForContext(guardrails, {
    corridor: action.corridor,
    marketplace: action.marketplace,
  });
  if (!matched.length || !expansionAction(action)) return false;

  if (hasGuardrailType(matched, ["hold_expansion", "limit_launch_wave"], "elevated")) return true;

  if (
    action.actionType === "prepare_fbo" &&
    hasGuardrailType(matched, ["avoid_fbo_scaling"], "caution")
  ) {
    return true;
  }

  return false;
}

export function augmentAssortmentWithGuardrails(
  action: AssortmentAction,
  guardrails: EconomicGuardrail[],
): Partial<
  Pick<
    AssortmentAction,
    | "riskReasons"
    | "leverageReasons"
    | "titleVars"
    | "guardrailHold"
    | "guardrailBadgeKey"
    | "guardrailSeverity"
    | "guardrailTypes"
  >
> {
  const matched = sortGuardrails(
    guardrailsForContext(guardrails, { corridor: action.corridor, marketplace: action.marketplace }),
  );
  if (!matched.length) return {};

  const top = matched[0]!;
  const riskReasons = [...action.riskReasons];
  const guardrailKey = "aa.explain.risk.guardrail";
  if (!riskReasons.includes(guardrailKey)) riskReasons.push(guardrailKey);

  const guardrailHold = shouldGuardrailHoldAction(action, guardrails);

  return {
    riskReasons: riskReasons.slice(0, 7),
    titleVars: {
      ...action.titleVars,
      egrType: top.guardrailType,
      egrSeverity: top.severity,
      egrLabel: top.titleVars.label ?? top.corridor,
      egrTitleKey: top.titleKey,
    },
    guardrailHold,
    guardrailBadgeKey: "aa.guardrail.badge",
    guardrailSeverity: worstGuardrailSeverity(matched) ?? top.severity,
    guardrailTypes: matched.map((g) => g.guardrailType).slice(0, 4),
  };
}

function downgradeReadiness(level: LaunchReadinessLevel): LaunchReadinessLevel {
  if (level === "expansion_ready") return "operational";
  if (level === "ready") return "fragile";
  if (level === "operational") return "fragile";
  return level;
}

export function applyGuardrailsToLaunchPlan(
  plan: MarketplaceLaunchPlan,
  guardrails: EconomicGuardrail[],
  t: TFn,
): MarketplaceLaunchPlan {
  if (!guardrails.length) return plan;

  const critical = guardrails.filter((g) => g.severity === "critical" || g.severity === "elevated");
  const stopConditions = [...plan.stopConditions];
  const recommendations = [...plan.recommendations];
  const operationalWarnings = [...plan.operationalWarnings];

  for (const g of critical.slice(0, 4)) {
    const r = resolveGuardrail(g, t);
    const stop = t("egr.launch.stop", { title: r.title });
    if (!stopConditions.includes(stop)) stopConditions.push(stop);
    const rec = t("egr.launch.rec", { action: r.recommendedAction });
    if (!recommendations.includes(rec)) recommendations.push(rec);
    const warn = t("egr.launch.warn", { reason: r.reason });
    if (!operationalWarnings.includes(warn)) operationalWarnings.push(warn);
  }

  let launchReadiness = plan.launchReadiness;
  let launchReadinessScore = plan.launchReadinessScore;
  let expansionWave = plan.expansionWave;
  let fboPressure = plan.fboPressure;

  if (hasGuardrailType(guardrails, ["hold_expansion", "limit_launch_wave"], "elevated")) {
    launchReadinessScore = Math.min(launchReadinessScore, 48);
    launchReadiness = downgradeReadiness(launchReadiness);
    expansionWave = {
      ...expansionWave,
      status: "hold",
      reason: t("egr.launch.expansionHeld"),
    };
  }

  if (hasGuardrailType(guardrails, ["avoid_fbo_scaling"], "caution")) {
    fboPressure = Math.min(100, fboPressure + 22);
    operationalWarnings.push(t("egr.launch.fboRisk"));
  }

  if (hasGuardrailType(guardrails, ["allow_only_refresh"], "elevated")) {
    expansionWave = { ...expansionWave, status: "hold", reason: t("egr.launch.refreshOnly") };
  }

  return {
    ...plan,
    stopConditions: [...new Set(stopConditions)].slice(0, 10),
    recommendations: recommendations.slice(0, 12),
    operationalWarnings: [...new Set(operationalWarnings)].slice(0, 8),
    launchReadiness,
    launchReadinessScore,
    expansionWave,
    fboPressure,
  };
}

export function appendGuardrailsToEconomicPressure(
  report: EconomicPressureReport,
  guardrails: EconomicGuardrail[],
  t: TFn,
): EconomicPressureReport {
  const summary = guardrails.length
    ? guardrails
        .filter((g) => g.severity !== "observe")
        .slice(0, 5)
        .map((g) => {
          const r = resolveGuardrail(g, t);
          return t("egr.pressure.warn", { title: r.title });
        })
    : [];
  const operationalWarnings = [...report.operationalWarnings];
  for (const line of summary) {
    if (!operationalWarnings.includes(line)) operationalWarnings.push(line);
  }
  return {
    ...report,
    operationalWarnings: operationalWarnings.slice(0, 10),
    guardrailSummary: summary,
  };
}

export function formatGuardrailDailyLine(guardrails: EconomicGuardrail[], t: TFn): string | null {
  const ranked = sortGuardrails(guardrails.filter((g) => g.severity !== "observe"));
  const top = ranked[0];
  if (!top) return null;
  const r = resolveGuardrail(top, t);
  return t("egr.daily.line", { title: r.title });
}

export function formatGuardrailFounderLine(guardrails: EconomicGuardrail[], t: TFn): string | null {
  return formatGuardrailDailyLine(guardrails, t);
}

export function getCollectionGuardrailHint(
  guardrails: EconomicGuardrail[],
  ctx: { corridor?: string; marketplace?: string; stockMode?: string },
  t: TFn,
): string | null {
  const matched = guardrailsForContext(guardrails, ctx);
  if (!matched.length) return null;
  if (hasGuardrailType(matched, ["allow_only_refresh", "limit_launch_wave", "hold_expansion"], "caution")) {
    const top = sortGuardrails(matched)[0]!;
    const r = resolveGuardrail(top, t);
    return t("egr.collection.hint", { title: r.title, action: r.recommendedAction });
  }
  return null;
}

export function guardrailContextFromPressure(report: EconomicPressureReport | null): {
  expansionPressureElevated: boolean;
} {
  if (!report) return { expansionPressureElevated: false };
  const elevated =
    report.expansionLevel === "elevated" ||
    report.expansionLevel === "dangerous" ||
    report.expansionLevel === "critical";
  return { expansionPressureElevated: elevated };
}

export const EXPANSION_GUARDRAIL_TYPES: GuardrailType[] = [
  "hold_expansion",
  "avoid_fbo_scaling",
  "limit_launch_wave",
  "allow_only_refresh",
];
