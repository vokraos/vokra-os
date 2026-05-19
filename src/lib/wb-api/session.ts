import { lsGet, lsSet } from "../storage";
import type { WbConnectionState } from "./types";

const WB_CONNECTION_CACHE_KEY = "vokra.wb.connectionCache.v1" as const;

export function saveWbConnectionCache(state: WbConnectionState): void {
  try {
    lsSet(WB_CONNECTION_CACHE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function loadWbConnectionCache(): WbConnectionState | null {
  const raw = lsGet(WB_CONNECTION_CACHE_KEY);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as WbConnectionState;
    return o?.status ? o : null;
  } catch {
    return null;
  }
}

export function clearWbConnectionCache(): void {
  try {
    lsSet(WB_CONNECTION_CACHE_KEY, "");
  } catch {
    /* ignore */
  }
}
