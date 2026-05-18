import type { GuardrailType } from "./types";

export function newEconomicGuardrailId(profileId: string, type: GuardrailType): string {
  return `egr-${profileId}-${type}`;
}
