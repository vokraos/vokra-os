import { buildFounderCommandBrief } from "./compose";
import { gatherFounderBriefContext } from "./gather";
import { loadLastFounderBrief } from "./storage";

export const FOUNDER_BRIEF_EVENT = "vokra:founder-brief-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

/** Uses last persisted brief only — no composition (safe mode / console). */
export function getFounderBriefDailySummaryFromCache(t: TFn): { headline: string; sub: string } | null {
  const brief = loadLastFounderBrief();
  if (!brief) return null;
  return {
    headline: t("fbrief.daily.headline", {
      today: brief.topTodayAction.text,
      route: brief.nextBestRoute.text,
    }),
    sub: t("fbrief.daily.sub", {
      blocked: brief.topBlockedItem.text,
      change: brief.sinceLastReview,
    }),
  };
}

/** Compact 2-line summary for Daily Operating Console. */
export function getFounderBriefDailySummary(t: TFn): { headline: string; sub: string } | null {
  const brief = buildFounderCommandBrief(gatherFounderBriefContext(), t);
  return {
    headline: t("fbrief.daily.headline", {
      today: brief.topTodayAction.text,
      route: brief.nextBestRoute.text,
    }),
    sub: t("fbrief.daily.sub", {
      blocked: brief.topBlockedItem.text,
      change: brief.sinceLastReview,
    }),
  };
}

export function notifyFounderBriefUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(FOUNDER_BRIEF_EVENT));
}
