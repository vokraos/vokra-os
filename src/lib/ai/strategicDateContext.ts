/** Calendar anchor for strategic modules (Russia-first marketplace context). */
export const STRATEGIC_DATE_TIMEZONE = "Europe/Moscow";

export type StrategicDateSnapshot = {
  /** YYYY-MM-DD in `timeZone`. */
  isoCalendarDate: string;
  calendarYear: number;
  enLong: string;
  ruLong: string;
  utcIso: string;
  timeZone: string;
};

/**
 * Snapshot of “today” for prompts. Always call at request time (e.g. inside builders),
 * not at module load, so streaming reruns stay current.
 */
export function getStrategicDateSnapshot(now: Date = new Date(), timeZone: string = STRATEGIC_DATE_TIMEZONE): StrategicDateSnapshot {
  const isoCalendarDate = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const calendarYear = Number.parseInt(isoCalendarDate.slice(0, 4), 10);

  const enLong = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const ruLong = new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  return {
    isoCalendarDate,
    calendarYear,
    enLong,
    ruLong,
    utcIso: now.toISOString(),
    timeZone,
  };
}

/** Full block for system prompts (clock + non-negotiable timing rules). */
export function buildStrategicDateSystemBlock(now: Date = new Date()): string {
  const s = getStrategicDateSnapshot(now);
  return [
    "## CLOCK (trusted reference time)",
    `Treat this as **today** for every timing claim, season, launch window, “why now”, and market-window string. Calendar day uses **${s.timeZone}**.`,
    `- **Calendar date:** ${s.isoCalendarDate}`,
    `- **Full (EN):** ${s.enLong}`,
    `- **Full (RU):** ${s.ruLong}`,
    `- **UTC (diagnostic):** ${s.utcIso}`,
    "",
    "### Calendar / market-window rules (non-negotiable)",
    `- Do **not** invent or imply **obsolete** market or seasonal windows in **past calendar years** (e.g. “April–August 2024”) unless the user **explicitly** asks for **historical** analysis or past-season benchmarking.`,
    `- Forward-looking windows must use **the current calendar year (${s.calendarYear})** and **months from today onward** in the same time zone as the CLOCK, or clearly labeled relative horizons (e.g. next 8–12 weeks).`,
    `- If exact month boundaries would be a guess, prefer **«ближайшие 30–90 дней»** or a clear English equivalent (“the next 30–90 days”) instead of fabricating specific outdated dates.`,
    "- Tie `marketWindow`, urgency, seasonal prep, campaign timelines, and any dated ranges to this CLOCK.",
  ].join("\n");
}

/** One compact line for user messages (JSON/strategic user blobs). */
export function buildStrategicDateUserLine(now: Date = new Date()): string {
  const s = getStrategicDateSnapshot(now);
  return `REFERENCE_NOW: ${s.isoCalendarDate} (${s.timeZone}) — all timing must follow the CLOCK rules in the system message; never use stale past-year windows unless historical analysis was requested; if unsure use «ближайшие 30–90 дней».`;
}

/** Short CLOCK section for markdown user prompts (e.g. Campaign). */
export function buildStrategicDateUserPreamble(now: Date = new Date()): string {
  const s = getStrategicDateSnapshot(now);
  return [
    "## CLOCK",
    `- **Calendar date (${s.timeZone}):** ${s.isoCalendarDate}`,
    `- **RU:** ${s.ruLong}`,
    `- **EN:** ${s.enLong}`,
    "Anchor the **14-day timeline**, seasonal hooks, and go-to-market windows to this date. Do not output obsolete past-year ranges unless the user clearly asks for historical review; if timing is uncertain, use **«ближайшие 30–90 дней»** (or the English equivalent).",
  ].join("\n");
}
