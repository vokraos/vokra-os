import { buildStrategicDateSystemBlock, buildStrategicDateUserLine } from "../ai/strategicDateContext";
import { VOKRA_VOICE_RULES_EN } from "../ai/voice";
import type { StrategicCommandInput } from "./types";

const JSON_CONTRACT = `Return ONE JSON object only (no markdown fences, no commentary). Schema (schemaVersion MUST be 2):
{
  "schemaVersion": 2,
  "executiveVerdict": {
    "verdict": string,
    "confidence": string,
    "dominationScore": number,
    "marketWindow": string,
    "primaryRisk": string,
    "whyNow": string
  },
  "executiveDashboard": {
    "commandSummary": string,
    "marketPressure": string,
    "launchPriority": string,
    "profitabilityPotential": string,
    "recommendedActions": string[]
  },
  "unifiedScores": {
    "opportunity": number,
    "launchReadiness": number,
    "profitability": number,
    "visualCohesion": number,
    "seoLeverage": number,
    "productionRisk": number
  },
  "trendSignalBrief": {
    "headline": string,
    "synthesis": string,
    "saturation": string,
    "velocity": string,
    "emotionalDrivers": string[]
  },
  "competitorSynthesis": {
    "narrative": string,
    "marketWeaknesses": string[],
    "visualPatterns": string[],
    "seoPatterns": string[],
    "pricingPatterns": string[]
  },
  "skuLaunchMap": [
    { "skuName": string, "priority": number, "fitLine": "oversize"|"standard"|"both", "rationale": string, "marketplaceAngle": string }
  ],
  "pricingStrategy": {
    "anchorBand": string,
    "ladder": string[],
    "wbOzonTactics": string,
    "marginGuardrails": string[]
  },
  "visualDirection": {
    "heroStyle": string,
    "colorDirection": string,
    "compositionDirection": string,
    "photographyDirection": string,
    "oversizeNotes": string,
    "standardFitNotes": string,
    "marketplaceCtrAdvice": string[]
  },
  "contentStrategy": {
    "pillars": string[],
    "reelsIdeas": string[],
    "campaignAngles": string[],
    "ugcHooks": string[],
    "storytellingAngles": string[]
  },
  "productionRiskAnalysis": {
    "dtfPipeline": string,
    "complexity": string,
    "scalability": string,
    "riskLevel": string,
    "marginPotential": string,
    "bottlenecks": string[],
    "mitigations": string[],
    "manufacturingAdvice": string[]
  },
  "seoPriorityMap": [
    { "tier": string, "items": [ { "focus": string, "action": string, "priority": string } ] }
  ],
  "actionHorizons": {
    "days7": string[],
    "days30": string[],
    "days90": string[]
  },
  "launchPlanWeek": {
    "day1": string, "day2": string, "day3": string, "day4": string,
    "day5": string, "day6": string, "day7": string
  },
  "aiDepartments": [
    { "role": string, "department": string, "mission": string, "status": "active"|"blocked"|"standby", "coordination": string, "output": string }
  ],
  "bottleneckDetection": string[],
  "recommendedExperiments": string[],
  "scalingOpportunities": string[],
  "growthForecast": string,
  "tacticalRoadmap": string,
  "launchRecommendations": string[],
  "finalCommand": string
}
Numeric rules:
- All scores 0–100 integers. productionRisk = higher means MORE operational risk (inverse of comfort).
- dominationScore should align ~±8 with unifiedScores.opportunity unless you explain tension in executiveVerdict.verdict.
Array sizes:
- executiveDashboard.recommendedActions: 4–8
- emotionalDrivers: 4–8
- skuLaunchMap: 3–8 rows
- aiDepartments: exactly 8 (Trend Radar liaison, Competitor intel, Visual lab, Memory archivist, Marketplace WB/Ozon, Production/DTF, SEO, Growth ops) — localize role/department names to OUTPUT_LANGUAGE.
- actionHorizons: days7 (5–8), days30 (6–10), days90 (5–8) actionable bullets.
- bottleneckDetection / recommendedExperiments / scalingOpportunities: 4–8 each`;

