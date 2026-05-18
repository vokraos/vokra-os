import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { CognitiveDepthMode } from "./types";

const STORAGE_KEY = "vokra.cognitiveDepth.mode.v1";

function readStoredMode(): CognitiveDepthMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (
      v === "command" ||
      v === "operations" ||
      v === "analysis" ||
      v === "memory" ||
      v === "simulation"
    ) {
      return v;
    }
  } catch {
    /* private mode */
  }
  return "operations";
}

type CognitiveDepthContextValue = {
  mode: CognitiveDepthMode;
  setMode: (m: CognitiveDepthMode) => void;
};

const CognitiveDepthContext = createContext<CognitiveDepthContextValue | null>(null);

export function CognitiveDepthProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<CognitiveDepthMode>(() =>
    typeof window !== "undefined" ? readStoredMode() : "operations",
  );

  const setMode = useCallback((m: CognitiveDepthMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* */
    }
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <CognitiveDepthContext.Provider value={value}>{children}</CognitiveDepthContext.Provider>;
}

export function useCognitiveDepth(): CognitiveDepthContextValue {
  const ctx = useContext(CognitiveDepthContext);
  if (!ctx) throw new Error("useCognitiveDepth must be used within CognitiveDepthProvider");
  return ctx;
}
