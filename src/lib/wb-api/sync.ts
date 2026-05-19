import { activateEntitySnapshotFromImport } from "../entity-snapshot/activate";
import { saveActiveEntitySnapshot } from "../entity-snapshot/storage";
import { testWbConnection } from "./connection";
import { fetchWbOperationalData } from "./endpoints";
import { normalizeWbOperationalData } from "./normalize";
import { hasWbApiToken } from "./token";
import { saveWbConnectionCache } from "./session";
import { WbApiError } from "./types";

export type WbSyncResult =
  | { ok: true; snapshotId: string; rowCount: number; skuCount: number }
  | { ok: false; reason: "not_connected" | "empty" | "api_error"; message: string };

/**
 * Read-only sync: WB Statistics API → entity snapshot (replace on success).
 * Never writes mock data. Never saves partial/empty snapshots.
 */
export async function syncWbToEntitySnapshot(): Promise<WbSyncResult> {
  if (!hasWbApiToken()) {
    return { ok: false, reason: "not_connected", message: "WB API not connected" };
  }

  const test = await testWbConnection();
  saveWbConnectionCache({
    status: test.status,
    messageKey: test.messageKey,
    checkedAt: Date.now(),
    lastError: test.error,
  });

  if (!test.ok) {
    return {
      ok: false,
      reason: test.status === "disconnected" ? "not_connected" : "api_error",
      message: test.error ?? test.messageKey,
    };
  }

  try {
    const payload = await fetchWbOperationalData();
    const normalizedRows = normalizeWbOperationalData(payload);

    if (normalizedRows.length === 0) {
      return {
        ok: false,
        reason: "empty",
        message: "WB API returned no usable SKU rows for the lookback window",
      };
    }

    const sourceImportId = `wb-api-${payload.fetchedAt}`;
    const snapshot = activateEntitySnapshotFromImport({
      normalizedRows,
      importType: "wb_api_sync",
      sourceImportId,
    });

    saveActiveEntitySnapshot(snapshot);

    saveWbConnectionCache({
      status: "connected",
      messageKey: "wb.conn.connected",
      checkedAt: Date.now(),
    });

    return {
      ok: true,
      snapshotId: snapshot.id,
      rowCount: snapshot.rowCountIncluded,
      skuCount: snapshot.skuEntities.length,
    };
  } catch (err) {
    const message = err instanceof WbApiError ? err.message : err instanceof Error ? err.message : String(err);
    saveWbConnectionCache({
      status: "error",
      messageKey: "wb.conn.error",
      checkedAt: Date.now(),
      lastError: message,
    });
    return { ok: false, reason: "api_error", message };
  }
}
