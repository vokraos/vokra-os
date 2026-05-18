import { parseVisualProductionQueueEnvelope } from "./parseQueue";
import type { VisualProductionQueueEnvelope } from "./types";

const RERUN_KEY = "vokra.rerun";

export function consumeRerunVisualProductionQueue(): VisualProductionQueueEnvelope | null {
  try {
    const raw = sessionStorage.getItem(RERUN_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { module?: string; sourceModule?: string; content?: string };
    if (o.module !== "visualProduction" || o.sourceModule !== "visual_production") return null;
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
    const env = parseVisualProductionQueueEnvelope(inner);
    sessionStorage.removeItem(RERUN_KEY);
    return env;
  } catch {
    return null;
  }
}
