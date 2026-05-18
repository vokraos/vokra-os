import type { CardProductionBoardEnvelope } from "../card-production/types";
import { loadCardProductionBoardFromSession } from "../card-production";
import { refreshPlanDerivedFields } from "../card-production/planFromAsset";
import { loadVisualAssetRegistryFromSession } from "../visual-assets";
import { deriveMarketplaceOperationalSnapshot } from "../marketplace-operations";
import { INGESTION_ADAPTERS } from "./adapters";
import { INGESTION_CHANNELS } from "./channels";
import { FUSION_RULES } from "./fusion";
import { normalizePlanToSignal } from "./normalization";
import type { BlockedIntegration, IngestionReadinessSnapshot } from "./types";
import { ENTITY_MAPPINGS, MARKET_INGESTION_MEMORY_SCHEMA } from "./types";

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function channelBaseReadiness(
  platform: string,
  hasPlans: boolean,
  assetCount: number,
  planCount: number,
): number {
  if (platform === "wb" || platform === "ozon") {
    return clampPct(14 + (hasPlans ? 10 : 0) + (planCount > 3 ? 4 : 0));
  }
  if (platform === "production") {
    return clampPct(36 + Math.min(24, assetCount / 4) + (hasPlans ? 12 : 0));
  }
  if (platform === "content") {
    return clampPct(48 + Math.min(30, planCount * 3) + Math.min(12, assetCount / 5));
  }
  return 50;
}

const DEFAULT_BLOCKED: readonly BlockedIntegration[] = [
  { id: "wb.live_api", reasonKey: "ingest.blocked.wb_api" },
  { id: "ozon.live_api", reasonKey: "ingest.blocked.ozon_api" },
];

export function deriveIngestionReadinessSnapshot(envelope: CardProductionBoardEnvelope | null): IngestionReadinessSnapshot {
  const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
  const plans = (envelope?.plans ?? []).map((p) => refreshPlanDerivedFields(p, assets));
  const hasPlans = plans.length > 0;
  const assetCount = assets.length;
  const mops = deriveMarketplaceOperationalSnapshot(envelope, assets);

  const channelReadiness: Record<string, number> = {};
  for (const ch of INGESTION_CHANNELS) {
    channelReadiness[ch.id] = channelBaseReadiness(ch.platform, hasPlans, assetCount, plans.length);
  }

  const schemaHooks = INGESTION_ADAPTERS.filter((a) => a.status === "schema_ready").length;
  const fusionReadiness = clampPct(58 + FUSION_RULES.length * 4 + schemaHooks * 5 + (hasPlans ? 10 : 0));
  const signalReadiness = clampPct(
    Object.values(channelReadiness).reduce((s, v) => s + v, 0) / Math.max(1, Object.keys(channelReadiness).length),
  );
  const operationalReadiness = clampPct(52 + (100 - Math.min(100, mops.waves[0]?.operationalPressure ?? 40)) * 0.35 + (hasPlans ? 14 : 0));

  const sampleSignals = plans.slice(0, 6).map((p) => normalizePlanToSignal(p, "internal"));

  return {
    schema: MARKET_INGESTION_MEMORY_SCHEMA,
    derivedAt: Date.now(),
    channelReadiness,
    fusionReadiness,
    signalReadiness,
    operationalReadiness,
    blockedIntegrations: [...DEFAULT_BLOCKED],
    sampleSignals,
    fusionRules: [...FUSION_RULES],
    mappings: [...ENTITY_MAPPINGS],
  };
}

export function buildIngestionReadinessFromSession(): IngestionReadinessSnapshot {
  return deriveIngestionReadinessSnapshot(loadCardProductionBoardFromSession());
}
