export const OS_REPORT_WARMUP_EVENT = "vokra:os-report-warmup-updated" as const;
export const OS_REPORT_WARMUP_SESSION_KEY = "vokra.osReportWarmup.last.v1" as const;

export type OsReportWarmupStatus = "idle" | "warming" | "partial" | "complete" | "failed";

export type WarmupReportId =
  | "economic_pressure"
  | "price_positioning"
  | "advertising_pressure"
  | "scaling_safety"
  | "fbo_fbs_decision"
  | "production_pressure"
  | "corridor_strategy"
  | "market_timing"
  | "founder_brief"
  | "control_tower"
  | "war_room";

export type WarmupReason = "app_start" | "manual" | "memory_reopen" | "role_switch";

export const WARMUP_REPORT_ORDER: readonly WarmupReportId[] = [
  "economic_pressure",
  "price_positioning",
  "advertising_pressure",
  "scaling_safety",
  "fbo_fbs_decision",
  "production_pressure",
  "corridor_strategy",
  "market_timing",
  "founder_brief",
  "control_tower",
  "war_room",
] as const;

export type OsReportWarmupState = {
  id: string;
  createdAt: number;
  status: OsReportWarmupStatus;
  reason: WarmupReason;
  warmedReports: WarmupReportId[];
  failedReports: WarmupReportId[];
  skippedReports: WarmupReportId[];
  lastError: string | null;
  confidenceNote: string;
};

export type WarmupOptions = {
  force?: boolean;
  reason?: WarmupReason;
  locale?: "en" | "ru";
  t?: (key: string, vars?: Record<string, string>) => string;
};
