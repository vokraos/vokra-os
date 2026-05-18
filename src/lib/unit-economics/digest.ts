import { formatUnitEconomicsDigestLine } from "./recommendations";
import { loadUnitEconomicsBundle } from "./storage";

export const UNIT_ECONOMICS_EVENT = "vokra:unit-economics-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function getUnitEconomicsDailyLine(t: TFn): string | null {
  const bundle = loadUnitEconomicsBundle();
  if (!bundle.profiles.length && !bundle.templates.length) return null;
  return formatUnitEconomicsDigestLine(bundle.profiles, t);
}

export function notifyUnitEconomicsUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNIT_ECONOMICS_EVENT));
    window.dispatchEvent(new Event("vokra:price-positioning-updated"));
  }
}
