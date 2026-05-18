import { demoCorridor } from "../cognitive-depth/sku-demo";
import { mix, rRange } from "../cognitive-depth/sku-empire";

export type ConsequenceProjection = { ifKey: string; thenKey: string; vars: Record<string, string> };

const PAIRS: [string, string][] = [
  ["depth.sim7.if.heroRefreshDelay", "depth.sim7.then.recoDecay"],
  ["depth.sim7.if.fboAccelerate", "depth.sim7.then.prodDestab"],
  ["depth.sim7.if.promoDensity", "depth.sim7.then.marginCompress"],
  ["depth.sim7.if.packDrag", "depth.sim7.then.launchCadence"],
  ["depth.sim7.if.semanticDrift", "depth.sim7.then.overlapRise"],
  ["depth.sim8.if.launchDensity", "depth.sim8.then.recoOverlap"],
  ["depth.sim8.if.packagingThroughput", "depth.sim8.then.fulfillmentSpread"],
  ["depth.sim8.if.heroRefreshDelay", "depth.sim8.then.corridorFatigue"],
];

export function entityCoreSimulationProjections(seed: number): ConsequenceProjection[] {
  const start = mix(seed, 8900) % PAIRS.length;
  return [0, 1, 2, 3].map((j) => {
    const [ifKey, thenKey] = PAIRS[(start + j) % PAIRS.length]!;
    return {
      ifKey,
      thenKey,
      vars: {
        corridor: demoCorridor(seed + j * 5),
        days: String(rRange(seed, 8901 + j, 11, 22)),
        pct: String(rRange(seed, 8902 + j, 18, 44)),
      },
    };
  });
}
