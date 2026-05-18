export const SAFE_MODE_STORAGE_KEY = "vokra.os.safeModeState.v1" as const;

/** Features turned off while safe mode is active (tunable per incident). */
export type SafeModeDisabledFeature =
  | "report_warmup"
  | "command_composition"
  | "operator_work_order"
  | "production_composition"
  | "memory_reopen_autorun";

export const ALL_SAFE_MODE_DISABLED_FEATURES: readonly SafeModeDisabledFeature[] = [
  "report_warmup",
  "command_composition",
  "operator_work_order",
  "production_composition",
  "memory_reopen_autorun",
] as const;

export type SafeModeReason =
  | "user_manual"
  | "uncaught_render"
  | "uncaught_error_boundary"
  | "cache_corruption";

export type SafeModeState = {
  enabled: boolean;
  reason: SafeModeReason;
  lastErrorMessage: string | null;
  lastErrorStack: string | null;
  lastComponentStack: string | null;
  disabledFeatures: SafeModeDisabledFeature[];
  createdAt: number;
};

export const SAFE_MODE_EVENT = "vokra:safe-mode-updated" as const;
