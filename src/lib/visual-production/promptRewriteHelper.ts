import { BRAND_DNA } from "../brand-dna/data";
import { VOKRA_VOICE_RULES_EN } from "../ai/voice";

/** Static marketplace clarity operators (no API) — aligned with composer physics language. */
const MARKETPLACE_CLARITY_RULES_EN = [
  "Thumbnail dominance: single focal plane, readable at small crop.",
  "Mobile contrast: no muddy mid-gray; garment block separates from background.",
  "Print plane clarity at card scale; simplify micro-detail if print muddies.",
  "Silhouette legibility: geometric read of garment massing.",
  "Low clutter: one story per frame; conversion hierarchy over decoration.",
  "WB/Ozon safe framing: predictable hero garment placement.",
];

export type PromptRewriteInput = {
  originalPrompt: string;
  negativeConstraints: string;
  issueFound: string;
  revisionInstruction: string;
};

function dnaSnippetForRewrite(): string {
  const v = BRAND_DNA.visual;
  const pillars = v.pillars.slice(0, 4).join("; ");
  const forbidden = v.forbidden.slice(0, 3).join("; ");
  return [
    `Mantra: ${BRAND_DNA.core.mantra}`,
    `Promise: ${BRAND_DNA.core.promise}`,
    `Visual pillars: ${pillars}`,
    `Avoid: ${forbidden}`,
  ].join("\n");
}

/**
 * Deterministic rewrite scaffold: pastes DNA + clarity rules + user issues into one external prompt block.
 * Not an LLM call — founder pastes into Grok/MJ/etc. as the corrected brief.
 */
export function suggestPromptRewrite(input: PromptRewriteInput): string {
  const issue = input.issueFound.trim() || "(no issue text — add specifics)";
  const rev = input.revisionInstruction.trim() || "(no revision instruction — add operator intent)";
  const neg = input.negativeConstraints.trim();
  const original = input.originalPrompt.trim();

  const correctedCore = [
    original,
    "",
    "— VOKRA REWRITE INJECTION —",
    "Address issues:",
    `- ${issue}`,
    "Revision intent:",
    `- ${rev}`,
    "",
    "Reinforce (DNA):",
    dnaSnippetForRewrite(),
    "",
    "Voice (English operator block):",
    VOKRA_VOICE_RULES_EN,
    "",
    "Marketplace clarity (must hold):",
    ...MARKETPLACE_CLARITY_RULES_EN.map((r) => `- ${r}`),
    neg ? `\nKeep / merge negatives: ${neg}` : "",
    "",
    "OUTPUT: single cohesive English image prompt, same SKU story, stricter hierarchy and legibility.",
  ]
    .filter(Boolean)
    .join("\n");

  return correctedCore.trim();
}
