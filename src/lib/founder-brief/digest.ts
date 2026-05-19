import type { NavId } from "../../types";
import { buildFounderCommandBrief } from "./compose";
import { gatherFounderBriefContext } from "./gather";
import { loadLastFounderBrief } from "./storage";
import type { FounderCommandBrief } from "./types";

export const FOUNDER_BRIEF_EVENT = "vokra:founder-brief-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function isNominalBlocked(text: string, t: TFn): boolean {
  return text === t("fbrief.blocked.none");
}

export function isNominalConstraint(text: string, t: TFn): boolean {
  return text === t("fbrief.dnt.clear");
}

export function isWarningConfidence(note: string, t: TFn): boolean {
  return note.length > 0 && note !== t("fbrief.confidence.ok");
}

export function hasBriefShift(sinceLastReview: string, t: TFn): boolean {
  return (
    sinceLastReview !== t("fbrief.change.stable") && sinceLastReview !== t("fbrief.change.first")
  );
}

export function buildConstraintDisplay(
  brief: FounderCommandBrief,
  t: TFn,
): { text: string; navId: NavId } | null {
  const parts: string[] = [];
  if (!isNominalConstraint(brief.doNotTouch.text, t)) parts.push(brief.doNotTouch.text);
  if (isWarningConfidence(brief.confidenceNote, t)) parts.push(brief.confidenceNote);
  if (!parts.length) return null;
  const navId = !isNominalConstraint(brief.doNotTouch.text, t)
    ? brief.doNotTouch.navId
    : brief.topBlockedItem.navId;
  return { text: parts.join(" · "), navId };
}

function formatDailySub(brief: FounderCommandBrief, t: TFn): string {
  const sub = t("fbrief.daily.sub", {
    blocked: brief.topBlockedItem.text,
    leverage: brief.highestLeverageMove.text,
  });
  const constraint = buildConstraintDisplay(brief, t);
  return constraint ? `${sub} · ${constraint.text}` : sub;
}

/** Uses last persisted brief only — no composition (safe mode / console). */
export function getFounderBriefDailySummaryFromCache(t: TFn): { headline: string; sub: string } | null {
  const brief = loadLastFounderBrief();
  if (!brief) return null;
  return {
    headline: t("fbrief.daily.headline", { action: brief.topTodayAction.text }),
    sub: formatDailySub(brief, t),
  };
}

/** Compact 2-line summary for Daily Operating Console. */
export function getFounderBriefDailySummary(t: TFn): { headline: string; sub: string } | null {
  const brief = buildFounderCommandBrief(gatherFounderBriefContext(), t);
  return {
    headline: t("fbrief.daily.headline", { action: brief.topTodayAction.text }),
    sub: formatDailySub(brief, t),
  };
}

export function notifyFounderBriefUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(FOUNDER_BRIEF_EVENT));
}
