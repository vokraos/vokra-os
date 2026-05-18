import type { NavId } from "../../types";

export const REAL_USE_TEST_MEMORY_SCHEMA = "vokra.realUseTest.v1" as const;
export const REAL_USE_TEST_EVENT = "vokra:real-use-test-updated" as const;

export const SMOKE_SCENARIO_TYPES = [
  "hero_refresh",
  "fbo_launch",
  "production_overload",
  "collection_launch",
  "daily_operations",
] as const;

export type SmokeScenarioType = (typeof SMOKE_SCENARIO_TYPES)[number];

export const SMOKE_TEST_STEP_IDS = [
  "war_room",
  "competitive_map",
  "hero_command",
  "prompt_composer",
  "visual_production",
  "hero_test_results",
  "launch_package",
  "observation",
  "fbo_fbs",
  "scaling_safety",
  "launch_ops",
  "production_pressure",
  "assortment_actions",
  "evening_close",
  "required_shift",
  "production_daily_plan",
  "operator_mode",
  "shift_feedback",
  "collection_builder",
  "prompt_pack",
  "card_production",
  "morning_start",
  "war_room_revisit",
] as const;

export type SmokeTestStepId = (typeof SMOKE_TEST_STEP_IDS)[number];

export type SmokeTestStepStatus = "pending" | "done" | "blocked";

export type SmokeTestVerdict = "unset" | "works" | "partial" | "confusing" | "blocked";

export type SmokeTestStep = {
  id: SmokeTestStepId;
  status: SmokeTestStepStatus;
  navId: NavId;
  titleKey: string;
  whyKey: string;
};

export type SmokeTestSimplification = {
  screensUsed: string[];
  screensIgnored: string[];
  confusingAreas: string[];
  missingData: string[];
  recommendedSimplifications: string[];
  recommendedNextBuildFixes: string[];
};

export type RealUseSmokeTest = {
  id: string;
  createdAt: number;
  scenarioType: SmokeScenarioType;
  currentStep: SmokeTestStepId;
  completedSteps: SmokeTestStepId[];
  blockedSteps: SmokeTestStepId[];
  observedFriction: string[];
  usefulScreens: SmokeTestStepId[];
  confusingScreens: SmokeTestStepId[];
  missingData: string[];
  finalVerdict: SmokeTestVerdict;
  recommendedSimplifications: string[];
  confidenceNote: string;
  steps: SmokeTestStep[];
  simplification: SmokeTestSimplification | null;
  isComplete: boolean;
};

export type RealUseTestMemoryPayload = {
  schema: typeof REAL_USE_TEST_MEMORY_SCHEMA;
  savedAt: number;
  test: RealUseSmokeTest;
  founderNotes: {
    observedFriction: string[];
    usefulScreens: SmokeTestStepId[];
    confusingScreens: SmokeTestStepId[];
    missingData: string[];
    finalVerdict: SmokeTestVerdict;
  };
};
