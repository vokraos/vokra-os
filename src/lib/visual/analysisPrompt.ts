import { bilingualReasoningBlock, outputModeDirective } from "../ai/localeAi";
import { VOKRA_VOICE_RULES_EN } from "../ai/voice";
import { getStoredOutputMode } from "../i18n/localeStorage";
import type { VisualAssetKind } from "./types";
import { SLOT_LABEL_MODEL_EN } from "./slots";

export function buildVisualAnalysisSystemPrompt(): string {
  return [
    "You are VOKRA Visual Intelligence — the vision operating core for marketplace fashion (Wildberries, Ozon, DTF, oversized streetwear).",
    VOKRA_VOICE_RULES_EN,
    bilingualReasoningBlock("mixed"),
    outputModeDirective(getStoredOutputMode()),
    "Return a single valid JSON object matching the user schema. No markdown fences, no prose outside JSON.",
    "Internally optimize visual reasoning in English; JSON string values follow the output-language policy above.",
    "Use marketplace-native thinking: first image, tile contrast, thumb legibility, print scale, visual hierarchy, feed noise.",
  ].join("\n\n");
}

const JSON_CONTRACT_V2 = `Return a single JSON object ONLY (no markdown fences, no commentary). Use this exact shape and keys:

{
  "schemaVersion": 2,
  "executiveSummary": string,
  "quickSummary": string,
  "scoreConfidence": {
    "overall": number,
    "ctrSignal": number,
    "notes": string
  },
  "conversionPrediction": {
    "score": number,
    "headline": string,
    "rationale": string
  },
  "compare": null | {
    "winner": "A" | "B" | "tie",
    "thumbnailPick": "A" | "B" | "tie",
    "rationale": string,
    "whyCtrGap": string,
    "howToCloseGap": string
  },
  "recommendationClusters": {
    "ctrRisk": [{ "title": string, "whyCtr": string, "howToFix": string }],
    "production": [{ "title": string, "action": string, "rationale": string }]
  },
  "meta": {
    "detectedScene": string,
    "inferredAssetRoles": string[],
    "wbOzonScreenshotLikelihood": number,
    "notesForCreativeDirector": string
  },
  "scores": {
    "ctrPotential": number,
    "marketplace": number,
    "cinematic": number,
    "luxury": number,
    "readability": number,
    "emotionalImpact": number
  },
  "dimensions": {
    "composition": { "score": number, "insight": string },
    "contrast": { "score": number, "insight": string },
    "thumbnailVisibility": { "score": number, "insight": string },
    "printReadability": { "score": number, "insight": string },
    "luxuryPerception": { "score": number, "insight": string },
    "fashionPositioning": { "score": number, "insight": string },
    "emotionalTone": { "score": number, "insight": string },
    "cinematicQuality": { "score": number, "insight": string },
    "marketplaceCtrPotential": { "score": number, "insight": string },
    "mobileReadability": { "score": number, "insight": string },
    "silhouetteVisibility": { "score": number, "insight": string },
    "lightingQuality": { "score": number, "insight": string }
  },
  "marketplaceScreenshot": null | {
    "stoppingPower": { "score": number, "insight": string },
    "firstImageEffectiveness": { "score": number, "insight": string },
    "mobileFeedVisibility": { "score": number, "insight": string },
    "likelyConversionWeaknesses": string[],
    "visualClutter": { "score": number, "insight": string },
    "printVisibility": { "score": number, "insight": string },
    "emotionalImpactInFeed": { "score": number, "insight": string }
  },
  "recommendations": [{ "action": string, "rationale": string, "priority": "high" | "medium" | "low" }],
  "generative": {
    "seoDirection": {
      "titleSeeds": string[],
      "descriptionAngle": string,
      "keywords": string[],
      "marketplaceTone": string
    },
    "richContentBlocks": [
      { "blockTitle": string, "angle": string, "heroPromptHint": string }
    ],
    "fashionPrompts": string[],
    "reelsConcepts": string[],
    "campaignConcepts": string[],
    "thumbnailImprovements": string[],
    "visualStorytelling": string
  }
}

Rules:
- schemaVersion must be 2.
- All scores integers 0-100. scoreConfidence fields 0-100.
- executiveSummary: 2-3 sentences, decisive, creative-director tone.
- quickSummary: 1-2 sentences max.
- recommendationClusters: ctrRisk 3-5 items; production 3-5 items; each item must be non-generic and marketplace-aware.
- recommendations flat list: still 6-10 items, actionable, distinct from cluster titles.
- generative.richContentBlocks: exactly 8 items.
- generative.fashionPrompts: 4-6 English prompts.
- If compare mode is OFF: set compare to null.
- If compare mode is ON: fill compare with winner analysis using Image A = first image, Image B = second.
`;

export function buildVisualAnalysisUserPrompt(args: {
  marketplaceMode: boolean;
  compareMode: boolean;
  slots: { kind: VisualAssetKind }[];
}): string {
  const slotLines = args.slots
    .map((s, i) => `Image ${i + 1} (${String.fromCharCode(65 + i)}): ${SLOT_LABEL_MODEL_EN[s.kind]} [kind=${s.kind}]`)
    .join("\n");

  const mode = args.marketplaceMode
    ? "USER ENABLED WB/OZON SCREENSHOT MODE: prioritize mobile feed stopping power, first-image effectiveness, clutter vs hierarchy, conversion weaknesses. Populate marketplaceScreenshot with full detail (not null). If clearly not a screenshot, still populate with honest low scores."
    : "Standard analysis. If clearly a WB/Ozon screenshot, populate marketplaceScreenshot and raise wbOzonScreenshotLikelihood; else marketplaceScreenshot may be null.";

  const compare = args.compareMode
    ? "COMPARE MODE ON: exactly two images. Image A = first, Image B = second. Judge which is a stronger WB/Ozon thumbnail (stopping power, print read, hierarchy). Fill compare object; explain why the weaker tile would reduce CTR and how to close the gap."
    : "COMPARE MODE OFF: set compare to null.";

  return [
    "TASK: elite visual QA + marketplace creative intelligence for VOKRA operators.",
    "",
    mode,
    compare,
    "",
    "Attached images in order:",
    slotLines,
    "",
    JSON_CONTRACT_V2,
  ].join("\n");
}
