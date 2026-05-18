import { parseVisualAssetRegistryEnvelope } from "./parseRegistry";
import type { VisualAssetRegistryEnvelope } from "./types";

const RERUN_KEY = "vokra.rerun";

export function consumeRerunVisualAssetRegistry(): VisualAssetRegistryEnvelope | null {
  try {
    const raw = sessionStorage.getItem(RERUN_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { module?: string; sourceModule?: string; content?: string };
    if (o.module !== "visualAssets" || o.sourceModule !== "visual_asset_registry") return null;
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
    const env = parseVisualAssetRegistryEnvelope(inner);
    sessionStorage.removeItem(RERUN_KEY);
    return env;
  } catch {
    return null;
  }
}
