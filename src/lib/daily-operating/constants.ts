import type { NavId } from "../../types";

/** Daily executive rhythm — order matters for the flow rail. */
export const DAILY_FLOW_STEPS: readonly { id: NavId; labelKey: string }[] = [
  { id: "dashboard", labelKey: "daily.flow.brief" },
  { id: "missionControl", labelKey: "nav.missionControl" },
  { id: "executionOrchestrator", labelKey: "nav.executionOrchestrator" },
  { id: "command", labelKey: "nav.command" },
  { id: "signalFabric", labelKey: "nav.signalFabric" },
  { id: "feedbackLoop", labelKey: "nav.feedbackLoop" },
] as const;

/** Sidebar + chrome stay bright in Focus Mode; everything else dims. */
export const FOCUS_BRIGHT_NAV_IDS: ReadonlySet<NavId> = new Set<NavId>([
  "home",
  "dashboard",
  "missionControl",
  "executionOrchestrator",
  "command",
  "signalFabric",
  "feedbackLoop",
  "executiveIntelligence",
  "organismModel",
]);
