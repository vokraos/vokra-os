/** Phase 9 — executive action intelligence (derived, deterministic; no backend). */

export type DecisionWeightId = "tactical" | "operational" | "structural" | "strategic" | "irreversible";

export type ExecutiveIntelSig = {
  key: string;
  vars: Record<string, string>;
  /** 0–100 implied leverage / pressure for ordering (not shown as KPI). */
  score01?: number;
};

export type FounderFocusRow = {
  rowId: "leverage" | "blindspot" | "bottleneck" | "opportunity" | "forbidden" | "window" | "consequence";
  labelKey: string;
  bodyKey: string;
  bodyVars: Record<string, string>;
  weight: DecisionWeightId;
};
