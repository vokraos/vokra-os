export type SmokeCheckStatus = "passed" | "warning" | "failed" | "skipped";

export type SmokeCheckResult = {
  id: string;
  labelKey: string;
  status: SmokeCheckStatus;
  /** Optional technical detail (message, not i18n). */
  detail?: string;
  durationMs: number;
};

export type RuntimeSmokeTestOverallStatus = "passed" | "warning" | "failed";

export type RuntimeSmokeTestReport = {
  id: string;
  createdAt: number;
  status: RuntimeSmokeTestOverallStatus;
  passedChecks: SmokeCheckResult[];
  failedChecks: SmokeCheckResult[];
  warnings: SmokeCheckResult[];
  skippedChecks: SmokeCheckResult[];
  /** Full ordered log. */
  checks: SmokeCheckResult[];
  durationMs: number;
  /** i18n key for summary line. */
  confidenceNoteKey: string;
};

export type SmokeRunOptions = {
  locale?: "ru" | "en";
  /** When true, warmup runs with force (may still skip in safe mode). */
  forceWarmup?: boolean;
};
