import { useCallback, useEffect, useState } from "react";
import { getOperatingRoleMode, setOperatingRoleMode, subscribeOperatingRoleMode } from "./service";
import type { OperatingRoleMode } from "./types";

export function useOperatingRoleMode(): {
  mode: OperatingRoleMode;
  setMode: (mode: OperatingRoleMode) => void;
} {
  const [mode, setModeState] = useState<OperatingRoleMode>(() => getOperatingRoleMode());

  useEffect(() => subscribeOperatingRoleMode(() => setModeState(getOperatingRoleMode())), []);

  const setMode = useCallback((next: OperatingRoleMode) => {
    setOperatingRoleMode(next);
    setModeState(next);
  }, []);

  return { mode, setMode };
}
