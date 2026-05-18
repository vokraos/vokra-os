/** sessionStorage bridge: Project Memory reopen → System Smoke Test view. */
export const RUNTIME_SMOKE_RESTORE_KEY = "vokra.runtimeSmoke.restore.v1" as const;

export function queueRuntimeSmokeReportRestore(serializedReport: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(RUNTIME_SMOKE_RESTORE_KEY, serializedReport);
  } catch {
    /* quota */
  }
}

/** Returns payload once; clears key. */
export function takeRuntimeSmokeReportRestore(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const v = sessionStorage.getItem(RUNTIME_SMOKE_RESTORE_KEY);
    sessionStorage.removeItem(RUNTIME_SMOKE_RESTORE_KEY);
    return v;
  } catch {
    return null;
  }
}
