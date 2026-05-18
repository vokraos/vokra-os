import type { OperatingRoleMode } from "./types";

/** Daily Operating console line keys — ordering only, no duplicate logic. */
export type DailyOperatingLineKey =
  | "warRoom"
  | "executionFeedback"
  | "controlTower"
  | "operatorMode"
  | "guidedSetup"
  | "osHealthAudit"
  | "founderBrief"
  | "economic"
  | "unitEconomics"
  | "guardrail"
  | "pricePressure"
  | "adPressure"
  | "scalingSafety"
  | "productionPressure"
  | "fboFbs"
  | "corridorStrategy"
  | "marketTiming"
  | "entitySnapshot"
  | "launchExecution"
  | "collectionExecution"
  | "heroExecution"
  | "heroCommand"
  | "assortment"
  | "assortmentChecklist"
  | "assortmentExecutive"
  | "assortmentLearning"
  | "assortmentRepeated"
  | "assortmentReview";

const FOUNDER_ORDER: DailyOperatingLineKey[] = [
  "warRoom",
  "founderBrief",
  "controlTower",
  "economic",
  "scalingSafety",
  "productionPressure",
  "adPressure",
  "unitEconomics",
  "guardrail",
  "pricePressure",
  "fboFbs",
  "corridorStrategy",
  "marketTiming",
  "launchExecution",
  "operatorMode",
  "executionFeedback",
  "guidedSetup",
  "osHealthAudit",
  "entitySnapshot",
  "collectionExecution",
  "heroExecution",
  "heroCommand",
  "assortment",
  "assortmentChecklist",
  "assortmentExecutive",
  "assortmentLearning",
  "assortmentRepeated",
  "assortmentReview",
];

const OPERATOR_ORDER: DailyOperatingLineKey[] = [
  "operatorMode",
  "executionFeedback",
  "productionPressure",
  "assortment",
  "assortmentChecklist",
  "assortmentExecutive",
  "launchExecution",
  "collectionExecution",
  "heroExecution",
  "heroCommand",
  "entitySnapshot",
  "warRoom",
  "founderBrief",
  "controlTower",
  "guidedSetup",
  "osHealthAudit",
  "economic",
  "scalingSafety",
  "fboFbs",
  "corridorStrategy",
  "marketTiming",
  "unitEconomics",
  "guardrail",
  "pricePressure",
  "adPressure",
  "assortmentLearning",
  "assortmentRepeated",
  "assortmentReview",
];

const PRODUCTION_ORDER: DailyOperatingLineKey[] = [
  "productionPressure",
  "launchExecution",
  "entitySnapshot",
  "assortment",
  "operatorMode",
  "executionFeedback",
  "warRoom",
  "controlTower",
  "founderBrief",
  "scalingSafety",
  "fboFbs",
  "economic",
  "corridorStrategy",
  "marketTiming",
  "guidedSetup",
  "osHealthAudit",
  "collectionExecution",
  "heroExecution",
  "heroCommand",
  "unitEconomics",
  "guardrail",
  "pricePressure",
  "adPressure",
  "assortmentChecklist",
  "assortmentExecutive",
  "assortmentLearning",
  "assortmentRepeated",
  "assortmentReview",
];

const STRATEGY_ORDER: DailyOperatingLineKey[] = [
  "heroCommand",
  "heroExecution",
  "launchExecution",
  "collectionExecution",
  "corridorStrategy",
  "marketTiming",
  "assortment",
  "assortmentExecutive",
  "assortmentChecklist",
  "controlTower",
  "warRoom",
  "founderBrief",
  "productionPressure",
  "scalingSafety",
  "economic",
  "operatorMode",
  "executionFeedback",
  "entitySnapshot",
  "guidedSetup",
  "osHealthAudit",
  "fboFbs",
  "unitEconomics",
  "guardrail",
  "pricePressure",
  "adPressure",
  "assortmentLearning",
  "assortmentRepeated",
  "assortmentReview",
];

const ORDER_BY_MODE: Record<OperatingRoleMode, DailyOperatingLineKey[]> = {
  founder: FOUNDER_ORDER,
  operator: OPERATOR_ORDER,
  production: PRODUCTION_ORDER,
  strategy: STRATEGY_ORDER,
};

export function sortDailyOperatingLineKeys(
  keys: DailyOperatingLineKey[],
  mode: OperatingRoleMode,
): DailyOperatingLineKey[] {
  const rank = new Map(ORDER_BY_MODE[mode].map((k, i) => [k, i]));
  return [...keys].sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
}
