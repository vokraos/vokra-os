import type { ReactNode } from "react";
import type { CognitiveDepthMode, DashboardSlot, MissionSlot, OrchSlot } from "../../lib/cognitive-depth/types";
import {
  isDashboardSlotVisible,
  isMissionSlotVisible,
  isOrchSlotVisible,
} from "../../lib/cognitive-depth/policy";
import { useCognitiveDepth } from "../../lib/cognitive-depth/CognitiveDepthProvider";

type Props =
  | { surface: "dashboard"; slot: DashboardSlot; children: ReactNode }
  | { surface: "mission"; slot: MissionSlot; children: ReactNode }
  | { surface: "orchestrator"; slot: OrchSlot; children: ReactNode };

function visible(mode: CognitiveDepthMode, props: Props): boolean {
  if (props.surface === "dashboard") return isDashboardSlotVisible(mode, props.slot);
  if (props.surface === "mission") return isMissionSlotVisible(mode, props.slot);
  return isOrchSlotVisible(mode, props.slot);
}

export function DepthGate(props: Props) {
  const { mode } = useCognitiveDepth();
  if (!visible(mode, props)) return null;
  return <>{props.children}</>;
}
