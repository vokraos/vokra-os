import { interpretCapacityLoad } from "./capacity-interpret";
import { resolveCapacitySnapshot, resolvedLimitsToProfile } from "./capacity-resolve";
import type { CapacityInterpretation, ProductionLoadSnapshot } from "./capacity-types";
import { getActiveShiftScenario, resolveBaseProfileForScenario } from "./shift-store";
import { getActiveCapacityProfile } from "./capacity-store";

export function buildCapacityInterpretation(load: ProductionLoadSnapshot): CapacityInterpretation {
  const scenario = getActiveShiftScenario();
  const profile = resolveBaseProfileForScenario(scenario) ?? getActiveCapacityProfile();
  const resolved = resolveCapacitySnapshot(profile, scenario);
  const effectiveProfile =
    profile && resolved ? resolvedLimitsToProfile(profile, resolved) : profile;
  return interpretCapacityLoad(load, effectiveProfile, resolved);
}
