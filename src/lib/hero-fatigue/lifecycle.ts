import type { HeroFatigueLevel, HeroLifecycleStage } from "./types";

export function fatigueLevelFromIndex(idx: number): HeroFatigueLevel {
  if (idx <= 28) return "fresh";
  if (idx <= 44) return "stable";
  if (idx <= 60) return "aging";
  if (idx <= 76) return "fatigued";
  return "exhausted";
}

export function lifecycleFromSignals(args: {
  fatigueIdx: number;
  saturationFatigue: number;
  semanticRep: number;
  refreshQueueCount: number;
}): HeroLifecycleStage {
  if (args.refreshQueueCount >= 4 && args.fatigueIdx >= 52) return "refresh_ready";
  if (args.fatigueIdx >= 78 || args.semanticRep >= 72) return "exhausted";
  if (args.fatigueIdx >= 62 && args.saturationFatigue >= 58) return "declining";
  if (args.saturationFatigue >= 62) return "saturated";
  if (args.fatigueIdx >= 40) return "active";
  return "emerging";
}
