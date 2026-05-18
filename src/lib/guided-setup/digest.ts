import { stepMeta } from "./compose";
import type { GuidedSetupPlan } from "./types";

export const GUIDED_SETUP_EVENT = "vokra:guided-setup-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function notifyGuidedSetupUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(GUIDED_SETUP_EVENT));
}

export function formatGuidedSetupDailyLine(plan: GuidedSetupPlan | null, t: TFn): string | null {
  if (!plan || plan.isComplete) return null;
  const nextMeta = stepMeta(plan.nextStep);
  return t("gsp.daily.line", {
    done: String(plan.completedSteps.length),
    total: String(9),
    step: t(nextMeta.titleKey),
  });
}
