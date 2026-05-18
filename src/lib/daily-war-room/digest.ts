import { buildDailyWarRoomSnapshot } from "./compose";
import { peekDailyWarRoomSession } from "./session";
import { DAILY_WAR_ROOM_EVENT } from "./types";
import type { DailyWarRoomSnapshot } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export { DAILY_WAR_ROOM_EVENT };

export function notifyDailyWarRoomUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DAILY_WAR_ROOM_EVENT));
}

export function formatDailyWarRoomDailyLine(snapshot: DailyWarRoomSnapshot | null, t: TFn): string | null {
  if (!snapshot) return null;
  const extra =
    snapshot.founderDecisions.length > 0
      ? t("dwr.daily.decision")
      : snapshot.blockedItems.length > 0
        ? t("dwr.daily.blocked")
        : "";
  return t("dwr.daily.line", {
    state: t(`dwr.state.${snapshot.dailyState}`),
    extra,
  });
}

export function getDailyWarRoomDailyLine(t: TFn, locale?: Parameters<typeof buildDailyWarRoomSnapshot>[1]): string | null {
  const snap = buildDailyWarRoomSnapshot(t, locale);
  return formatDailyWarRoomDailyLine(snap, t);
}

/** Cached snapshot only — does not compose War Room. */
export function getDailyWarRoomDailyLineCached(t: TFn): string | null {
  const snap = peekDailyWarRoomSession()?.snapshot ?? null;
  return formatDailyWarRoomDailyLine(snap, t);
}
