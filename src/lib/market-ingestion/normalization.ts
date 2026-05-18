import type { CardProductionPlan } from "../card-production/types";
import type { MarketplaceSignalEntity, SignalPlatform } from "./types";

/** Map a local card plan into the unified signal shape (synthetic / structural only). */
export function normalizePlanToSignal(plan: CardProductionPlan, source: SignalPlatform = "internal"): MarketplaceSignalEntity {
  const corridor = plan.targetSkuFamily.trim() || plan.cardTitle.trim() || "default";
  const skuIds = plan.skuIds.filter(Boolean);
  const cardIds = plan.cardIds.filter(Boolean);
  const c = plan.readinessChecks;
  const pressure = Math.round(
    38 +
      (c.heroVisualReady ? 0 : 18) +
      (c.sizeGridReady ? 0 : 12) +
      (c.seoReady ? 0 : 10) +
      (plan.blockers.length > 0 ? 14 : 0),
  );
  const momentum = Math.round(55 + (plan.cardStatus.startsWith("ready") ? 22 : 0) - plan.blockers.length * 5);
  const risk = Math.min(100, Math.round(pressure * 0.85 + plan.seoWarnings.length * 6));
  const leverage = Math.max(0, Math.min(100, 100 - risk + (plan.primaryKeywords.length > 3 ? 8 : 0)));
  const operationalImpact = Math.round((pressure + risk) / 2);

  return {
    source,
    signalType: "topology.card_plan",
    corridor,
    skuIds,
    cardIds: cardIds.length ? cardIds : [plan.id],
    pressure: Math.min(100, pressure),
    momentum: Math.min(100, Math.max(0, momentum)),
    risk: Math.min(100, risk),
    leverage: Math.min(100, leverage),
    operationalImpact: Math.min(100, operationalImpact),
    timestamp: plan.updatedAt,
  };
}
