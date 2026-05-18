import { createContext, useContext } from "react";
import type { SignalFabricSnapshot } from "./types";

export const SignalFabricContext = createContext<SignalFabricSnapshot | null>(null);

export function useSignalFabric(): SignalFabricSnapshot {
  const v = useContext(SignalFabricContext);
  if (!v) throw new Error("useSignalFabric must be used within SignalFabricProvider");
  return v;
}

export function useSignalFabricOptional(): SignalFabricSnapshot | null {
  return useContext(SignalFabricContext);
}
