import type {
  CapacityInterpretState,
  CapacityLoadMetricId,
  ProductionLoadSnapshot,
} from "./capacity-types";

export type ShiftRequirementType =
  | "keep_current"
  | "switch_scenario"
  | "use_strong_shift"
  | "use_launch_day"
  | "use_fbo_prep_day"
  | "reduce_workload"
  | "split_workload";

export type ShiftRequirementRecommendation = {
  id: string;
  createdAt: number;
  currentScenarioId: string | null;
  recommendedScenarioId: string | null;
  recommendationType: ShiftRequirementType;
  reasonKey: string;
  reasonVars: Record<string, string>;
  workloadSnapshot: ProductionLoadSnapshot;
  currentCapacityState: CapacityInterpretState;
  recommendedCapacityState: CapacityInterpretState;
  unresolvedOverloads: CapacityLoadMetricId[];
  workloadReductions: string[];
  confidenceNoteKey: string;
};
