/** Autonomous initiative layer — priorities and kinds for executive stream */

export type InitiativePriority = "critical" | "high_leverage" | "strategic" | "low_priority" | "observe";

export type InitiativeKind =
  | "opportunity"
  | "risk"
  | "production"
  | "brand_integrity"
  | "seo"
  | "intervention"
  | "resource";

export type InitiativeUrgency = "calm" | "elevated" | "critical";

export type StrategicInitiative = {
  id: string;
  kind: InitiativeKind;
  priority: InitiativePriority;
  headlineRu: string;
  headlineEn: string;
  bodyRu: string;
  bodyEn: string;
  /** Higher sorts first within same priority band */
  leverage: number;
};

export type InitiativeMemory = {
  /** initiative id → hide until this pulse generation (exclusive of boundary: show when pulseGen >= until) */
  suppressedUntil: Record<string, number>;
  /** pattern key → times reinforced (autonomous learning signal) */
  patternStrength: Record<string, number>;
};

export const PRIORITY_RANK: Record<InitiativePriority, number> = {
  critical: 5,
  high_leverage: 4,
  strategic: 3,
  low_priority: 2,
  observe: 1,
};
