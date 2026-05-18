import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { HeroBattlePlan } from "../hero-battle-plan/types";
import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";
import type { HeroPostLaunchObservation, ObservationLabel } from "./types";

function labelOf(text: string): ObservationLabel | null {
  const t = text.toLowerCase();
  if (t.startsWith("improved")) return "improved";
  if (t.startsWith("stable")) return "stable";
  if (t.startsWith("weakened")) return "weakened";
  if (t.startsWith("uncertain")) return "uncertain";
  return null;
}

export function deriveLearningReinforcement(
  obs: HeroPostLaunchObservation,
  ctx: {
    battlePlan: HeroBattlePlan | null;
    archetype: HeroArchetypeIntelligenceReport | null;
    readability: HeroReadabilityIntelligenceReport | null;
    fatigue: HeroFatigueIntelligenceReport | null;
  },
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const lines: string[] = [];

  const comp = labelOf(obs.competitorMovement);
  if (comp === "weakened" || /copied|copy|совпад|копир/i.test(obs.competitorMovement)) {
    lines.push(t("hplo.learn.archetype_saturation"));
  }

  const read = labelOf(obs.readabilityObservation);
  if (read === "stable" || read === "improved") {
    lines.push(t("hplo.learn.readability_confidence"));
  } else if (read === "weakened") {
    lines.push(t("hplo.learn.readability_refresh"));
  }

  const fat = labelOf(obs.fatigueObservation);
  if (fat === "weakened" || /accelerat|ускор|сроч/i.test(obs.fatigueObservation)) {
    lines.push(t("hplo.learn.fatigue_cycle"));
  }

  const prem = labelOf(obs.premiumPerceptionObservation);
  if (prem === "improved") {
    lines.push(t("hplo.learn.premium_cinematic"));
  }

  const rank = labelOf(obs.rankingObservation);
  if (rank === "improved") {
    lines.push(t("hplo.learn.positioning_improved"));
  } else if (rank === "weakened") {
    lines.push(t("hplo.learn.positioning_refresh"));
  }

  if (labelOf(obs.refreshRisk) === "weakened" || /high|высок|elevated/i.test(obs.refreshRisk)) {
    lines.push(t("hplo.learn.test_matrix_again"));
  }

  if (ctx.fatigue?.refreshUrgencyLine) {
    lines.push(t("hplo.learn.fatigue_intel_echo", { line: ctx.fatigue.refreshUrgencyLine.slice(0, 120) }));
  }
  if (ctx.readability?.readabilityRiskLine) {
    lines.push(t("hplo.learn.readability_intel_echo", { line: ctx.readability.readabilityRiskLine.slice(0, 120) }));
  }
  if (ctx.archetype?.overlapRiskLine) {
    lines.push(t("hplo.learn.archetype_intel_echo", { line: ctx.archetype.overlapRiskLine.slice(0, 120) }));
  }
  if (ctx.battlePlan?.refreshStrategy) {
    lines.push(t("hplo.learn.battle_plan_echo", { line: ctx.battlePlan.refreshStrategy.slice(0, 120) }));
  }

  const seen = new Set<string>();
  return lines.filter((x) => {
    if (seen.has(x)) return false;
    seen.add(x);
    return true;
  }).slice(0, 10);
}

export function deriveNextRecommendation(
  obs: HeroPostLaunchObservation,
  reinforcement: string[],
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  if (obs.nextRecommendation.trim()) return obs.nextRecommendation.trim();
  const fat = labelOf(obs.fatigueObservation);
  if (fat === "weakened") return t("hplo.rec.fatigue_refresh");
  const comp = labelOf(obs.competitorMovement);
  if (comp === "weakened") return t("hplo.rec.archetype_shift");
  const read = labelOf(obs.readabilityObservation);
  if (read === "weakened") return t("hplo.rec.readability_fix");
  if (reinforcement[0]) return reinforcement[0];
  return t("hplo.rec.monitor_continue");
}

export function deriveRefreshRiskLabel(
  obs: HeroPostLaunchObservation,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  if (obs.refreshRisk.trim()) return obs.refreshRisk;
  const fat = labelOf(obs.fatigueObservation);
  if (fat === "weakened") return t("hplo.label.weakened") + " · " + t("hplo.risk.fatigue_high");
  const rank = labelOf(obs.rankingObservation);
  if (rank === "weakened") return t("hplo.label.weakened") + " · " + t("hplo.risk.ranking_soft");
  return t("hplo.label.stable") + " · " + t("hplo.risk.monitor");
}
