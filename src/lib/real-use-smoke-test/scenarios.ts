import type { NavId } from "../../types";
import type { SmokeScenarioType, SmokeTestStepId } from "./types";

export type SmokeStepDef = {
  id: SmokeTestStepId;
  navId: NavId;
  titleKey: string;
  whyKey: string;
};

export const SCENARIO_STEP_ORDER: Record<SmokeScenarioType, readonly SmokeTestStepId[]> = {
  hero_refresh: [
    "war_room",
    "competitive_map",
    "hero_command",
    "prompt_composer",
    "visual_production",
    "hero_test_results",
    "launch_package",
    "observation",
  ],
  fbo_launch: [
    "war_room",
    "fbo_fbs",
    "scaling_safety",
    "launch_ops",
    "production_pressure",
    "assortment_actions",
    "evening_close",
  ],
  production_overload: [
    "war_room",
    "production_pressure",
    "required_shift",
    "production_daily_plan",
    "operator_mode",
    "shift_feedback",
    "evening_close",
  ],
  collection_launch: [
    "war_room",
    "collection_builder",
    "prompt_pack",
    "visual_production",
    "card_production",
    "launch_ops",
    "assortment_actions",
  ],
  daily_operations: [
    "morning_start",
    "war_room",
    "operator_mode",
    "production_pressure",
    "war_room_revisit",
    "evening_close",
  ],
};

const STEP_NAV: Record<SmokeTestStepId, NavId> = {
  war_room: "warRoom",
  competitive_map: "competitiveMap",
  hero_command: "heroCommand",
  prompt_composer: "promptComposer",
  visual_production: "visualProduction",
  hero_test_results: "competitiveMap",
  launch_package: "competitiveMap",
  observation: "competitiveMap",
  fbo_fbs: "fboFbsDecision",
  scaling_safety: "scalingSafety",
  launch_ops: "launchOperations",
  production_pressure: "productionPressure",
  assortment_actions: "assortmentActions",
  evening_close: "eveningClose",
  required_shift: "productionPressure",
  production_daily_plan: "productionPressure",
  operator_mode: "operatorMode",
  shift_feedback: "productionPressure",
  collection_builder: "collectionBuilder",
  prompt_pack: "promptPack",
  card_production: "cardProduction",
  morning_start: "morningStart",
  war_room_revisit: "warRoom",
};

export function smokeStepNavId(id: SmokeTestStepId): NavId {
  return STEP_NAV[id] ?? "warRoom";
}

export function stepsForScenario(scenario: SmokeScenarioType): SmokeStepDef[] {
  return SCENARIO_STEP_ORDER[scenario].map((id) => ({
    id,
    navId: smokeStepNavId(id),
    titleKey: `rtest.step.${id}`,
    whyKey: `rtest.why.${id}`,
  }));
}
