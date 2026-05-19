import { fetchWbOrders } from "./endpoints";
import { saveWbConnectionCache } from "./session";
import { loadWbConnectionCache } from "./session";
import { hasWbApiToken } from "./token";
import type { WbConnectionState, WbConnectionStatus, WbConnectionTestResult } from "./types";
import { WbApiError } from "./types";

function stateForStatus(status: WbConnectionStatus, lastError?: string): WbConnectionState {
  const messageKey =
    status === "disconnected"
      ? "wb.conn.disconnected"
      : status === "configured"
        ? "wb.conn.configured"
        : status === "connected"
          ? "wb.conn.connected"
          : "wb.conn.error";
  return {
    status,
    messageKey,
    checkedAt: Date.now(),
    lastError,
  };
}

/** Local status only — no network. Never reports connected without a verified call. */
export function getWbConnectionStatus(): WbConnectionState {
  if (!hasWbApiToken()) {
    return stateForStatus("disconnected");
  }
  const cached = loadWbConnectionCache();
  if (cached?.status === "connected") {
    return cached;
  }
  if (cached?.status === "error") {
    return cached;
  }
  return stateForStatus("configured");
}

/** Verifies token with a minimal read-only orders request. */
export async function testWbConnection(): Promise<WbConnectionTestResult> {
  if (!hasWbApiToken()) {
    return {
      ok: false,
      status: "disconnected",
      messageKey: "wb.conn.disconnected",
    };
  }

  try {
    await fetchWbOrders();
    const result = {
      ok: true,
      status: "connected" as const,
      messageKey: "wb.conn.connected",
    };
    saveWbConnectionCache({
      status: result.status,
      messageKey: result.messageKey,
      checkedAt: Date.now(),
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof WbApiError) {
      const status: WbConnectionStatus =
        err.code === "unauthorized" || err.code === "forbidden"
          ? "error"
          : err.code === "not_connected"
            ? "disconnected"
            : "error";
      const messageKey =
        err.code === "cors"
          ? "wb.conn.error.cors"
          : err.code === "unauthorized"
            ? "wb.conn.error.unauthorized"
            : "wb.conn.error";
      saveWbConnectionCache({
        status,
        messageKey,
        checkedAt: Date.now(),
        lastError: message,
      });
      return {
        ok: false,
        status,
        messageKey,
        error: message,
      };
    }
    const fail = {
      ok: false as const,
      status: "error" as const,
      messageKey: "wb.conn.error",
      error: message,
    };
    saveWbConnectionCache({
      status: fail.status,
      messageKey: fail.messageKey,
      checkedAt: Date.now(),
      lastError: message,
    });
    return fail;
  }
}
