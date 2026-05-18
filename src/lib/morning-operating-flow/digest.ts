import { buildMorningOperatingFlow } from "./compose";
import { MORNING_FLOW_EVENT, MORNING_FLOW_STEP_IDS, type MorningOperatingFlow } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export { MORNING_FLOW_EVENT };

export function notifyMorningFlowUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MORNING_FLOW_EVENT));
}

export function formatMorningFlowDailyLine(flow: MorningOperatingFlow | null, t: TFn): string | null {
  if (!flow || flow.isComplete) return null;
  const total = MORNING_FLOW_STEP_IDS.length;
  const done = flow.completedSteps.length;
  return t("mflow.daily.line", {
    done: String(done),
    total: String(total),
    next: flow.nextAction.text,
  });
}

export function getMorningFlowDailyLine(
  t: TFn,
  locale?: Parameters<typeof buildMorningOperatingFlow>[1],
): string | null {
  const flow = buildMorningOperatingFlow(t, locale);
  return formatMorningFlowDailyLine(flow, t);
}
