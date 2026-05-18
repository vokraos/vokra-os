import { useEffect, useMemo, useState } from "react";
import { CLEAN_DAY_MODE_CHANGED_EVENT, getEffectiveCleanDayState } from "./storage";
import { SIMPLIFICATION_BACKLOG_CHANGED_EVENT } from "../simplification-backlog/storage";

export function useCleanDayMode() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(CLEAN_DAY_MODE_CHANGED_EVENT, bump);
    window.addEventListener(SIMPLIFICATION_BACKLOG_CHANGED_EVENT, bump);
    return () => {
      window.removeEventListener(CLEAN_DAY_MODE_CHANGED_EVENT, bump);
      window.removeEventListener(SIMPLIFICATION_BACKLOG_CHANGED_EVENT, bump);
    };
  }, []);

  return useMemo(() => {
    void tick;
    return getEffectiveCleanDayState();
  }, [tick]);
}
