import { getActiveEntitySnapshot } from "../entity-snapshot";
import { listActiveHeroExecutionActions } from "./storage";

type TFn = (key: string, vars?: Record<string, string>) => string;

/** One compact Daily Operating line for the top active hero execution action. */
export function getHeroExecutionDailyDigestLine(t: TFn): string | null {
  const snap = getActiveEntitySnapshot();
  if (!snap) return null;
  const active = listActiveHeroExecutionActions(snap.id).sort((a, b) => b.updatedAt - a.updatedAt);
  const top = active[0];
  if (!top) return null;
  return t("daily.hero.actionLine", { action: top.title });
}
