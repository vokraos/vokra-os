import { calculateUnitEconomics } from "../unit-economics/calculate";
import { loadUnitEconomicsBundle } from "../unit-economics/storage";
import type { UnitEconomicsProfileRow } from "../unit-economics/types";
import { buildEconomicGuardrails, guardrailSummaryLines } from "./rules";
import type { GuardrailBuildContext } from "./types";
import type { EconomicGuardrail } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function profileRowsFromStorage(): UnitEconomicsProfileRow[] {
  return loadUnitEconomicsBundle().profiles.map((profile) => ({
    profile,
    calculated: calculateUnitEconomics(profile),
  }));
}

export function loadEconomicGuardrails(ctx: GuardrailBuildContext = {}): EconomicGuardrail[] {
  return buildEconomicGuardrails(profileRowsFromStorage(), ctx);
}

export function loadEconomicGuardrailsWithContext(
  expansionPressureElevated?: boolean,
): EconomicGuardrail[] {
  return loadEconomicGuardrails({ expansionPressureElevated });
}

export function buildGuardrailSummaryForMemory(guardrails: EconomicGuardrail[], t: TFn): string[] {
  return guardrailSummaryLines(guardrails, t, 8);
}
