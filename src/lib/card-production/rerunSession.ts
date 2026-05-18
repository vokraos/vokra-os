import { parseCardProductionBoardEnvelope } from "./parseBoard";
import type { CardProductionBoardEnvelope } from "./types";

const RERUN_KEY = "vokra.rerun";

export function consumeRerunCardProductionBoard(): CardProductionBoardEnvelope | null {
  try {
    const raw = sessionStorage.getItem(RERUN_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { module?: string; sourceModule?: string; content?: string };
    if (o.module !== "cardProduction" || o.sourceModule !== "card_production") return null;
    if (typeof o.content !== "string") {
      sessionStorage.removeItem(RERUN_KEY);
      return null;
    }
    let inner: unknown;
    try {
      inner = JSON.parse(o.content) as unknown;
    } catch {
      inner = o.content;
    }
    const env = parseCardProductionBoardEnvelope(inner);
    sessionStorage.removeItem(RERUN_KEY);
    return env;
  } catch {
    return null;
  }
}
