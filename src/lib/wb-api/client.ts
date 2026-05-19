import type { WbReadOnlyRoute } from "./config";
import { wbStatisticsUrl } from "./config";
import { getWbApiToken } from "./token";
import { WbApiError } from "./types";

function isAllowedRoute(path: string): path is WbReadOnlyRoute {
  return (
    path === "/api/v1/supplier/orders" ||
    path === "/api/v1/supplier/sales" ||
    path === "/api/v1/supplier/stocks"
  );
}

/**
 * Read-only GET to WB Statistics API (via dev proxy).
 * Never sends write requests — GET only by design.
 */
export async function wbGet<T>(
  path: WbReadOnlyRoute,
  query?: Record<string, string>,
): Promise<T> {
  if (!isAllowedRoute(path)) {
    throw new WbApiError("http", `Route not allowed: ${path}`);
  }

  const token = getWbApiToken();
  if (!token) {
    throw new WbApiError("not_connected", "WB API token not configured");
  }

  const url = wbStatisticsUrl(path, query);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token,
        Accept: "application/json",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/failed to fetch|networkerror|cors/i.test(msg)) {
      throw new WbApiError("cors", "WB API unreachable — check dev proxy or network", undefined);
    }
    throw new WbApiError("network", msg);
  }

  if (res.status === 401) {
    throw new WbApiError("unauthorized", "WB API token rejected (401)", 401);
  }
  if (res.status === 403) {
    throw new WbApiError("forbidden", "WB API access forbidden (403)", 403);
  }
  if (!res.ok) {
    throw new WbApiError("http", `WB API HTTP ${res.status}`, res.status);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new WbApiError("parse", "WB API response is not valid JSON");
  }
}
