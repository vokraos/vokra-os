import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";
import type { LaunchExecutionAction } from "../launch-ops/types";

const MS_14D = 14 * 24 * 60 * 60 * 1000;

export function computeBurnoutRisk(args: {
  heroFatigue: HeroFatigueIntelligenceReport | null;
  recentRefreshActions: LaunchExecutionAction[];
  visualFatigueHint: number;
}): number {
  const fatigueIdx = args.heroFatigue?.fatiguePressureIndex ?? args.visualFatigueHint;
  const now = Date.now();
  const recent = args.recentRefreshActions.filter((a) => now - a.updatedAt < MS_14D);
  const clusterBoost = recent.length >= 2 ? 28 : recent.length === 1 ? 12 : 0;
  const raw = fatigueIdx * 0.62 + clusterBoost + (recent.length >= 3 ? 18 : 0);
  return Math.round(Math.min(100, raw));
}

export function isBurnoutRisk(burnoutRisk: number, recentRefreshCount: number): boolean {
  return burnoutRisk >= 58 || recentRefreshCount >= 3;
}
