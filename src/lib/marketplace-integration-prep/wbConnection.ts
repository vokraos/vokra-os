import { getWbConnectionStatus } from "../wb-api";
import type { ConnectionState, MarketplaceConnectionProfile } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function mapWbConnectionState(status: ReturnType<typeof getWbConnectionStatus>["status"]): ConnectionState {
  if (status === "connected") return "connected_readonly";
  if (status === "configured") return "awaiting_credentials";
  if (status === "error") return "awaiting_credentials";
  return "awaiting_credentials";
}

export function patchWbConnectionProfile(
  profile: MarketplaceConnectionProfile,
  t: TFn,
): MarketplaceConnectionProfile {
  if (profile.marketplace !== "wildberries") return profile;
  const conn = getWbConnectionStatus();
  return {
    ...profile,
    connectionState: mapWbConnectionState(conn.status),
    notes: t(conn.messageKey),
    updatedAt: Date.now(),
  };
}

export function isWbApiConnected(): boolean {
  return getWbConnectionStatus().status === "connected";
}
