/**
 * Phase 15 — launch-ready visual prompt pack (collection → composer → production).
 */

export const PROMPT_PACK_ENTITY_SCHEMA = "vokra.promptPackEntity.v1" as const;

export type PromptPackKind =
  | "marketplace_launch"
  | "campaign"
  | "reels"
  | "exhibition_capsule"
  | "corporate_merch";

export type PromptPackMarketplaceCode = "wb" | "ozon" | "both";

/** Complete visual prompt pack for a commercial collection (paste-ready strings). */
export type PromptPackEntity = {
  id: string;
  collectionId: string;
  collectionName: string;
  corridor: string;
  marketplaceTarget: string;
  /** Lane used to assemble the pack (marketplace, campaign, reels, exhibition, corporate). */
  promptPackKind: PromptPackKind;
  visualDirection: string;
  heroPrompts: string[];
  supportPrompts: string[];
  detailPrompts: string[];
  reelsPrompts: string[];
  campaignPrompts: string[];
  negativeConstraints: string[];
  productionNotes: string;
  marketplaceNotes: string;
  brandFit: string;
  riskFlags: string[];
  createdAt: number;
};

export type PromptPackSessionSource = "collection_builder" | "project_memory";

export type PromptPackSessionEnvelope = {
  schema: "vokra.promptPackSession.v1";
  entity: PromptPackEntity;
  source?: PromptPackSessionSource;
};

export const PROMPT_PACK_SESSION_KEY = "vokra.promptPackSession.v1";