const META_RULES = [
  "## Meta-layer rules (non-negotiable)",
  "- You are the **Strategic Command Center**: a **board-level fusion** across modules. **Do not** output a second Trend Radar (no trendCards, no six-layer dump, no agent persona essays). **trendSignalBrief** is a **short cross-check** vs memory + query.",
  "- **Default manufacturing path is DTF on blanks** (tees/hoodies/etc.). **Do not** propose embroidery, complex tailoring, or multi-panel cut-and-sew **unless** the user explicitly asks for it.",
  "- **Fit matrix:** always address **oversize** and **standard** where relevant (SKUs, visuals, sizing copy).",
  "- **Marketplace-first:** Wildberries / Ozon card economics, PDP, FBO/FBS hints, review velocity — prioritize over D2C unless mission says otherwise.",
  "- If **Project memory** block is empty or says no snapshots, acknowledge uncertainty briefly — still deliver the JSON.",
  "- **Screenshots** (if provided): treat as marketplace/visual evidence; never claim you scraped live listings.",
].join("\n");

export function buildStrategicCommandSystemPrompt(outputLanguage: "ru" | "en"): string {
  const langRule =
    outputLanguage === "ru"
      ? "OUTPUT LANGUAGE: Russian for every human-readable string in JSON. Hybrid English allowed for: SEO, CTR, SKU, DTF, FBO, FBS, PDP, UGC, reels, WB, Ozon."
      : "OUTPUT LANGUAGE: English for every human-readable string in JSON. Keep standard industry acronyms.";

  return [
    "You are the VOKRA Strategic Command Center — the **meta AI orchestrator** sitting above Trend Radar, Competitor Intelligence, Visual Intelligence, and Project Memory.",
    "You produce **one** executive JSON report: decisive, cinematic in language, zero generic AI filler, zero motivational fluff.",
    "Tone: Palantir-grade clarity — what to own first, where margin dies, what to ship on DTF this week.",
    langRule,
    buildStrategicDateSystemBlock(),
    META_RULES,
    JSON_CONTRACT,
    VOKRA_VOICE_RULES_EN,
  ].join("\n\n");
}

function marketplaceLabel(m: StrategicCommandInput["marketplace"]): string {
  if (m === "wildberries") return "Wildberries";
  if (m === "ozon") return "Ozon";
  return "Wildberries + Ozon";
}

function modeLabel(m: StrategicCommandInput["mode"]): string {
  if (m === "aggressive") return "aggressive";
  if (m === "premium") return "premium";
  return "scalable";
}

function priceLabel(p: StrategicCommandInput["priceSegment"]): string {
  if (p === "low") return "low / mass";
  if (p === "middle") return "middle";
  return "premium";
}

export function buildStrategicCommandUserMessage(input: StrategicCommandInput, memoryBlock: string): string {
  const q = input.query.trim() || "—";
  const g = input.goal.trim() || "—";

  return [
    buildStrategicDateUserLine(),
    "",
    `OUTPUT_LANGUAGE: ${input.locale === "ru" ? "ru" : "en"}`,
    "",
    "## Marketplace query / niche",
    q,
    "",
    "## Strategic goal",
    g,
    "",
    "## Controls",
    `- Marketplace focus: ${marketplaceLabel(input.marketplace)}`,
    `- Operating mode: ${modeLabel(input.mode)}`,
    `- Price segment: ${priceLabel(input.priceSegment)}`,
    "",
    memoryBlock.trim(),
    "",
    "## Output discipline",
    "Return the JSON. Fuse modules into **one** command narrative. trendSignalBrief.synthesis ≤ 120 words.",
  ].join("\n");
}

export function buildStrategicCommandVisionPreamble(input: StrategicCommandInput): string {
  return [
    buildStrategicDateUserLine(),
    "",
    `OUTPUT_LANGUAGE: ${input.locale === "ru" ? "ru" : "en"}`,
    "",
    "## Attached screenshots",
    "Analyze them as **marketplace / moodboard / competitor card** evidence. Then read the text blocks below and return the single JSON object from the system contract.",
  ].join("\n");
}

export function buildStrategicCommandPrompt(
  input: StrategicCommandInput,
  memoryBlock: string,
): { system: string; user: string } {
  return {
    system: buildStrategicCommandSystemPrompt(input.locale),
    user: buildStrategicCommandUserMessage(input, memoryBlock),
  };
}
