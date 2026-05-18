import { getStoredOutputMode, type AiOutputMode } from "../i18n/localeStorage";
import { buildStrategicDateSystemBlock } from "./strategicDateContext";
import { VOKRA_VOICE_RULES_EN } from "./voice";

export type DetectedLang = "ru" | "en" | "mixed";

/** Lightweight detection for telemetry / prompt framing (no external API). */
export function detectInputLanguage(text: string): DetectedLang {
  const t = text.trim();
  if (!t) return "en";
  const cyr = (t.match(/[\u0400-\u04FF]/g) ?? []).length;
  const lat = (t.match(/[A-Za-z]/g) ?? []).length;
  if (cyr > 0 && lat > cyr * 0.35) return "mixed";
  if (cyr > lat) return "ru";
  return "en";
}

export function outputModeDirective(mode: AiOutputMode): string {
  if (mode === "ru") {
    return [
      "OUTPUT LANGUAGE: Russian for all customer-facing copy and explanations.",
      "Keep established English fashion / cinematic terms inline where they read more natural (e.g. cinematic mood, luxury streetwear, visual clutter, DTF, rim light).",
    ].join("\n");
  }
  if (mode === "en") {
    return "OUTPUT LANGUAGE: English throughout (still tuned for WB/Ozon marketplace context).";
  }
  return [
    "OUTPUT LANGUAGE: Hybrid — Russian for marketplace copy and operational guidance;",
    "English for tool prompts, technical lighting/camera vocabulary, and high-fashion editorial phrases when they land sharper.",
  ].join("\n");
}

export function bilingualReasoningBlock(detected: DetectedLang): string {
  return [
    "BILINGUAL PIPELINE:",
    "- The operator UI may be Russian; user field values may be Russian or mixed.",
    "- Internally parse intent, constraints, and marketplace semantics with maximum fidelity using English reasoning.",
    "- Do not mirror poor OCR or noise; infer product role (hero, detail, screenshot) carefully.",
    `- Detected dominant field language hint: ${detected}.`,
  ].join("\n");
}

/** Wrap user-provided fields so the model always sees explicit structure. */
export function wrapUserFieldsBlock(label: string, body: string): string {
  return [`### ${label}`, body.trim() || "(not provided)"].join("\n");
}

/**
 * Full system preamble for streaming text modules.
 * English-first for model quality; output language governed by outputMode.
 * @param options.includeStrategicDateContext — append CLOCK + timing rules (Campaign Creator and similar).
 */
export function buildTextModuleSystemPrompt(
  userBlob: string,
  options?: { includeStrategicDateContext?: boolean },
): string {
  const mode = getStoredOutputMode();
  const detected = detectInputLanguage(userBlob);
  const base = [
    "You are VOKRA Content Engine — an internal AI operating system for marketplace fashion (Wildberries, Ozon) and paid/social.",
    VOKRA_VOICE_RULES_EN,
    bilingualReasoningBlock(detected),
    outputModeDirective(mode),
    "Deliver production-ready artifacts. Avoid tutorial tone and meta commentary unless asked.",
  ].join("\n\n");
  if (!options?.includeStrategicDateContext) return base;
  return [base, buildStrategicDateSystemBlock()].join("\n\n");
}
