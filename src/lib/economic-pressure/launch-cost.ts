import type { EconomicPressureGatherContext } from "./types";

export function computeLaunchPressure(ctx: EconomicPressureGatherContext): number {
  const plan = ctx.launchPlan;
  if (!plan) return ctx.activeActionCount > 5 ? 28 : 0;

  let score = plan.launchPressure;
  score += Math.min(25, plan.blockers.length * 5);
  score += Math.min(15, plan.stopConditions.length * 4);
  const wavesActive = [plan.heroWave, plan.supportWave, plan.expansionWave, plan.archiveRefreshWave].filter(
    (w) => w.status === "in_progress" || w.status === "ready",
  ).length;
  score += wavesActive * 8;
  if (plan.launchReadiness === "blocked" || plan.launchReadiness === "fragile") score += 15;
  if (100 - plan.launchReadinessScore > 40) score += 10;
  score += Math.min(12, plan.fboPressure * 0.12 + plan.fbsPressure * 0.1);

  return Math.min(100, Math.round(score));
}
