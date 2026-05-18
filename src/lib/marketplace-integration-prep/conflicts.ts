import type { SyncConflictRule } from "./types";

export const SYNC_CONFLICT_RULES: readonly SyncConflictRule[] = [
  {
    id: "stocks-manual-vs-api",
    domain: "stocks",
    conflictKey: "iready.conflict.stocks.manualApi",
    resolutionKey: "iready.conflict.stocks.resolution",
    risk: "critical",
  },
  {
    id: "prices-os-vs-marketplace",
    domain: "prices",
    conflictKey: "iready.conflict.prices.osMarketplace",
    resolutionKey: "iready.conflict.prices.resolution",
    risk: "critical",
  },
  {
    id: "launches-discipline",
    domain: "launches",
    conflictKey: "iready.conflict.launches.discipline",
    resolutionKey: "iready.conflict.launches.resolution",
    risk: "high",
  },
  {
    id: "seo-content",
    domain: "seo",
    conflictKey: "iready.conflict.seo.content",
    resolutionKey: "iready.conflict.seo.resolution",
    risk: "high",
  },
  {
    id: "skus-identity",
    domain: "skus",
    conflictKey: "iready.conflict.skus.identity",
    resolutionKey: "iready.conflict.skus.resolution",
    risk: "medium",
  },
  {
    id: "fulfillment-fbo",
    domain: "fulfillment",
    conflictKey: "iready.conflict.fulfillment.fbo",
    resolutionKey: "iready.conflict.fulfillment.resolution",
    risk: "critical",
  },
] as const;
