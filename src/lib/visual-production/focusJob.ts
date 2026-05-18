const KEY = "vokra.vpFocusJobId.v1";

export function setVisualProductionFocusJobId(jobId: string): void {
  try {
    sessionStorage.setItem(KEY, jobId);
  } catch {
    /* ignore */
  }
}

export function consumeVisualProductionFocusJobId(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (!v) return null;
    sessionStorage.removeItem(KEY);
    return v;
  } catch {
    return null;
  }
}
