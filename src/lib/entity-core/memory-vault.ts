import { demoCorridor, demoSkuId } from "../cognitive-depth/sku-demo";
import { mix } from "../cognitive-depth/sku-empire";

export type VaultMicro = { key: string; vars: Record<string, string> };

const VAULT_KEYS = [
  "depth.vault.launchScar",
  "depth.vault.corridorCollapse",
  "depth.vault.heroFailure",
  "depth.vault.saturationEvent",
  "depth.vault.recoveryOp",
  "depth.vault.ampMistake",
  "depth.vault.semanticFracture",
  "depth.vault.gravityAmpFail",
  "depth.vault.gravitySatCollapse",
  "depth.vault.gravityLaunchFracture",
  "depth.vault.gravityFulfillmentFail",
  "depth.vault.gravityCorridorRecover",
  "depth.vault.gravitySemanticDrift",
] as const;

export function memoryVaultClassifiedLines(seed: number, take = 2): VaultMicro[] {
  const start = mix(seed, 8800) % VAULT_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: VAULT_KEYS[(start + j) % VAULT_KEYS.length]!,
    vars: {
      corridor: demoCorridor(seed + j * 7),
      sku: demoSkuId(seed + j * 19),
      wave: String(1 + (mix(seed, j) % 5)),
    },
  }));
}
