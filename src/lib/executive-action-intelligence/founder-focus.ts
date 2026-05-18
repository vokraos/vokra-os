import { clipDepthText } from "../cognitive-depth/compression";
import type { ExecutiveDecisionBoard } from "../executive-decision-compression/types";
import type { FounderFocusRow } from "./types";
import {
  compressedConsequenceLine,
  decisionMemoryLine,
  decisionWeightForRow,
  prioritizationSpine,
  strategicTensionCalm,
  topBlindspotSignal,
  topLeverageSignal,
  topOpportunitySignal,
} from "./signals";

export type FounderFocusBundle = {
  rows: FounderFocusRow[];
  spine: ReturnType<typeof prioritizationSpine>;
  memory: ReturnType<typeof decisionMemoryLine>;
  calmTension: ReturnType<typeof strategicTensionCalm>;
};

function rawPipe(line: string, max: number): { bodyKey: string; bodyVars: Record<string, string> } {
  return { bodyKey: "depth.eai9.rawLine", bodyVars: { line: clipDepthText(line, max) } };
}

export function buildFounderFocusBundle(
  seed: number,
  tension01: number,
  pressure01: number,
  edc: ExecutiveDecisionBoard,
  timeWindowLine: string,
): FounderFocusBundle {
  const lev = topLeverageSignal(seed, tension01);
  const blind = topBlindspotSignal(seed, pressure01);
  const opp = topOpportunitySignal(seed, tension01);
  const cons = compressedConsequenceLine(seed, tension01);
  const spine = prioritizationSpine(seed, tension01);
  const memory = decisionMemoryLine(seed);
  const calmTension = strategicTensionCalm(seed, tension01, pressure01);

  const rows: FounderFocusRow[] = [
    {
      rowId: "leverage",
      labelKey: "depth.eai9.row.leverage",
      bodyKey: lev.key,
      bodyVars: lev.vars,
      weight: decisionWeightForRow(seed, 1),
    },
    {
      rowId: "blindspot",
      labelKey: "depth.eai9.row.blindspot",
      bodyKey: blind.key,
      bodyVars: blind.vars,
      weight: decisionWeightForRow(seed, 2),
    },
    {
      rowId: "bottleneck",
      labelKey: "depth.eai9.row.bottleneck",
      ...rawPipe(edc.bottleneck, 120),
      weight: decisionWeightForRow(seed, 3),
    },
    {
      rowId: "opportunity",
      labelKey: "depth.eai9.row.opportunity",
      bodyKey: opp.key,
      bodyVars: opp.vars,
      weight: decisionWeightForRow(seed, 4),
    },
    {
      rowId: "forbidden",
      labelKey: "depth.eai9.row.forbidden",
      ...rawPipe(edc.forbidden[0] ?? "—", 140),
      weight: decisionWeightForRow(seed, 5),
    },
    {
      rowId: "window",
      labelKey: "depth.eai9.row.window",
      ...rawPipe(timeWindowLine, 100),
      weight: decisionWeightForRow(seed, 6),
    },
    {
      rowId: "consequence",
      labelKey: "depth.eai9.row.consequence",
      bodyKey: cons.key,
      bodyVars: cons.vars,
      weight: decisionWeightForRow(seed, 7),
    },
  ];

  return { rows, spine, memory, calmTension };
}
