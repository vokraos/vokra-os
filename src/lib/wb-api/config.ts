/** Dev proxy prefix — maps to statistics-api.wildberries.ru via vite.config.ts */
export const WB_STATISTICS_PROXY_BASE = "/api/wb/statistics";

/** Read-only Statistics API routes allowed in v1. */
export const WB_READ_ONLY_ROUTES = [
  "/api/v1/supplier/orders",
  "/api/v1/supplier/sales",
  "/api/v1/supplier/stocks",
] as const;

export type WbReadOnlyRoute = (typeof WB_READ_ONLY_ROUTES)[number];

export const WB_SYNC_LOOKBACK_DAYS = 7;

export function wbStatisticsUrl(path: WbReadOnlyRoute, query?: Record<string, string>): string {
  const base = `${WB_STATISTICS_PROXY_BASE}${path}`;
  if (!query || !Object.keys(query).length) return base;
  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}

export function wbDateFromLookback(days: number = WB_SYNC_LOOKBACK_DAYS): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19);
}
