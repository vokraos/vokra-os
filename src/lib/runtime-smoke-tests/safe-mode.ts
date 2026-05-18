import {
  enterSafeModeManual,
  exitSafeMode,
  getSafeModeState,
  isSafeModeEnabled,
  notifySafeModeChanged,
  saveSafeModeState,
} from "../safe-mode";

/** Enter/exit safe mode without leaving the OS in a different state. */
export function runSafeModeRoundTripCheck(): void {
  const backup = getSafeModeState();
  try {
    enterSafeModeManual();
    if (!isSafeModeEnabled()) throw new Error("safe mode did not enable");
    exitSafeMode(true);
    if (isSafeModeEnabled()) throw new Error("safe mode did not disable");
  } finally {
    saveSafeModeState(backup);
    notifySafeModeChanged();
  }
}
