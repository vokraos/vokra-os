import { buildEveningCloseSnapshot } from "./compose";
import { isEveningClosePendingToday, loadTodayEveningCloseSnapshot } from "./store";
import { EVENING_CLOSE_EVENT } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export { EVENING_CLOSE_EVENT };

export function notifyEveningCloseUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENING_CLOSE_EVENT));
}

export function formatEveningCloseDailyLine(t: TFn, locale?: Parameters<typeof buildEveningCloseSnapshot>[1]): string | null {
  if (!isEveningClosePendingToday()) {
    const saved = loadTodayEveningCloseSnapshot();
    if (saved) {
      const carry = saved.tomorrowCarryForward[0]?.text ?? "";
      if (carry && saved.tomorrowReadiness !== "clear" && saved.tomorrowReadiness !== "manageable") {
        return t("eclose.daily.closedPressured", {
          readiness: t(`eclose.tomorrow.${saved.tomorrowReadiness}`),
          carry,
        });
      }
      return null;
    }
    return null;
  }
  const snap = buildEveningCloseSnapshot(t, locale);
  const extra =
    snap.tomorrowReadiness === "pressured" || snap.tomorrowReadiness === "unstable"
      ? snap.tomorrowCarryForward[0]?.text
        ? ` · ${snap.tomorrowCarryForward[0].text}`
        : ""
      : "";
  return t("eclose.daily.pending", { extra });
}

export function getEveningCloseDailyLine(
  t: TFn,
  locale?: Parameters<typeof buildEveningCloseSnapshot>[1],
): string | null {
  return formatEveningCloseDailyLine(t, locale);
}
