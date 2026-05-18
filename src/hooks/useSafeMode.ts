import { useSyncExternalStore } from "react";
import { getSafeModeState, subscribeSafeMode, type SafeModeState } from "../lib/safe-mode";

export function useSafeMode(): SafeModeState {
  return useSyncExternalStore(subscribeSafeMode, getSafeModeState, getSafeModeState);
}
