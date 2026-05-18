import { buildHeroCommandSnapshot, getHeroCommandStageLabelKey } from "./compose";
import { gatherHeroWorkflowArtifacts, hasAnyHeroWorkflowSignal } from "./gather";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function getHeroCommandDailyDigestLine(t: TFn): string | null {
  const artifacts = gatherHeroWorkflowArtifacts();
  if (!hasAnyHeroWorkflowSignal(artifacts)) return null;
  const snap = buildHeroCommandSnapshot(artifacts);
  if (!snap.query && !snap.hasActiveWorkflow) return null;
  const stage = t(getHeroCommandStageLabelKey(snap));
  const next = t(snap.nextStepKey);
  return t("daily.hero.execLine", { stage, next });
}

export const HERO_COMMAND_EVENT = "vokra:hero-command-updated" as const;

export function notifyHeroCommandUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(HERO_COMMAND_EVENT));
  }
}
