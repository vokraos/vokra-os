import type { PromptPackEntity, PromptPackSessionEnvelope, PromptPackSessionSource } from "./types";
import { PROMPT_PACK_SESSION_KEY } from "./types";
import { parsePromptPackEntity } from "./parsePromptPackEntity";

const SESSION_SCHEMA = "vokra.promptPackSession.v1" as const;
const RERUN_KEY = "vokra.rerun";

export function loadPromptPackSessionState(): { entity: PromptPackEntity; source: PromptPackSessionSource } | null {
  try {
    const raw = sessionStorage.getItem(PROMPT_PACK_SESSION_KEY);
    if (!raw) return null;
    const outer = JSON.parse(raw) as unknown;
    if (typeof outer !== "object" || outer === null) return null;
    const o = outer as Partial<PromptPackSessionEnvelope>;
    if (o.schema !== SESSION_SCHEMA) return null;
    const entity = parsePromptPackEntity(outer);
    if (!entity) return null;
    const source: PromptPackSessionSource = o.source === "project_memory" ? "project_memory" : "collection_builder";
    return { entity, source };
  } catch {
    return null;
  }
}

export function loadPromptPackFromSession(): PromptPackEntity | null {
  return loadPromptPackSessionState()?.entity ?? null;
}

export function savePromptPackToSession(entity: PromptPackEntity, source: PromptPackSessionSource = "collection_builder"): void {
  const env: PromptPackSessionEnvelope = { schema: SESSION_SCHEMA, entity, source };
  try {
    sessionStorage.setItem(PROMPT_PACK_SESSION_KEY, JSON.stringify(env));
  } catch {
    /* quota */
  }
}

export function clearPromptPackSession(): void {
  try {
    sessionStorage.removeItem(PROMPT_PACK_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * If Project Memory scheduled a rerun for a prompt_pack generation, consume JSON and clear the key.
 */
export function consumeRerunPromptPackEntity(): PromptPackEntity | null {
  try {
    const raw = sessionStorage.getItem(RERUN_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { module?: string; sourceModule?: string; content?: string };
    if (o.module !== "promptPack" || o.sourceModule !== "prompt_pack") return null;
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
    const entity = parsePromptPackEntity(inner);
    sessionStorage.removeItem(RERUN_KEY);
    return entity;
  } catch {
    return null;
  }
}
