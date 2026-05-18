import { PROMPT_PACK_ENTITY_SCHEMA } from "./types";
import type { PromptPackEntity, PromptPackKind } from "./types";

const PACK_KINDS: ReadonlySet<string> = new Set<PromptPackKind>([
  "marketplace_launch",
  "campaign",
  "reels",
  "exhibition_capsule",
  "corporate_merch",
]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function asStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out: string[] = [];
  for (const x of v) {
    if (typeof x === "string") out.push(x);
    else return null;
  }
  return out;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function validateEntityShape(obj: Record<string, unknown>): PromptPackEntity | null {
  if (!isNonEmptyString(obj.id)) return null;
  if (!isNonEmptyString(obj.collectionName)) return null;
  if (!isNonEmptyString(obj.corridor)) return null;
  const kind = obj.promptPackKind;
  if (typeof kind !== "string" || !PACK_KINDS.has(kind)) return null;

  const hero = asStringArray(obj.heroPrompts);
  const support = asStringArray(obj.supportPrompts);
  const detail = asStringArray(obj.detailPrompts);
  const reels = asStringArray(obj.reelsPrompts);
  const campaign = asStringArray(obj.campaignPrompts);
  if (!hero || !support || !detail || !reels || !campaign) return null;

  const totalPrompts = hero.length + support.length + detail.length + reels.length + campaign.length;
  if (totalPrompts < 1) return null;

  const neg = asStringArray(obj.negativeConstraints);
  const risks = asStringArray(obj.riskFlags);
  if (!neg || !risks) return null;

  const id = obj.id as string;
  const collectionIdRaw = asString(obj.collectionId, "").trim();

  return {
    id,
    collectionId: collectionIdRaw || id,
    collectionName: obj.collectionName as string,
    corridor: obj.corridor as string,
    marketplaceTarget: asString(obj.marketplaceTarget, ""),
    promptPackKind: kind as PromptPackKind,
    visualDirection: asString(obj.visualDirection, ""),
    heroPrompts: hero,
    supportPrompts: support,
    detailPrompts: detail,
    reelsPrompts: reels,
    campaignPrompts: campaign,
    negativeConstraints: neg,
    productionNotes: asString(obj.productionNotes, ""),
    marketplaceNotes: asString(obj.marketplaceNotes, ""),
    brandFit: asString(obj.brandFit, ""),
    riskFlags: risks,
    createdAt: asNumber(obj.createdAt, Date.now()),
  };
}

/**
 * Parse and validate a PromptPackEntity from memory JSON, session blob, or unknown API payload.
 */
export function parsePromptPackEntity(payload: unknown): PromptPackEntity | null {
  if (payload == null) return null;
  let root: unknown = payload;
  if (typeof payload === "string") {
    try {
      root = JSON.parse(payload) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof root !== "object" || root === null) return null;
  const obj = root as Record<string, unknown>;

  if (obj.schema === "vokra.promptPackSession.v1" && obj.entity && typeof obj.entity === "object") {
    return parsePromptPackEntity(obj.entity);
  }

  if (obj.schema !== undefined && obj.schema !== PROMPT_PACK_ENTITY_SCHEMA && typeof obj.schema === "string") {
    return null;
  }

  return validateEntityShape(obj);
}
