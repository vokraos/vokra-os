import type { NavId } from "../../types";
import type { MorningFlowStepId } from "./types";

export type MorningStepDef = {
  id: MorningFlowStepId;
  navId: NavId;
  titleKey: string;
  whyKey: string;
};

export const MORNING_STEP_DEFS: readonly MorningStepDef[] = [
  {
    id: "open_war_room",
    navId: "warRoom",
    titleKey: "mflow.step.open_war_room",
    whyKey: "mflow.why.open_war_room",
  },
  {
    id: "confirm_role_mode",
    navId: "dashboard",
    titleKey: "mflow.step.confirm_role_mode",
    whyKey: "mflow.why.confirm_role_mode",
  },
  {
    id: "check_production_capacity",
    navId: "productionPressure",
    titleKey: "mflow.step.check_production_capacity",
    whyKey: "mflow.why.check_production_capacity",
  },
  {
    id: "review_assortment_plan",
    navId: "assortmentActions",
    titleKey: "mflow.step.review_assortment_plan",
    whyKey: "mflow.why.review_assortment_plan",
  },
  {
    id: "review_launch_risks",
    navId: "launchOperations",
    titleKey: "mflow.step.review_launch_risks",
    whyKey: "mflow.why.review_launch_risks",
  },
  {
    id: "review_hero_work",
    navId: "heroCommand",
    titleKey: "mflow.step.review_hero_work",
    whyKey: "mflow.why.review_hero_work",
  },
  {
    id: "prepare_operator_work_order",
    navId: "operatorMode",
    titleKey: "mflow.step.prepare_operator_work_order",
    whyKey: "mflow.why.prepare_operator_work_order",
  },
  {
    id: "save_start_snapshot",
    navId: "warRoom",
    titleKey: "mflow.step.save_start_snapshot",
    whyKey: "mflow.why.save_start_snapshot",
  },
] as const;

export function morningStepNavId(id: MorningFlowStepId): NavId {
  return MORNING_STEP_DEFS.find((s) => s.id === id)?.navId ?? "warRoom";
}
