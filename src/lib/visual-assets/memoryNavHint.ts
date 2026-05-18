import type { NavId } from "../../types";

const KEY = "vokra.memoryPrefilter.v1";

export function requestMemoryFilter(module: string, onNavigate: (id: NavId) => void): void {
  try {
    sessionStorage.setItem(KEY, module);
  } catch {
    /* ignore */
  }
  onNavigate("memory");
}

export function consumeMemoryPrefilter(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (!v) return null;
    sessionStorage.removeItem(KEY);
    return v;
  } catch {
    return null;
  }
}
