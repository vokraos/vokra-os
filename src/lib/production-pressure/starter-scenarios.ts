import type { ProductionShiftScenario, ShiftScenarioType } from "./capacity-types";
import { createShiftScenarioFromType } from "./shift-store";

const STARTER_SCENARIOS: { type: ShiftScenarioType; nameKey: string }[] = [
  { type: "small_shift", nameKey: "prod.shift.starter.small" },
  { type: "normal_shift", nameKey: "prod.shift.starter.normal" },
  { type: "strong_shift", nameKey: "prod.shift.starter.strong" },
  { type: "weekend_catchup", nameKey: "prod.shift.starter.weekend" },
  { type: "launch_day", nameKey: "prod.shift.starter.launch" },
  { type: "fbo_prep_day", nameKey: "prod.shift.starter.fbo" },
  { type: "visual_content_day", nameKey: "prod.shift.starter.visual" },
];

/** Names filled by UI with t(); store English defaults for memory. */
const DEFAULT_NAMES: Record<ShiftScenarioType, string> = {
  small_shift: "Small shift",
  normal_shift: "Normal shift",
  strong_shift: "Strong shift",
  weekend_catchup: "Weekend catch-up",
  launch_day: "Launch day",
  fbo_prep_day: "FBO prep day",
  visual_content_day: "Visual / content day",
};

export function createStarterShiftScenarios(
  baseProfileId: string | null,
  t?: (key: string) => string,
): ProductionShiftScenario[] {
  return STARTER_SCENARIOS.map(({ type, nameKey }, i) => {
    const s = createShiftScenarioFromType(
      type,
      t ? t(nameKey) : DEFAULT_NAMES[type],
      baseProfileId,
    );
    return { ...s, active: i === 1 };
  });
}

import { saveShiftScenariosState } from "./shift-store";

export function resetShiftScenariosToStarter(
  baseProfileId: string | null,
  t?: (key: string) => string,
): ProductionShiftScenario[] {
  const scenarios = createStarterShiftScenarios(baseProfileId, t);
  const activeScenarioId = scenarios.find((s) => s.active)?.id ?? scenarios[1]?.id ?? null;
  saveShiftScenariosState({
    scenarios: scenarios.map((s) => ({ ...s, active: s.id === activeScenarioId })),
    activeScenarioId,
  });
  return scenarios;
}
