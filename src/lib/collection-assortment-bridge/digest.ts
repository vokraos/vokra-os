import { getActiveEntitySnapshot } from "../entity-snapshot";
import { listActiveCollectionExecutionActions } from "./storage";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function getCollectionExecutionDailyDigestLine(t: TFn): string | null {
  const snap = getActiveEntitySnapshot();
  if (!snap) return null;
  const active = listActiveCollectionExecutionActions(snap.id).sort((a, b) => b.updatedAt - a.updatedAt);
  const top = active[0];
  if (!top) return null;
  return t("daily.collection.actionLine", { action: top.title });
}
