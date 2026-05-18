import { isSafeModeFeatureDisabled } from "../safe-mode";
import { scheduleOsReportWarmup } from "./warmup";

/** Schedule dependency-safe report warmup after restoring OS modules from Project Memory. */
export function scheduleWarmupAfterMemoryReopen(): void {
  if (isSafeModeFeatureDisabled("memory_reopen_autorun")) return;
  scheduleOsReportWarmup({ reason: "memory_reopen" });
}
