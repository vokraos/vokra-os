import { demoCorridor } from "../cognitive-depth/sku-demo";
import { mix } from "../cognitive-depth/sku-empire";
import type { MarketplaceEntitySnapshot } from "./types";
import { formatPct01 } from "./snapshot";

export type FieldMicro = { key: string; vars: Record<string, string> };

export function recommendationFieldMicros(snapshot: MarketplaceEntitySnapshot, seed: number, take = 2): FieldMicro[] {
  const fields = [...snapshot.recommendationFields.values()];
  const start = mix(seed, 7700) % Math.max(1, fields.length);
  const out: FieldMicro[] = [];
  for (let j = 0; j < take; j++) {
    const f = fields[(start + j) % fields.length];
    if (!f) break;
    out.push({
      key: `depth.entity7.recoField.${f.kind}`,
      vars: {
        corridor: demoCorridor(seed + j * 2 + (mix(seed, j) % 5)),
        rival: demoCorridor(seed + j * 2 + 5 + (mix(seed, j + 1) % 4)),
        instability: formatPct01(f.instability01),
      },
    });
  }
  return out;
}
