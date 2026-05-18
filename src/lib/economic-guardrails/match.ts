import type { UnitEconomicsMatchContext, UnitEconomicsProfile } from "../unit-economics/types";
import { scoreProfileMatch } from "../unit-economics/match";
import type { EconomicGuardrail, GuardrailType } from "./types";

export function guardrailsForContext(
  guardrails: EconomicGuardrail[],
  ctx: UnitEconomicsMatchContext,
  types?: GuardrailType[],
): EconomicGuardrail[] {
  return guardrails.filter((g) => {
    if (types && !types.includes(g.guardrailType)) return false;
    const pseudo: UnitEconomicsProfile = {
      id: g.sourceProfileId,
      name: "",
      corridor: g.corridor,
      productFamily: g.productFamily,
      marketplace: g.marketplace,
      stockMode: g.stockMode,
      salePrice: 0,
      blankCost: 0,
      printCost: 0,
      packagingCost: 0,
      commissionPercent: 0,
      logisticsCost: 0,
      fboCost: 0,
      adCostEstimate: 0,
      returnRiskPercent: 0,
      targetMarginPercent: 0,
      notes: "",
      createdAt: 0,
      updatedAt: 0,
    };
    return scoreProfileMatch(pseudo, ctx) >= 0;
  });
}

export function worstGuardrailSeverity(guardrails: EconomicGuardrail[]): EconomicGuardrail["severity"] | null {
  if (!guardrails.length) return null;
  const rank = { critical: 4, elevated: 3, caution: 2, observe: 1 };
  return guardrails.reduce(
    (best, g) => (rank[g.severity] > rank[best] ? g.severity : best),
    guardrails[0]!.severity,
  );
}

export function hasGuardrailType(
  guardrails: EconomicGuardrail[],
  types: GuardrailType[],
  minSeverity: EconomicGuardrail["severity"] = "caution",
): boolean {
  const rank = { observe: 1, caution: 2, elevated: 3, critical: 4 };
  const min = rank[minSeverity];
  return guardrails.some((g) => types.includes(g.guardrailType) && rank[g.severity] >= min);
}
