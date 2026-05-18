/**
 * Phase 6 — marketplace entity consciousness: SKU, cards, clusters, waves,
 * corridors, regions, production lanes as first-class narrative anchors.
 */

import {
  demoCardTitle,
  demoClusterLabelRu,
  demoCorridor,
  demoLaunchWaveLabel,
  demoProductionLane,
  demoRegionLabel,
  demoSemanticTerritory,
  demoSkuId,
} from "./sku-demo";
import { mix, rRange, type MicroSig } from "./sku-empire";

const WAR_ROOM_IDS = ["corridor", "launch", "fulfill", "prod", "semantic", "hero", "reco"] as const;

export type WarRoomId = (typeof WAR_ROOM_IDS)[number];

export function entityMicroVars(seed: number, salt = 0): Record<string, string> {
  const s = seed + salt * 17;
  return {
    sku: demoSkuId(s),
    sku2: demoSkuId(s + 401),
    card: demoCardTitle(s),
    cluster: demoClusterLabelRu(s + 2),
    corridor: demoCorridor(s),
    rival: demoCorridor(s + 8),
    wave: demoLaunchWaveLabel(s + 3),
    region: demoRegionLabel(s + 4),
    lane: demoProductionLane(s + 5),
    semantic: demoSemanticTerritory(s + 6),
    fronts: String(8 + (mix(seed, salt) % 11)),
    queue: String(rRange(seed, 9100 + salt, 14, 52)),
    pct: String(rRange(seed, 9200 + salt, 22, 71)),
  };
}

/** Spatial war-room sections for analysis depth — titles + one entity line each. */
export function strategicWarRoomLines(seed: number): { id: WarRoomId; titleKey: string; sig: MicroSig }[] {
  return WAR_ROOM_IDS.map((id, i) => ({
    id,
    titleKey: `depth.room.${id}.title`,
    sig: {
      key: `depth.room.${id}.line`,
      vars: entityMicroVars(seed + i * 37, i),
    },
  }));
}

const CHAIN_KEYS = [
  "depth.entity.chain.heroToCluster",
  "depth.entity.chain.clusterToReco",
  "depth.entity.chain.recoToLaunch",
  "depth.entity.chain.launchToProd",
  "depth.entity.chain.prodToFulfill",
] as const;

export function ecosystemHierarchyLines(seed: number, take = 2): MicroSig[] {
  const start = mix(seed, 9400) % CHAIN_KEYS.length;
  return Array.from({ length: take }, (_, j) => ({
    key: CHAIN_KEYS[(start + j) % CHAIN_KEYS.length]!,
    vars: entityMicroVars(seed + j * 19, j),
  }));
}

/** Classified historic event label (i18n key suffix under depth.mem.classLabel.*). */
export function strategicMemoryClassKey(microKey: string): string {
  if (microKey.includes("depth.vault.")) return "classified_vault";
  if (microKey.includes("mem.scar.corridorCollapse")) return "corridor_collapse";
  if (microKey.includes("mem.scar.heroRecovered")) return "hero_recovery";
  if (microKey.includes("mem.scar.ampFailed")) return "failed_expansion";
  if (microKey.includes("mem.scar.satEcho")) return "saturation_cascade";
  if (microKey.includes("mem.scar.oldWaves")) return "timing_scar";
  if (microKey.includes("mem.scar.semanticDrift")) return "semantic_fragmentation";
  if (microKey.includes("mem.marker.")) return "campaign_marker";
  if (microKey.includes("mem.scar.")) return "operational_scar";
  if (microKey.includes("mem.depth.satCollapse")) return "saturation_cascade";
  if (microKey.includes("mem.depth.failedExpansion")) return "failed_expansion";
  if (microKey.includes("mem.depth.recoveredCorridor")) return "hero_recovery";
  if (microKey.includes("mem.depth.oldHero")) return "hero_decommission";
  if (microKey.includes("mem.depth.semanticFracture")) return "semantic_fragmentation";
  if (microKey.includes("mem.depth.promoScar")) return "promo_scar";
  if (microKey.includes("mem.echo.")) return "launch_echo";
  if (microKey.includes("mem.war")) return "reco_battle";
  if (microKey.includes("mem.line.failure")) return "fulfillment_failure";
  if (microKey.includes("mem.line.win")) return "successful_amplification";
  if (microKey.includes("mem.line.timing")) return "timing_scar";
  if (microKey.includes("mem.line.corridor")) return "corridor_pattern";
  if (microKey.includes("mem.line.scar")) return "contour_leak";
  if (microKey.includes("mem.line.echo")) return "pulse_echo";
  return "classified_event";
}
