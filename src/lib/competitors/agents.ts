/**
 * Agent-style engine registry — stable IDs for future plugins:
 * trend feeds, WB parsers, MPStats import, offer/creative automation.
 * UI labels live in i18n (`competitors.engine.*`).
 */
export const COMPETITOR_ENGINE_IDS = [
  "marketPatternEngine",
  "visualPsychologyEngine",
  "ctrIntelligence",
  "seoStructureAnalysis",
  "positioningGapDetector",
  "vokraWinningBlueprint",
] as const;

export type CompetitorEngineId = (typeof COMPETITOR_ENGINE_IDS)[number];
