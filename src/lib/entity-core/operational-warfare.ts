import { demoCorridor, demoSkuId } from "../cognitive-depth/sku-demo";
import { selectTopOverloadCorridor } from "./selectors";
import { buildMarketplaceEntitySnapshot, formatPct01, liveExecutiveScale } from "./snapshot";

export type OpMicro = { key: string; vars: Record<string, string> };

export function operationalWarfareLines(seed: number, tension01: number, pressure01: number): OpMicro[] {
  const snap = buildMarketplaceEntitySnapshot(seed, tension01, pressure01);
  const top = selectTopOverloadCorridor(snap);
  const scale = liveExecutiveScale(seed);
  const corridor = top ? demoCorridor(seed + 11) : demoCorridor(seed);
  return [
    {
      key: "depth.ops7.launchPack",
      vars: {
        fronts: String(scale.launchFronts),
        dtf: formatPct01(snap.production.dtfThroughput01),
        pack: formatPct01(snap.production.packagingFatigue01),
      },
    },
    {
      key: "depth.ops7.dtfZone",
      vars: {
        dtf: formatPct01(snap.production.dtfThroughput01),
        queue: formatPct01(snap.production.queueInstability01),
      },
    },
    {
      key: "depth.ops7.fulfillNarrow",
      vars: {
        region: snap.fulfillment.regionLabel,
        timing: formatPct01(snap.fulfillment.timingStrain01),
        ship: formatPct01(snap.fulfillment.shippingPressure01),
      },
    },
    {
      key: "depth.ops7.corridorOverload",
      vars: {
        corridor,
        pressure: top ? formatPct01(top.pressure01) : "—",
      },
    },
    {
      key: "depth.ops7.overnight",
      vars: {
        risk: formatPct01(snap.production.overnightRisk01),
        sku: demoSkuId(seed + 44),
      },
    },
  ];
}
