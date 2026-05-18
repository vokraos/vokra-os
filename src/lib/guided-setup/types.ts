import type { NavId } from "../../types";

export const GUIDED_SETUP_MEMORY_SCHEMA = "vokra.guidedSetup.v1" as const;

export type GuidedSetupStepId =
  | "import_data"
  | "activate_snapshot"
  | "cleanup_data"
  | "unit_economics"
  | "assortment_actions"
  | "execution_plan"
  | "hero_competitor_analysis"
  | "founder_brief"
  | "control_tower";

export const GUIDED_SETUP_STEP_ORDER: readonly GuidedSetupStepId[] = [
  "import_data",
  "activate_snapshot",
  "cleanup_data",
  "unit_economics",
  "assortment_actions",
  "execution_plan",
  "hero_competitor_analysis",
  "founder_brief",
  "control_tower",
] as const;

export type GuidedSetupStepMeta = {
  id: GuidedSetupStepId;
  navId: NavId;
  whyKey: string;
  whatKey: string;
  outcomeKey: string;
  titleKey: string;
};

export type GuidedSetupPlan = {
  id: string;
  createdAt: number;
  currentStep: GuidedSetupStepId;
  completedSteps: GuidedSetupStepId[];
  blockedSteps: GuidedSetupStepId[];
  nextStep: GuidedSetupStepId;
  progressPercent: number;
  expectedOutcomeKey: string;
  expectedOutcomeVars: Record<string, string>;
  linkedModules: NavId[];
  confidenceNoteKey: string;
  isComplete: boolean;
};

export type GuidedSetupMemoryPayload = {
  schema: typeof GUIDED_SETUP_MEMORY_SCHEMA;
  savedAt: number;
  plan: GuidedSetupPlan;
};
