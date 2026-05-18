import type { NavId } from "../../types";

export type GuardrailType =
  | "hold_expansion"
  | "avoid_fbo_scaling"
  | "reduce_ads"
  | "require_price_review"
  | "require_cost_review"
  | "limit_launch_wave"
  | "allow_only_refresh"
  | "safe_to_scale";

export type GuardrailSeverity = "observe" | "caution" | "elevated" | "critical";

export type AffectedSystemId =
  | "launch_operations"
  | "assortment_actions"
  | "collection_builder"
  | "founder_brief"
  | "daily_operating"
  | "economic_pressure"
  | "unit_economics";

export type EconomicGuardrail = {
  id: string;
  sourceProfileId: string;
  corridor: string;
  productFamily: string;
  marketplace: string;
  stockMode: string;
  guardrailType: GuardrailType;
  severity: GuardrailSeverity;
  titleKey: string;
  titleVars: Record<string, string>;
  reasonKey: string;
  reasonVars: Record<string, string>;
  recommendedActionKey: string;
  recommendedActionVars: Record<string, string>;
  affectedSystems: AffectedSystemId[];
  confidenceNoteKey: string;
  createdAt: number;
};

export type ResolvedEconomicGuardrail = EconomicGuardrail & {
  title: string;
  reason: string;
  recommendedAction: string;
  confidenceNote: string;
};

export type GuardrailBuildContext = {
  expansionPressureElevated?: boolean;
};

export const GUARDRAIL_NAV: Partial<Record<AffectedSystemId, NavId>> = {
  launch_operations: "launchOperations",
  assortment_actions: "assortmentActions",
  collection_builder: "collectionBuilder",
  founder_brief: "founderBrief",
  daily_operating: "home",
  economic_pressure: "economicPressure",
  unit_economics: "unitEconomics",
};
