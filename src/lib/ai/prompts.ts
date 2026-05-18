import type { PromptStyle, RichContentInput, SeoInput } from "../../types";
import { buildStrategicDateUserPreamble } from "./strategicDateContext";

/** Minimal system string for connectivity checks only. */
export const CONNECTION_TEST_SYSTEM = "You are VOKRA internal tooling. Reply with exactly: OK";

export function seoPrompt(input: SeoInput) {
  return [
    "TASK: Produce a marketplace SEO package optimized for Wildberries and Ozon (Russian shopper context).",
    "FORMAT: Markdown with EXACT section headings:",
    "## SEO Title",
    "## SEO Description",
    "## Wildberries / Ozon Optimized Text",
    "## Keywords",
    "## Hashtags",
    "## Short Product Description",
    "## Long Product Description",
    "",
    "CONSTRAINTS:",
    "- SEO Title <= 120 characters.",
    "- SEO Description 350–550 characters.",
    "- Wildberries/Ozon body 800–1500 characters, short paragraphs, mobile-first scannability.",
    "- Keywords: 12–20 comma-separated.",
    "- Hashtags: 10–18 space-separated.",
    "",
    "USER FIELDS (may be Russian):",
    `- Product name: ${input.productName || "(not provided)"}`,
    `- Category: ${input.category || "(not provided)"}`,
    `- Style: ${input.style || "(not provided)"}`,
    `- Keyword seed: ${input.keywords || "(not provided)"}`,
  ].join("\n");
}

export function richContentPrompt(input: RichContentInput) {
  return [
    "TASK: Produce a full rich-content architecture for a fashion PDP (marketplace + premium tone).",
    "FORMAT: Markdown. Exactly 10 blocks with these headings:",
    "### 1. Главный premium banner",
    "### 2. Преимущества ткани",
    "### 3. DTF print technology",
    "### 4. Oversized fit",
    "### 5. Premium cotton quality",
    "### 6. Size guide",
    "### 7. Care instructions",
    "### 8. Why VOKRA",
    "### 9. Lifestyle block",
    "### 10. CTA block",
    "",
    "INSIDE EACH BLOCK include labeled fields:",
    "- Заголовок:",
    "- Продающий текст:",
    "- Идея визуала:",
    "- Prompt (image generation):",
    "- Micro-copy:",
    "- Композиция:",
    "- Свет:",
    "- Стиль модели:",
    "- Цветокоррекция:",
    "",
    "RULES:",
    "- Production-grade specificity; avoid generic filler.",
    "- Image prompts in English; customer-facing copy follows output-language policy.",
    "- Micro-copy: 2–6 words.",
    "",
    "USER FIELDS (may be Russian):",
    `- Print name: ${input.printName || "(not provided)"}`,
    `- Theme: ${input.theme || "(not provided)"}`,
    `- Style: ${input.style || "(not provided)"}`,
    `- Idea: ${input.idea || "(not provided)"}`,
  ].join("\n");
}

export function promptLabPrompt(args: { printName: string; theme: string; style: PromptStyle; idea: string }) {
  return [
    "TASK: Produce a prompt pack for fashion photography and generative image/video pipelines.",
    "FORMAT: Markdown with EXACT headings:",
    "## Fashion Photography Prompt",
    "## Midjourney Prompt",
    "## Flux Prompt",
    "## Kling Prompt",
    "## Grok Image Prompt",
    "## Lifestyle Prompt",
    "## Luxury Campaign Prompt",
    "",
    "RULES:",
    "- Prompt lines only (no meta explanation).",
    "- Consistent VOKRA luxury streetwear aesthetic.",
    "- Prompts in English; include lens / lighting / aspect where useful.",
    "",
    "USER FIELDS (may be Russian):",
    `- Print name: ${args.printName || "(not provided)"}`,
    `- Theme: ${args.theme || "(not provided)"}`,
    `- Style preset: ${args.style}`,
    `- Idea: ${args.idea || "(not provided)"}`,
  ].join("\n");
}

export function reelsPrompt(args: { printName: string; theme: string; style: string; idea: string }) {
  return [
    "TASK: Cinematic reels blueprint for a fashion drop (hooks, VO, shotlist, motion).",
    "FORMAT: Markdown with EXACT headings:",
    "## Title",
    "## Hook (first 2 seconds)",
    "## Concept",
    "## Script (VO + on-screen text)",
    "## Shotlist (storyboard)",
    "## Camera Movements",
    "## Transitions",
    "## Music Mood",
    "## Marketing Copy (caption + 3 variants)",
    "",
    "RULES:",
    "- Shotlist: 8–12 shots with timestamps.",
    "- Hooks: brutally clear, premium, non-cringe.",
    "- Follow output-language policy; technical terms may stay English.",
    "",
    "USER FIELDS (may be Russian):",
    `- Print name: ${args.printName || "(not provided)"}`,
    `- Theme: ${args.theme || "(not provided)"}`,
    `- Style: ${args.style || "(not provided)"}`,
    `- Idea: ${args.idea || "(not provided)"}`,
  ].join("\n");
}

export function campaignPrompt(input: RichContentInput, now: Date = new Date()) {
  return [
    buildStrategicDateUserPreamble(now),
    "",
    "TASK: Premium marketing campaign brief for a fashion SKU / drop (channels, assets, KPIs).",
    "FORMAT: Markdown with EXACT headings:",
    "## Campaign Name",
    "## Objective",
    "## Audience",
    "## Key Message",
    "## Asset List",
    "## Channel Plan (WB/Ozon + Social + Ads)",
    "## 14-day Timeline",
    "## KPI Targets",
    "## Copy Bank (10 lines)",
    "",
    "CONSTRAINTS:",
    "- Anchor every dated, seasonal, or launch-window reference to the CLOCK section above (first campaign day = that calendar day, or the next business day if you state that assumption). Never place the plan in a past year.",
    "- If a precise future calendar stretch is uncertain, prefer «ближайшие 30–90 дней» (or English equivalent) instead of inventing obsolete dates.",
    "",
    "USER FIELDS (may be Russian):",
    `- Print name: ${input.printName || "(not provided)"}`,
    `- Theme: ${input.theme || "(not provided)"}`,
    `- Style: ${input.style || "(not provided)"}`,
    `- Idea: ${input.idea || "(not provided)"}`,
  ].join("\n");
}
