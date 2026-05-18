import { buildPrimaryAdvertisingPressureReport } from "../ad-pressure";
import { buildCorridorStrategyReports } from "../corridor-strategy";
import { deriveSnapshotIntelligence, getActiveEntitySnapshot } from "../entity-snapshot";
import { peekHeroFatigueMapSession } from "../hero-command/peekSessions";
import { getLaunchExecutionActions } from "../launch-ops/assortmentStorage";
import { peekLaunchOpsSession } from "../launch-ops/session";
import { LAUNCH_REVIEWS_STORAGE_KEY, type MarketplaceLaunchReview } from "../launch-ops/review/types";
import { loadCardProductionBoardFromSession } from "../card-production/sessionStorage";
import { deriveMarketplaceOperationalSnapshot } from "../marketplace-operations";
import { loadVisualAssetRegistryFromSession } from "../visual-assets";
import { lsGet } from "../storage";
import { buildScalingSafetyReport } from "../scaling-safety";
import { buildAllMarketTimingReports, pickPrimaryMarketTimingReport } from "./recommendations";
import type { MarketTimingGlobalContext, MarketTimingReport } from "./types";

export const MARKET_TIMING_EVENT = "vokra:market-timing-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function listLaunchReviews(): MarketplaceLaunchReview[] {
  try {
    const raw = lsGet(LAUNCH_REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const o = JSON.parse(raw) as { byPlanId?: Record<string, MarketplaceLaunchReview> };
    return Object.values(o.byPlanId ?? {}).sort((a, b) => b.reviewedAt - a.reviewedAt);
  } catch {
    return [];
  }
}

export function gatherMarketTimingContext(t: TFn): MarketTimingGlobalContext {
  const snapshot = getActiveEntitySnapshot();
  const intel = snapshot ? deriveSnapshotIntelligence(snapshot) : null;
  const launchSession = peekLaunchOpsSession();
  const launchPlan = launchSession?.plan ?? null;
  const fatigueSession = peekHeroFatigueMapSession();

  const envelope = loadCardProductionBoardFromSession();
  const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
  const mops = envelope ? deriveMarketplaceOperationalSnapshot(envelope, assets) : null;

  const launchExecutionActions = snapshot ? getLaunchExecutionActions(snapshot.id) : [];
  const activeAssortmentCount = launchExecutionActions.filter(
    (a) => a.status !== "done" && a.status !== "deferred",
  ).length;

  return {
    snapshot,
    intel,
    marketplace: launchPlan?.marketplace ?? "WB/Ozon",
    scalingReport: buildScalingSafetyReport(t),
    adReport: buildPrimaryAdvertisingPressureReport(),
    heroFatigue: fatigueSession?.report ?? null,
    launchPlan,
    launchReviews: listLaunchReviews(),
    launchExecutionActions,
    waves: mops?.waves ?? [],
    corridorReports: buildCorridorStrategyReports(t),
    activeAssortmentCount,
  };
}

export function buildMarketTimingReports(t: TFn): MarketTimingReport[] {
  return buildAllMarketTimingReports(gatherMarketTimingContext(t));
}

export function buildPrimaryMarketTimingReport(t: TFn): MarketTimingReport | null {
  return pickPrimaryMarketTimingReport(buildMarketTimingReports(t));
}

export function notifyMarketTimingUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MARKET_TIMING_EVENT));
}
