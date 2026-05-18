import { useCallback, useEffect, useState } from "react";
import { MEMORY_CHANGED_EVENT } from "./events";
import { MEMORY_STORAGE_KEY } from "./keys";
import { invalidateMemoryCache, loadSnapshot } from "./persist";
import type { MemorySnapshot } from "./types";

export function useMemorySnapshot(): MemorySnapshot {
  const [snap, setSnap] = useState<MemorySnapshot>(() => loadSnapshot());

  const refresh = useCallback(() => {
    invalidateMemoryCache();
    setSnap(loadSnapshot());
  }, []);

  useEffect(() => {
    const onMem = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === MEMORY_STORAGE_KEY) refresh();
    };
    window.addEventListener(MEMORY_CHANGED_EVENT, onMem);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MEMORY_CHANGED_EVENT, onMem);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return snap;
}
