import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NavId } from "../../types";
import { lsGet, lsSet } from "../storage";
import { STORAGE_KEYS } from "../storage-keys";

const FOCUS_KEY = STORAGE_KEYS.focusMode;
const RECENT_KEY = STORAGE_KEYS.recentNav;

function parseRecent(raw: string | null): NavId[] {
  if (!raw) return [];
  try {
    const o = JSON.parse(raw) as unknown;
    if (!Array.isArray(o)) return [];
    return o.filter((x): x is NavId => typeof x === "string");
  } catch {
    return [];
  }
}

type DailyOperatingContextValue = {
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
  toggleFocusMode: () => void;
  recentNav: readonly NavId[];
  /** Call before switching route; records the screen you are leaving. */
  pushRecent: (from: NavId) => void;
};

const DailyOperatingContext = createContext<DailyOperatingContextValue | null>(null);

export function DailyOperatingProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusModeState] = useState(() => lsGet(FOCUS_KEY) === "1");
  const [recentNav, setRecentNav] = useState<NavId[]>(() => parseRecent(lsGet(RECENT_KEY)));

  useEffect(() => {
    lsSet(FOCUS_KEY, focusMode ? "1" : "0");
  }, [focusMode]);

  useEffect(() => {
    lsSet(RECENT_KEY, JSON.stringify(recentNav.slice(0, 6)));
  }, [recentNav]);

  const setFocusMode = useCallback((v: boolean) => setFocusModeState(v), []);
  const toggleFocusMode = useCallback(() => setFocusModeState((x) => !x), []);

  const pushRecent = useCallback((from: NavId) => {
    if (from === "home") return;
    setRecentNav((prev) => {
      const next = [from, ...prev.filter((id) => id !== from)];
      return next.slice(0, 6);
    });
  }, []);

  const value = useMemo(
    () => ({
      focusMode,
      setFocusMode,
      toggleFocusMode,
      recentNav,
      pushRecent,
    }),
    [focusMode, recentNav, pushRecent, setFocusMode, toggleFocusMode],
  );

  return <DailyOperatingContext.Provider value={value}>{children}</DailyOperatingContext.Provider>;
}

export function useDailyOperating(): DailyOperatingContextValue {
  const v = useContext(DailyOperatingContext);
  if (!v) throw new Error("useDailyOperating must be used within DailyOperatingProvider");
  return v;
}
