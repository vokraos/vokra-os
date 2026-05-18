import type { CardProductionPlan } from "./types";

function allChecksTrue(c: CardProductionPlan["readinessChecks"]): boolean {
  return (
    c.heroVisualReady &&
    c.supportVisualsReady &&
    c.detailShotsReady &&
    c.seoReady &&
    c.sizeGridReady &&
    c.marketplaceClarityReady &&
    c.brandFitReady
  );
}

export function isBlockedPlan(p: CardProductionPlan): boolean {
  return p.cardStatus === "blocked" || p.blockers.includes("brand_fit_gap") || p.blockers.includes("marketplace_clarity_gap");
}

export function inSectionBlocked(p: CardProductionPlan): boolean {
  return isBlockedPlan(p);
}

export function inSectionMissingHero(p: CardProductionPlan): boolean {
  return !isBlockedPlan(p) && !p.readinessChecks.heroVisualReady;
}

export function inSectionMissingDetail(p: CardProductionPlan): boolean {
  return !isBlockedPlan(p) && p.readinessChecks.heroVisualReady && !p.readinessChecks.detailShotsReady;
}

export function inSectionMissingSeo(p: CardProductionPlan): boolean {
  return !isBlockedPlan(p) && p.readinessChecks.heroVisualReady && p.readinessChecks.detailShotsReady && !p.readinessChecks.seoReady;
}

export function inSectionMissingGrid(p: CardProductionPlan): boolean {
  return (
    !isBlockedPlan(p) &&
    p.readinessChecks.heroVisualReady &&
    p.readinessChecks.detailShotsReady &&
    p.readinessChecks.seoReady &&
    !p.readinessChecks.sizeGridReady
  );
}

export function inSectionAssemblyReady(p: CardProductionPlan): boolean {
  return !isBlockedPlan(p) && allChecksTrue(p.readinessChecks);
}

export function inSectionReadyWb(p: CardProductionPlan): boolean {
  return inSectionAssemblyReady(p) && (p.marketplace === "wb" || p.marketplace === "both");
}

export function inSectionReadyOzon(p: CardProductionPlan): boolean {
  return inSectionAssemblyReady(p) && (p.marketplace === "ozon" || p.marketplace === "both");
}
