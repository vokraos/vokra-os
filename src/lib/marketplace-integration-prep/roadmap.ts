import type { ReadinessCheck, RoadmapPhase, SyncReadinessLevel } from "./types";

/** Suggested API integration order — architecture only. */
const ROADMAP_ORDER: { domain: RoadmapPhase["domain"]; titleKey: string; whyKey: string }[] = [
  { domain: "products", titleKey: "iready.roadmap.products", whyKey: "iready.roadmap.why.products" },
  { domain: "skus", titleKey: "iready.roadmap.skus", whyKey: "iready.roadmap.why.skus" },
  { domain: "stocks", titleKey: "iready.roadmap.stocks", whyKey: "iready.roadmap.why.stocks" },
  { domain: "launches", titleKey: "iready.roadmap.launches", whyKey: "iready.roadmap.why.launches" },
  { domain: "reviews", titleKey: "iready.roadmap.reviews", whyKey: "iready.roadmap.why.reviews" },
  { domain: "ads", titleKey: "iready.roadmap.ads", whyKey: "iready.roadmap.why.ads" },
  { domain: "supply", titleKey: "iready.roadmap.supply", whyKey: "iready.roadmap.why.supply" },
  { domain: "fulfillment", titleKey: "iready.roadmap.fulfillment", whyKey: "iready.roadmap.why.fulfillment" },
];

function domainBlocked(domain: RoadmapPhase["domain"], checks: ReadinessCheck[], level: SyncReadinessLevel): boolean {
  if (level === "not_ready") return true;
  if (domain === "stocks" || domain === "fulfillment") {
    return !checks.find((c) => c.id === "fbo_fbs_stable")?.passed || !checks.find((c) => c.id === "production_capacity")?.passed;
  }
  if (domain === "launches") return !checks.find((c) => c.id === "launch_workflows")?.passed;
  if (domain === "products" || domain === "skus") return !checks.find((c) => c.id === "snapshot_discipline")?.passed;
  if (domain === "ads") return !checks.find((c) => c.id === "economics_assigned")?.passed;
  return level === "risky";
}

export function buildIntegrationRoadmap(
  checks: ReadinessCheck[],
  level: SyncReadinessLevel,
): RoadmapPhase[] {
  return ROADMAP_ORDER.map((row, i) => ({
    order: i + 1,
    domain: row.domain,
    titleKey: row.titleKey,
    whyKey: row.whyKey,
    blocked: domainBlocked(row.domain, checks, level),
  }));
}
