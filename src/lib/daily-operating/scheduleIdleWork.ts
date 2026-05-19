/** Yields the main thread before running heavy console composition. */
export function scheduleIdleWork(fn: () => void, timeoutMs = 2000): () => void {
  if (typeof window === "undefined") {
    fn();
    return () => undefined;
  }
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(fn, { timeout: timeoutMs });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 0);
  return () => window.clearTimeout(id);
}
